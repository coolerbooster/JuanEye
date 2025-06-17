import * as React from 'react';
import {
    View, Text, StyleSheet, Pressable, ActivityIndicator, LogBox,
} from 'react-native';
import {
    Camera, useCameraDevice, useCameraPermission,
} from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import jpeg from 'jpeg-js';

import RoleSelect from './components/RoleSelect';
import LoginScreen from './components/LoginScreen';
import Signup from './components/Signup';

import { Buffer } from 'buffer';
global.Buffer ||= Buffer;

LogBox.ignoreLogs(['Invalid prop `style` supplied to `React.Fragment`']);

type BoundingBox = {
    x1: number; y1: number; x2: number; y2: number;
    cx: number; cy: number; w: number; h: number;
    cnf: number; cls: number; clsName: string;
};

const CONF_TH = 0.3;
const IOU_TH = 0.5;
const INPUT_STD = 255;
const BOXES = 8400;
const CHANS = 84;

async function loadLabels() {
    const asset = Asset.fromModule(require('../assets/labels.txt'));
    await asset.downloadAsync();
    const txt = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
    return txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}

const iou = (a: BoundingBox, b: BoundingBox) => {
    const x1 = Math.max(a.x1, b.x1), y1 = Math.max(a.y1, b.y1);
    const x2 = Math.min(a.x2, b.x2), y2 = Math.min(a.y2, b.y2);
    const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    return inter / (a.w * a.h + b.w * b.h - inter);
};

function nms(boxes: BoundingBox[]) {
    const sorted = [...boxes].sort((a, b) => b.cnf - a.cnf);
    const keep: BoundingBox[] = [];
    while (sorted.length) {
        const first = sorted.shift()!;
        keep.push(first);
        for (let i = sorted.length - 1; i >= 0; i--) {
            if (iou(first, sorted[i]) >= IOU_TH) sorted.splice(i, 1);
        }
    }
    return keep;
}

function decode(out: Float32Array, labels: string[]): BoundingBox[] {
    const list: BoundingBox[] = [];
    for (let c = 0; c < BOXES; c++) {
        let best = CONF_TH, cls = -1;
        for (let j = 4; j < CHANS; j++) {
            const v = out[j * BOXES + c];
            if (v > best) { best = v; cls = j - 4; }
        }
        if (cls === -1) continue;
        const cx = out[c], cy = out[BOXES + c], w = out[BOXES * 2 + c], h = out[BOXES * 3 + c];
        const x1 = cx - w / 2, x2 = cx + w / 2, y1 = cy - h / 2, y2 = cy + h / 2;
        if (x1 < 0 || x2 > 1 || y1 < 0 || y2 > 1) continue;
        list.push({ x1, y1, x2, y2, cx, cy, w, h, cnf: best, cls, clsName: labels[cls] });
    }
    return nms(list);
}

export default function App() {
    const [role, setRole] = React.useState<null | 'user' | 'guardian'>(null);
    const [loggedIn, setLoggedIn] = React.useState(false);
    const [signingUp, setSigningUp] = React.useState(false);

    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const camRef = React.useRef<Camera>(null);

    const tf = useTensorflowModel(require('../assets/model.tflite'));
    const net = tf.state === 'loaded' ? tf.model : undefined;

    const [labels, setLabels] = React.useState<string[]>([]);
    const [busy, setBusy] = React.useState(false);
    const [best, setBest] = React.useState<string | null>(null);
    const [boxes, setBoxes] = React.useState<BoundingBox[]>([]);

    React.useEffect(() => {
        requestPermission();
        loadLabels().then(setLabels);
    }, []);

    const shoot = React.useCallback(async () => {
        if (!camRef.current || !net || labels.length === 0) return;
        setBusy(true);
        try {
            const p = await camRef.current.takePhoto({});
            const { uri } = await ImageManipulator.manipulateAsync(
                'file://' + p.path,
                [{ resize: { width: 640, height: 640 } }],
                { format: ImageManipulator.SaveFormat.JPEG }
            );
            const buf = Buffer.from(
                await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }),
                'base64'
            );
            const { data } = jpeg.decode(buf, { useTArray: true });
            const rgb = new Float32Array((data.length / 4) * 3);
            for (let i = 0, j = 0; i < data.length; i += 4) {
                rgb[j++] = data[i] / INPUT_STD;
                rgb[j++] = data[i + 1] / INPUT_STD;
                rgb[j++] = data[i + 2] / INPUT_STD;
            }
            const out = net.runSync([rgb]);
            const bb = decode(out[0] as Float32Array, labels);
            setBoxes(bb);
            setBest(bb[0]?.clsName ?? null);
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(false);
        }
    }, [net, labels]);

    // Step 1: Role selection
    if (!role) return <RoleSelect onSelect={setRole} />;

    // Step 2: Sign up screen
    if (signingUp) return <Signup onBackToLogin={() => setSigningUp(false)} />;

    // Step 3: Login screen
    if (!loggedIn) {
        return (
            <LoginScreen
                role={role}
                onLogin={() => setLoggedIn(true)}
                onSignUp={() => setSigningUp(true)}
                onBack={() => setRole(null)}
            />
        );
    }

    // Step 4: Guardian placeholder screen
    if (role === 'guardian') {
        return (
            <View style={styles.center}>
                <Text style={{ fontSize: 20 }}>🛡️ Welcome, Guardian!</Text>
            </View>
        );
    }

    // Step 5: User ML camera screen
    if (!hasPermission || !device) {
        return <View style={styles.center}><Text>No camera access</Text></View>;
    }

    return (
        <View style={styles.container}>
            <View style={StyleSheet.absoluteFill}>
                <Camera ref={camRef} device={device} isActive photo style={StyleSheet.absoluteFill} />
            </View>

            {boxes.map((b, i) => (
                <View
                    key={i}
                    style={[
                        styles.box,
                        {
                            left: `${b.x1 * 100}%`,
                            top: `${b.y1 * 100}%`,
                            width: `${(b.x2 - b.x1) * 100}%`,
                            height: `${(b.y2 - b.y1) * 100}%`,
                        },
                    ]}
                >
                    <Text style={styles.boxTxt}>
                        {b.clsName} {b.cnf.toFixed(2)}
                    </Text>
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
                <Text style={[styles.center, { color: 'red' }]}>
                    Model error: {tf.error.message}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    shutter: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#ffffff88',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        backgroundColor: '#000000aa',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeTxt: { color: '#fff', fontSize: 18 },
    box: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: 'red',
    },
    boxTxt: {
        color: '#fff',
        fontSize: 12,
        backgroundColor: '#ff0000aa',
        paddingHorizontal: 2,
    },
});
