import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
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

global.Buffer ||= Buffer;

type Props = { onBackToMenu: () => void };

export default function CameraScreen({ onBackToMenu }: Props) {
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const camRef = useRef<Camera>(null);
    const tf = useTensorflowModel(require('../../../assets/model.tflite'));
    const net = tf.state === 'loaded' ? tf.model : undefined;

    const [showSettings, setShowSettings] = useState(false);
    const [labels, setLabels] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [ocrText, setOcrText] = useState<string | null>(null);
    const [boxes, setBoxes] = useState<any[]>([]);

    useEffect(() => {
        requestPermission();
    }, [requestPermission]);

    useEffect(() => {
        async function loadLabels() {
            const asset = Asset.fromModule(require('../../../assets/labels.txt'));
            await asset.downloadAsync();
            const content = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
            setLabels(content.split(/\r?\n/).map(l => l.trim()).filter(Boolean));
        }
        loadLabels();
    }, []);

    const shoot = useCallback(async () => {
        if (!camRef.current || !net || !labels.length) return;
        setBusy(true);
        try {
            const photo = await camRef.current.takePhoto({});
            const uri = 'file://' + photo.path;
            try {
                const ocr = await MlkitOcr.detectFromUri(uri);
                setOcrText(ocr.map(b => b.text).join(' '));
            } catch {
                setOcrText(null);
            }
            const { uri: resized } = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 640, height: 640 } }],
                { format: ImageManipulator.SaveFormat.JPEG }
            );
            const b64 = await FileSystem.readAsStringAsync(resized, { encoding: FileSystem.EncodingType.Base64 });
            const buf = Buffer.from(b64, 'base64');
            const { data } = jpeg.decode(buf, { useTArray: true });
            const rgb = new Float32Array((data.length / 4) * 3);
            for (let i = 0, j = 0; i < data.length; i += 4) {
                rgb[j++] = data[i] / 255;
                rgb[j++] = data[i + 1] / 255;
                rgb[j++] = data[i + 2] / 255;
            }
            const out = (net as any).runSync([rgb]);
            const bb = decodeBoxes(out[0] as Float32Array, labels);
            setBoxes(bb);
        } catch (e) {
            console.warn(e);
        } finally {
            setBusy(false);
        }
    }, [net, labels]);

    const toggleFlash = useCallback(() => console.log('Toggle flash'), []);
    const onSettings = useCallback(() => setShowSettings(true), []);

    if (showSettings) {
        return (
            <CameraSettings
                pairedDevices={[]}
                onUnpair={() => {}}
                onToggleOCR={() => {}}
                onToggleFilter={() => {}}
                onPairToGuardian={() => {}}
                onSubscribePremium={() => {}}
                onClose={() => setShowSettings(false)}
            />
        );
    }

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
                ref={camRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive
                photo
            />

            <View style={styles.topBlackBar} />
            <View style={styles.bottomBlackBar} />

            {boxes.map((b, i) => (
                <View key={i} style={[styles.box, { left: `${b.x1 * 100}%`, top: `${b.y1 * 100}%`, width: `${(b.x2 - b.x1) * 100}%`, height: `${(b.y2 - b.y1) * 100}%` }]}>
                    <Text style={styles.boxTxt}>{b.clsName} {b.cnf.toFixed(2)}</Text>
                </View>
            ))}

            <CameraUI
                onShutter={shoot}
                onToggleFlash={toggleFlash}
                onSettings={onSettings}
                iconSize={32}
                iconOffset={80}
            />

            <View style={styles.pageIndicatorContainer}>
                <View style={styles.pageDotActive}><Text style={styles.dotText}>1</Text></View>
                <View style={styles.pageDot}><Text style={styles.dotText}>2</Text></View>
                <View style={styles.pageDot}><Text style={styles.dotText}>3</Text></View>
            </View>

            <View style={styles.swipeContainer}>
                <Feather name="chevron-up" size={20} color="white" />
                <Text style={styles.swipeText}>Swipe Up To Settings</Text>
            </View>

            <View style={styles.notificationIconContainer}>
                <Image source={{ uri: 'https://img.icons8.com/ios-filled/50/ffffff/appointment-reminders--v1.png' }} style={styles.notificationIcon} />
            </View>

            {(busy || tf.state === 'loading' || !labels.length) && <ActivityIndicator style={styles.center} size="large" color="white" />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    topBlackBar: { position: 'absolute', top: 0, width: '100%', height: 115, backgroundColor: 'black', zIndex: 1 },
    bottomBlackBar: { position: 'absolute', bottom: 0, width: '100%', height: 160, backgroundColor: 'black', zIndex: 1 },
    box: { position: 'absolute', borderWidth: 2, borderColor: 'yellow' },
    boxTxt: { color: 'yellow', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4 },
    pageIndicatorContainer: { position: 'absolute', bottom: 80, width: '100%', flexDirection: 'row', justifyContent: 'center' },
    pageDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center', margin: 4 },
    pageDotActive: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', margin: 4 },
    dotText: { color: 'black', fontSize: 12, fontWeight: 'bold' },
    swipeContainer: { position: 'absolute', bottom: 60, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    swipeText: { color: 'white', fontSize: 14, marginLeft: 6 },
    notificationIconContainer: { position: 'absolute', top: 60, right: 20, zIndex: 2 },
    notificationIcon: { width: 36, height: 36 },
});
