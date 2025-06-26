import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import jpeg from 'jpeg-js';
import { Buffer } from 'buffer';
import { decodeBoxes } from './Detector';

global.Buffer ||= Buffer;

type Props = {
    onBackToMenu: () => void;
};

export default function CameraScreen({ onBackToMenu }: Props) {
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const camRef = useRef<Camera>(null);
    const tf = useTensorflowModel(require('../../../assets/model.tflite'));
    const net = tf.state === 'loaded' ? tf.model : undefined;

    const [labels, setLabels] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [best, setBest] = useState<string | null>(null);
    const [boxes, setBoxes] = useState<any[]>([]);

    useEffect(() => { requestPermission(); }, []);
    useEffect(() => {
        const loadLabels = async () => {
            const asset = Asset.fromModule(require('../../../assets/labels.txt'));
            await asset.downloadAsync();
            const txt = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
            setLabels(txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean));
        };
        loadLabels();
    }, []);

    const shoot = useCallback(async () => {
        if (!camRef.current || !net || labels.length === 0) return;
        setBusy(true);
        try {
            const p = await camRef.current.takePhoto({});
            const { uri } = await ImageManipulator.manipulateAsync(
                'file://' + p.path,
                [{ resize: { width: 640, height: 640 } }],
                { format: ImageManipulator.SaveFormat.JPEG }
            );
            const buf = Buffer.from(await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }), 'base64');
            const { data } = jpeg.decode(buf, { useTArray: true });
            const rgb = new Float32Array((data.length / 4) * 3);
            for (let i = 0, j = 0; i < data.length; i += 4) {
                rgb[j++] = data[i] / 255;
                rgb[j++] = data[i + 1] / 255;
                rgb[j++] = data[i + 2] / 255;
            }
            const out = net.runSync([rgb]);
            const bb = decodeBoxes(out[0] as Float32Array, labels);
            setBoxes(bb);
            setBest(bb[0]?.clsName ?? null);
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(false);
        }
    }, [net, labels]);

    if (!hasPermission || !device) {
        return <View style={styles.center}><Text>No camera permission or device</Text></View>;
    }

    return (
        <View style={styles.container}>
            <Camera ref={camRef} device={device} isActive photo style={StyleSheet.absoluteFill} />
            {boxes.map((b, i) => (
                <View key={i} style={[
                    styles.box,
                    {
                        left: `${b.x1 * 100}%`,
                        top: `${b.y1 * 100}%`,
                        width: `${(b.x2 - b.x1) * 100}%`,
                        height: `${(b.y2 - b.y1) * 100}%`,
                    }
                ]}>
                    <Text style={styles.boxTxt}>{b.clsName} {b.cnf.toFixed(2)}</Text>
                </View>
            ))}
            <Pressable onPress={shoot} style={styles.shutter}>
                <Text style={{ fontSize: 32 }}>📸</Text>
            </Pressable>
            {best && (
                <View style={styles.badge}>
                    <Text style={styles.badgeTxt}>{best}</Text>
                </View>
            )}
            {(busy || tf.state === 'loading' || labels.length === 0) && (
                <ActivityIndicator size="large" color="white" style={styles.center} />
            )}
            {tf.state === 'error' && (
                <Text style={[styles.center, { color: 'red' }]}>Model error: {tf.error.message}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    shutter: {
        position: 'absolute', bottom: 40, alignSelf: 'center',
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#ffffff88', alignItems: 'center', justifyContent: 'center',
    },
    badge: {
        position: 'absolute', top: 60, alignSelf: 'center',
        backgroundColor: '#000000aa', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 16,
    },
    badgeTxt: { color: '#fff', fontSize: 18 },
    box: {
        position: 'absolute', borderWidth: 2, borderColor: 'red',
    },
    boxTxt: {
        color: '#fff', fontSize: 12, backgroundColor: '#ff0000aa', paddingHorizontal: 2,
    },
});
