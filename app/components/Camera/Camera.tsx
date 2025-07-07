import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    LayoutChangeEvent,
    Alert,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import MlkitOcr from 'react-native-mlkit-ocr';
import { useTensorflowModel } from 'react-native-fast-tflite';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import jpeg from 'jpeg-js';
import { Buffer } from 'buffer';
import { decodeBoxes } from './Detector';
import CameraUI from './CameraUI';
import CameraSettings from './CameraSettings';
import { Feather } from '@expo/vector-icons';
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from '@jamsch/expo-speech-recognition';
import { createLLMPhoto, chatWithHistory } from '../services/authService';

global.Buffer ||= Buffer;

type Props = {
    onBackToMenu: () => void;
    userEmail: string;
};

export default function CameraScreen({ onBackToMenu, userEmail }: Props) {
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const camRef = useRef<Camera>(null);
    const tf = useTensorflowModel(require('../../../assets/model.tflite'));
    const net = tf.state === 'loaded' ? tf.model : undefined;

    const [ocrEnabled, setOcrEnabled]       = useState(true);
    const [mlEnabled, setMlEnabled]         = useState(true);
    const [filterEnabled, setFilterEnabled] = useState(false);

    const [labels, setLabels]       = useState<string[]>([]);
    const [ocrText, setOcrText]     = useState<string | null>(null);
    const [boxes, setBoxes]         = useState<any[]>([]);
    const [busy, setBusy]           = useState(false);

    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [layout, setLayout]           = useState({ width: 0, height: 0 });

    const [recognizing, setRecognizing] = useState(false);
    const [speechText, setSpeechText]   = useState<string>('');
    useSpeechRecognitionEvent('start',  () => setRecognizing(true));
    useSpeechRecognitionEvent('end',    () => setRecognizing(false));
    useSpeechRecognitionEvent('result', e => setSpeechText(e.results.map(r => r.transcript).join(' ')));
    useSpeechRecognitionEvent('error',  e => {
        console.warn('Speech error:', e.error, e.message);
        setRecognizing(false);
    });

    // chat state
    const [conversationId, setConversationId] = useState<string | undefined>(undefined);
    const [chatAnswer, setChatAnswer]         = useState<string>('');

    const doUpload = false;

    useEffect(() => {
        console.log('[CameraScreen] mounted with userEmail:', userEmail);
        requestPermission();
        ExpoSpeechRecognitionModule.requestPermissionsAsync().then(r => {
            if (!r.granted) console.warn('Speech permissions not granted', r);
        });
    }, [requestPermission, userEmail]);

    useEffect(() => {
        async function loadLabels() {
            const asset = Asset.fromModule(require('../../../assets/labels.txt'));
            await asset.downloadAsync();
            const txt = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
            setLabels(txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean));
        }
        loadLabels();
    }, []);

    const handleSpeechPressIn = () => ExpoSpeechRecognitionModule.start({
        lang: 'en-US', interimResults: true, continuous: false,
        requiresOnDeviceRecognition: false, addsPunctuation: false,
    });
    const handleSpeechPressOut = async () => {
        await ExpoSpeechRecognitionModule.stop();
        if (speechText.trim()) {
            await sendToChat(speechText);
        }
    };

    async function sendToChat(text: string) {
        try {
            const base64 = capturedUri
                ? await FileSystem.readAsStringAsync(capturedUri, { encoding: FileSystem.EncodingType.Base64 })
                : undefined;
            const resp = await chatWithHistory(text, base64, conversationId);
            if (resp.conversationId && !conversationId) {
                setConversationId(resp.conversationId);
            }
            setChatAnswer(resp.answer);
        } catch (err: any) {
            console.error(err);
            Alert.alert('Chat Error', err.message);
        }
    }

    const shoot = useCallback(async () => {
        if (!camRef.current) return;
        setBusy(true);
        try {
            const photo = await camRef.current.takePhoto({});
            const uri = 'file://' + photo.path;

            // OCR
            if (ocrEnabled) {
                try {
                    const ocr = await MlkitOcr.detectFromUri(uri);
                    setOcrText(ocr.map(b => b.text).join(' '));
                } catch {
                    setOcrText(null);
                }
            } else {
                setOcrText(null);
            }

            if (recognizing) await ExpoSpeechRecognitionModule.stop();

            // ML inference
            if (mlEnabled && net) {
                const { uri: rsz } = await ImageManipulator.manipulateAsync(
                    uri,
                    [{ resize: { width: 640, height: 640 } }],
                    { format: ImageManipulator.SaveFormat.JPEG }
                );
                const b64 = await FileSystem.readAsStringAsync(rsz, { encoding: FileSystem.EncodingType.Base64 });
                const buf = Buffer.from(b64, 'base64');
                const { data } = jpeg.decode(buf, { useTArray: true });
                const rgb = new Float32Array((data.length / 4) * 3);
                for (let i = 0, j = 0; i < data.length; i += 4) {
                    rgb[j++] = data[i]   / 255;
                    rgb[j++] = data[i+1] / 255;
                    rgb[j++] = data[i+2] / 255;
                }
                const out = (net as any).runSync([rgb]);
                setBoxes(decodeBoxes(out[0] as Float32Array, labels));
            } else {
                setBoxes([]);
            }

            setCapturedUri(uri);

            // AUTO UPLOAD if enabled
            if (doUpload) {
                try {
                    const filename = uri.split('/').pop() || 'photo.jpg';
                    const media    = { uri, name: filename, type: 'image/jpeg' };
                    let description = 'Camera Photo';
                    if (mlEnabled && boxes.length) {
                        description = Array.from(new Set(boxes.map(b => b.clsName))).join(', ');
                    }
                    const resp = await createLLMPhoto(description, media, userEmail);
                    Alert.alert('Upload Success', `Scan ID: ${resp.llm_id}`);
                } catch (err: any) {
                    console.error(err);
                    Alert.alert('Upload Failed', err.message);
                }
            }
        } catch (e) {
            console.warn(e);
        } finally {
            setBusy(false);
        }
    }, [ocrEnabled, mlEnabled, recognizing, net, labels, userEmail, boxes, doUpload]);

    const toggleFlash = useCallback(() => console.log('Toggle flash'), []);
    const [showSettings, setSettings] = useState(false);

    // PREVIEW MODE
    if (capturedUri) {
        return (
            <View style={styles.previewContainer}>
                <View
                    style={styles.previewImageWrapper}
                    onLayout={(e: LayoutChangeEvent) =>
                        setLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
                    }
                >
                    <Image source={{ uri: capturedUri }} style={styles.previewImage} />
                    {mlEnabled && layout.width > 0 && boxes.map((b, i) => (
                        <View
                            key={i}
                            style={{
                                position:'absolute',
                                borderWidth:2,
                                borderColor:'yellow',
                                left:   b.x1 * layout.width,
                                top:    b.y1 * layout.height,
                                width:  (b.x2 - b.x1) * layout.width,
                                height: (b.y2 - b.y1) * layout.height,
                            }}
                        >
                            <Text style={styles.boxTxt}>{b.clsName} {b.cnf.toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.backPreviewButton}
                    onPress={() => {
                        setCapturedUri(null);
                        setOcrText(null);
                        setSpeechText('');
                        setBoxes([]);
                        setConversationId(undefined);
                        setChatAnswer('');
                    }}
                >
                    <Feather name="arrow-left" size={28} color="white" />
                </TouchableOpacity>

                <View style={styles.recordBtnContainer}>
                    <TouchableOpacity onPressIn={handleSpeechPressIn} onPressOut={handleSpeechPressOut}>
                        <Feather name="mic" size={36} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.speechHint}>{recognizing ? 'Release to stop' : 'Hold to record'}</Text>
                </View>

                {ocrEnabled && ocrText != null && (
                    <View style={styles.ocrOverlay}>
                        <Text style={styles.overlayLabel}>OCR:</Text>
                        <Text style={styles.overlayText}>{ocrText}</Text>
                    </View>
                )}

                {speechText !== '' && (
                    <View style={[styles.textOverlay, { bottom: 200 }]}>
                        <Text style={styles.overlayLabel}>You:</Text>
                        <Text style={styles.overlayText}>{speechText}</Text>
                    </View>
                )}

                {chatAnswer !== '' && (
                    <View style={[styles.textOverlay, { bottom: 140 }]}>
                        <Text style={styles.overlayLabel}>Assistant:</Text>
                        <Text style={styles.overlayText}>{chatAnswer}</Text>
                    </View>
                )}
            </View>
        );
    }

    // LIVE CAMERA MODE
    if (showSettings) {
        return (
            <CameraSettings
                pairedDevices={[]}
                onUnpair={() => {}}
                ocrEnabled={ocrEnabled}
                mlEnabled={mlEnabled}
                filterEnabled={filterEnabled}
                onToggleOCR={setOcrEnabled}
                onToggleML={setMlEnabled}
                onToggleFilter={setFilterEnabled}
                onPairToGuardian={() => {}}
                onSubscribePremium={() => {}}
                onClose={() => setSettings(false)}
            />
        );
    }

    if (!hasPermission || !device) {
        return <View style={styles.center}><Text>No camera permission</Text></View>;
    }

    return (
        <View style={styles.container}>
            <Camera
                ref={camRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive
                photo
            />

            <View style={styles.topBlackBar} />
            <View style={styles.bottomBlackBar} />

            <CameraUI
                onShutter={shoot}
                onToggleFlash={toggleFlash}
                onSettings={() => setSettings(true)}
                iconSize={32}
                iconOffset={80}
            />

            {(busy || tf.state === 'loading' || !labels.length) && (
                <ActivityIndicator style={styles.center} size="large" color="white" />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    ocrOverlay: {
        position: 'absolute',
        left: 20,
        right: 20,
        top: '15%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        borderRadius: 6,
    },
    container:            { flex: 1, backgroundColor: 'black' },
    center:               { flex: 1, alignItems: 'center', justifyContent: 'center' },
    topBlackBar:          { position:'absolute', top:0, width:'100%', height:115, backgroundColor:'black', zIndex:1 },
    bottomBlackBar:       { position:'absolute', bottom:0, width:'100%', height:160, backgroundColor:'black', zIndex:1 },
    previewContainer:     { flex:1, backgroundColor:'black' },
    previewImageWrapper:  { flex:1, overflow:'hidden' },
    previewImage:         { width:'100%', height:'100%', resizeMode:'contain' },
    boxTxt:               { color:'yellow', fontSize:12, backgroundColor:'rgba(0,0,0,0.6)', padding:4 },
    backPreviewButton:    { position:'absolute', top:50, left:20, zIndex:2 },
    recordBtnContainer:   { position:'absolute', bottom:80, alignSelf:'center', alignItems:'center', zIndex:2 },
    speechHint:           { color:'white', fontSize:12, marginTop:4 },
    textOverlay:          { position:'absolute', left:20, right:20, backgroundColor:'rgba(0,0,0,0.6)', padding:8, borderRadius:6 },
    overlayLabel:         { color:'white', fontWeight:'bold' },
    overlayText:          { color:'white', marginTop:4 },
});
