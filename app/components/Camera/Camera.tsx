// CameraScreen.tsx
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
    ScrollView,
    Pressable,
    Animated,
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
import * as Speech from 'expo-speech'; // expo-speech import

import {
    chatWithHistory,
    StreamFragment,
} from '../services/authService';

import {
    Grayscale,
    Sepia,
    Invert,
    Contrast,
    Brightness,
} from 'react-native-color-matrix-image-filters';

global.Buffer ||= Buffer;

// helper to sanitize LLM responses by removing asterisks
const sanitizeText = (text: string) => text.replace(/\*/g, '');

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

    // TTS voice for Filipino accent
    const [voice, setVoice] = useState<string | null>(null);
    useEffect(() => {
        Speech.getAvailableVoicesAsync()
            .then(voices => {
                const ph = voices.find(v =>
                    v.language.startsWith('fil') ||
                    v.language.startsWith('tl') ||
                    v.language.includes('-PH')
                );
                if (ph) setVoice(ph.identifier);
            })
            .catch(console.warn);
    }, []);
    const ttsOptions = voice ? { voice } : {};

    // toggles
    const [ocrEnabled, setOcrEnabled] = useState(false);
    const [mlEnabled, setMlEnabled] = useState(false);
    const [filterEnabled, setFilterEnabled] = useState(false);
    const [llmEnabled, setLlmEnabled] = useState(true);
    const [torchEnabled, setTorchEnabled] = useState(false); // added torch state

    // filter cycle
    const filterOrder = ['none','grayscale','sepia','invert','contrast','brightness'] as const;
    const [filterType, setFilterType] = useState<typeof filterOrder[number]>('none');
    const cycleFilter = () => {
        const idx = filterOrder.indexOf(filterType);
        setFilterType(filterOrder[(idx + 1) % filterOrder.length]);
    };

    // ML / OCR state
    const [labels, setLabels] = useState<string[]>([]);
    const [ocrText, setOcrText] = useState<string | null>(null);
    const [boxes, setBoxes] = useState<any[]>([]);
    const [busy, setBusy] = useState(false);

    // captured image
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [layout, setLayout] = useState({ width: 0, height: 0 });

    // speech-to-text
    const [recognizing, setRecognizing] = useState(false);
    const [speechText, setSpeechText] = useState<string>('');
    const speechRef = useRef<string>('');

    // chat state
    const [conversationId, setConversationId] = useState<string|undefined>(undefined);
    const [chatFragments, setChatFragments] = useState<string[]>([]);
    const [streaming, setStreaming] = useState(false);
    const [pendingResponse, setPendingResponse] = useState(false);

    // helper for delays
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // speech event handlers
    useSpeechRecognitionEvent('start', () => setRecognizing(true));
    useSpeechRecognitionEvent('end', () => setRecognizing(false));
    useSpeechRecognitionEvent('error', e => {
        console.warn('Speech error:', e.error, e.message);
        setRecognizing(false);
    });
    useSpeechRecognitionEvent('result', e => {
        const transcript = e.results.map(r => r.transcript).join(' ');
        speechRef.current = transcript;
        setSpeechText(transcript);
    });

    const handleSpeechPressIn = () => {
        Speech.stop();               // stop any ongoing TTS when mic is pressed again
        setStreaming(false);         // reset streaming flag
        setPendingResponse(false);   // reset pending flag
        setChatFragments([]);        // clear any previous fragments
        setSpeechText('');
        speechRef.current = '';
        ExpoSpeechRecognitionModule.start({
            lang: 'en-US',
            interimResults: true,
            continuous: false,
            requiresOnDeviceRecognition: false,
            addsPunctuation: false,
        });
    };

    // ← Updated: append OCR text when enabled
    const handleSpeechPressOut = async () => {
        Speech.stop();               // ensure TTS is halted before sending
        await ExpoSpeechRecognitionModule.stop();
        await delay(500);
        const final = speechRef.current.trim();
        // build the full text, including OCR if enabled
        let textToSend = final;
        if (ocrEnabled && ocrText) {
            textToSend += ` OCR:"${ocrText}"`;
        }
        if (textToSend && llmEnabled) {
            setSpeechText(final);
            await delay(2500);
            sendToChat(textToSend, false);
        }
    };

    // permissions
    useEffect(() => {
        requestPermission();
        ExpoSpeechRecognitionModule.requestPermissionsAsync()
            .then(r => { if (!r.granted) console.warn('Speech permissions not granted', r); });
    }, [requestPermission]);

    // load labels
    useEffect(() => {
        async function loadLabels() {
            const asset = Asset.fromModule(require('../../../assets/labels.txt'));
            await asset.downloadAsync();
            const txt = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
            setLabels(txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean));
        }
        loadLabels();
    }, []);

    async function sendToChat(text: string, useStream = false) {
        console.log('sendToChat()', { text, useStream, conversationId });
        setChatFragments([]);
        setPendingResponse(true);
        if (useStream) setStreaming(true);

        const base64String = capturedUri
            ? await FileSystem.readAsStringAsync(capturedUri, { encoding: FileSystem.EncodingType.Base64 })
            : undefined;

        try {
            const result = await chatWithHistory(
                text,
                base64String,
                conversationId,
                useStream,
                (frag: StreamFragment) => {
                    if (frag.conversationId) setConversationId(frag.conversationId);
                    if (typeof frag.answer === 'string') {
                        const clean = sanitizeText(frag.answer);
                        setChatFragments(prev => {
                            const last = prev[prev.length - 1];
                            if (clean !== last) {
                                Speech.speak(clean, ttsOptions);
                                return [...prev, clean];
                            }
                            return prev;
                        });
                    }
                    if (frag.done) {
                        setStreaming(false);
                        setPendingResponse(false);
                    }
                }
            );

            if (!useStream && result?.data?.answer) {
                const { answer, conversationId: newConvId } = result.data;
                const cleanAnswer = sanitizeText(answer);
                if (newConvId) setConversationId(newConvId);
                setChatFragments([cleanAnswer]);
                Speech.speak(cleanAnswer, ttsOptions);
                setPendingResponse(false);
            }
        } catch (err: any) {
            console.error('🚨 chatWithHistory error', err);
            Alert.alert('Chat Error', err.message);
            setStreaming(false);
            setPendingResponse(false);
        }
    }

    // photo capture + OCR/ML
    const shoot = useCallback(async () => {
        if (!camRef.current) return;
        setBusy(true);
        try {
            const photo = await camRef.current.takePhoto({});
            const uri = 'file://' + photo.path;

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

            if (recognizing) {
                await ExpoSpeechRecognitionModule.stop();
            }

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
                    rgb[j++] = data[i] / 255;
                    rgb[j++] = data[i + 1] / 255;
                    rgb[j++] = data[i + 2] / 255;
                }
                const out = (net as any).runSync([rgb]);
                setBoxes(decodeBoxes(out[0] as Float32Array, labels));
            } else {
                setBoxes([]);
            }

            setCapturedUri(uri);
        } catch (e) {
            console.warn(e);
        } finally {
            setBusy(false);
        }
    }, [ocrEnabled, mlEnabled, recognizing, net, labels]);

    const toggleFlash = useCallback(() => setTorchEnabled(prev => !prev), []); // toggles torch
    const [showSettings, setSettings] = useState(false);

    // —— PREVIEW MODE ——
    if (capturedUri) {
        const FilteredImage = () => {
            const img = <Image source={{ uri: capturedUri }} style={styles.previewImage}/>;
            switch (filterType) {
                case 'grayscale':  return <Grayscale>{img}</Grayscale>;
                case 'sepia':      return <Sepia>{img}</Sepia>;
                case 'invert':     return <Invert>{img}</Invert>;
                case 'contrast':   return <Contrast amount={2}>{img}</Contrast>;
                case 'brightness': return <Brightness amount={1.5}>{img}</Brightness>;
                default:           return img;
            }
        };

        return (
            <View style={styles.previewContainer}>
                <Pressable
                    style={styles.previewImageWrapper}
                    onPress={cycleFilter}
                    onLayout={(e) => setLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
                >
                    <FilteredImage/>
                    {mlEnabled && layout.width > 0 && boxes.map((b,i) => (
                        <View
                            key={i}
                            style={{
                                position:'absolute', borderWidth:2, borderColor:'yellow',
                                left:   b.x1 * layout.width,
                                top:    b.y1 * layout.height,
                                width:  (b.x2 - b.x1) * layout.width,
                                height: (b.y2 - b.y1) * layout.height,
                            }}
                        >
                            <Text style={styles.boxTxt}>{b.clsName} {b.cnf.toFixed(2)}</Text>
                        </View>
                    ))}
                </Pressable>

                <View style={styles.filterBar}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {filterOrder.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[ styles.filterButton, filterType===type && styles.filterButtonActive ]}
                                onPress={() => setFilterType(type)}
                            >
                                <Text style={[ styles.filterText, filterType===type && styles.filterTextActive ]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <TouchableOpacity
                    style={styles.backPreviewButton}
                    onPress={() => {
                        Speech.stop();            // stop any ongoing TTS
                        setCapturedUri(null);
                        setOcrText(null);
                        setSpeechText('');
                        setBoxes([]);
                        setConversationId(undefined);
                        setChatFragments([]);
                        setFilterType('none');
                        setPendingResponse(false);
                        setStreaming(false);      // ensure streaming flag is cleared
                    }}
                >
                    <Feather name="arrow-left" size={28} color="white"/>
                </TouchableOpacity>

                {llmEnabled && (
                    <View style={styles.recordBtnContainer}>
                        <TouchableOpacity
                            onPressIn={handleSpeechPressIn}
                            onPressOut={handleSpeechPressOut}
                            disabled={streaming}
                            style={[
                                styles.micButton,
                                pendingResponse && styles.micButtonActive,
                                recognizing && styles.micButtonRecording
                            ]}
                        >
                            <Feather
                                name="mic"
                                size={36}
                                color="white"
                            />
                        </TouchableOpacity>
                        <Text style={styles.speechHint}>
                            {recognizing ? 'Release to stop' : 'Hold to record'}
                        </Text>
                    </View>
                )}

                {(speechText !== '' || chatFragments.length > 0) && (
                    <View style={[styles.textOverlay, { bottom: 140 }]}>
                        {speechText !== '' && (
                            <>
                                <Text style={styles.overlayLabel}>You:</Text>
                                <Text style={styles.overlayText}>{speechText}</Text>
                            </>
                        )}
                        {chatFragments.length > 0 && (
                            <>
                                <Text style={styles.overlayLabel}>Assistant:</Text>
                                <Text style={styles.overlayText}>{chatFragments.join(' ')}</Text>
                            </>
                        )}
                    </View>
                )}
            </View>
        );
    }

    // —— SETTINGS MODE ——
    if (showSettings) {
        return (
            <CameraSettings
                pairedDevices={[]}
                onUnpair={() => {}}
                ocrEnabled={ocrEnabled}
                mlEnabled={mlEnabled}
                filterEnabled={filterEnabled}
                llmEnabled={llmEnabled}
                onToggleOCR={setOcrEnabled}
                onToggleML={setMlEnabled}
                onToggleFilter={setFilterEnabled}
                onToggleLLM={setLlmEnabled}
                onPairToGuardian={() => {}}
                onSubscribePremium={() => {}}
                onClose={() => setSettings(false)}
            />
        );
    }

    // —— LIVE CAMERA MODE ——
    if (!hasPermission || !device) {
        return (
            <View style={styles.center}>
                <Text>No camera permission</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Camera
                photoQualityBalance="quality"
                ref={camRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive
                photo
                torch={torchEnabled ? 'on' : 'off'} // apply torch state
            />
            <View style={styles.topBlackBar}/>
            <View style={styles.bottomBlackBar}/>
            <CameraUI
                onShutter={shoot}
                onToggleFlash={toggleFlash}
                onSettings={() => setSettings(true)}
                iconSize={32}
                iconOffset={80}
            />
            {(busy || tf.state==='loading' || !labels.length) && (
                <ActivityIndicator style={styles.center} size="large" color="white"/>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    ocrOverlay: {
        position:'absolute', left:20, right:20, top:'15%',
        backgroundColor:'rgba(0,0,0,0.6)', padding:8, borderRadius:6,
    },
    container:            { flex:1, backgroundColor:'black' },
    center:               { flex:1, alignItems:'center', justifyContent:'center' },
    topBlackBar:          { position:'absolute', top:0, width:'100%', height:115, backgroundColor:'black', zIndex:1 },
    bottomBlackBar:       { position:'absolute', bottom:0, width:'100%', height:160, backgroundColor:'black', zIndex:1 },
    previewContainer:     { flex:1, backgroundColor:'black' },
    previewImageWrapper:  { flex:1, overflow:'hidden' },
    previewImage:         { width:'100%', height:'100%', resizeMode:'contain' },
    boxTxt:               { color:'yellow', fontSize:12, backgroundColor:'rgba(0,0,0,0.6)', padding:4 },
    backPreviewButton:    { position:'absolute', top:50, left:20, zIndex:2 },
    recordBtnContainer:   {
        position:'absolute',
        bottom:80,
        alignSelf:'center',
        alignItems:'center',
        zIndex:2
    },
    // ---- Updated mic button styles ----
    micButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#2196F3',        // solid blue circle
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    micButtonActive: {
        backgroundColor: '#1976D2',        // darker blue on press
    },
    micButtonRecording: {
        backgroundColor: '#1565C0',        // even darker when recording
    },
    speechHint:           { color:'white', fontSize:12, marginTop:6 },
    textOverlay:          { position:'absolute', left:20, right:20, backgroundColor:'rgba(0,0,0,0.6)', padding:8, borderRadius:6 },
    overlayLabel:         { color:'white', fontWeight:'bold' },
    overlayText:          { color:'white', marginTop:4 },
    filterBar:            { position:'absolute', bottom:0, width:'100%', paddingVertical:8, backgroundColor:'rgba(0,0,0,0.6)', zIndex:2 },
    filterButton:         { paddingHorizontal:10, paddingVertical:4, borderRadius:4, borderWidth:1, borderColor:'white', marginHorizontal:6 },
    filterButtonActive:   { backgroundColor:'white' },
    filterText:           { color:'white', fontSize:12 },
    filterTextActive:     { color:'black' },
});
