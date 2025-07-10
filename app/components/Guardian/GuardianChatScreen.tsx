// src/components/GuardianChatScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    Platform,
    Image,
} from 'react-native';
import {
    GestureHandlerRootView,
    PinchGestureHandler,
    PanGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import {
    guardianChat,
    getConversationImage,
    getConversationHistory,
    GuardianStreamFragment,
} from '../services/authService';
import { RouteProp } from '@react-navigation/native';
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from '@jamsch/expo-speech-recognition';
import * as Speech from 'expo-speech';

// helper to strip asterisks from LLM responses
const sanitizeText = (text: string) => text.replace(/\*/g, '');

// Props passed from navigation
type Props = {
    route: RouteProp<
        {
            params: {
                targetUserId: number;
                conversationId: string;
                initialQuestion: string;
            };
        },
        'params'
    >;
    navigation: { goBack: () => void };
};

type Message = { role: 'user' | 'assistant'; text: string };

const GuardianChatScreen: React.FC<Props> = ({ route, navigation }) => {
    const { targetUserId, conversationId, initialQuestion } = route.params;
    const [initialImage, setInitialImage] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'user', text: initialQuestion },
    ]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [speechToTextEnabled, setSpeechToTextEnabled] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const flatRef = useRef<FlatList<Message>>(null);

    // TTS voice for Filipino accent
    const [voice, setVoice] = useState<string | null>(null);
    useEffect(() => {
        Speech.getAvailableVoicesAsync()
            .then(voices => {
                const ph = voices.find(v =>
                    v.language?.startsWith('fil') ||
                    v.language?.startsWith('tl') ||
                    v.language?.includes('-PH')
                );
                if (ph) {
                    console.log('[TTS] Using Tagalog voice:', ph.identifier);
                    setVoice(ph.identifier);
                } else {
                    console.warn('[TTS] No Tagalog voice found. Falling back to default.');
                    setVoice(null); // fallback to system default
                }
            })
            .catch(err => {
                console.warn('[TTS] Error fetching voices, falling back to default:', err);
                setVoice(null); // fallback to system default
            });
    }, []);
    const ttsOptions = voice ? { voice } : {};

    // PINCH + PAN shared values
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const pinchHandler = useAnimatedGestureHandler({
        onStart: (_, ctx: any) => {
            ctx.startScale = scale.value;
        },
        onActive: (event, ctx: any) => {
            // @ts-ignore
            scale.value = ctx.startScale * event.scale;
        },
    });

    const panHandler = useAnimatedGestureHandler({
        onStart: (_, ctx: any) => {
            ctx.startX = translateX.value;
            ctx.startY = translateY.value;
        },
        onActive: (event, ctx: any) => {
            translateX.value = ctx.startX + event.translationX;
            translateY.value = ctx.startY + event.translationY;
        },
    });

    const animatedImageStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    const zoomIn = () => {
        scale.value = withTiming(scale.value + 0.5, { duration: 200 });
    };
    const zoomOut = () => {
        scale.value = withTiming(Math.max(1, scale.value - 0.5), { duration: 200 });
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
    };

    // fetch the single most recent image for this conversation
    useEffect(() => {
        (async () => {
            try {
                const { image: raw } = await getConversationImage(conversationId);

                const binary = atob(raw);
                const byte1 = binary.charCodeAt(0);
                const byte2 = binary.charCodeAt(1);

                // JPEG starts with 0xFF 0xD8, PNG starts with 0x89 'P'
                const mime =
                    byte1 === 0xFF && byte2 === 0xD8
                        ? 'image/jpeg'
                        : byte1 === 0x89 && binary[1] === 'P'
                            ? 'image/png'
                            : 'application/octet-stream';

                const prefix = `data:${mime};base64,`;
                setInitialImage(prefix + raw);
            } catch (err) {
                console.warn('Failed to load conversation image', err);
            }
        })();
    }, [conversationId]);

    // fetch the full conversation (excluding the very first user msg)
    useEffect(() => {
        (async () => {
            try {
                const { messages: history } = await getConversationHistory(
                    conversationId
                );
                const mapped = history.map((h) => ({
                    role: h.role,
                    text: sanitizeText(h.content),
                }));
                setMessages([{ role: 'user', text: initialQuestion }, ...mapped]);
                setTimeout(() => flatRef.current?.scrollToEnd(), 100);
            } catch (err) {
                console.warn('Failed to load conversation history', err);
            }
        })();
    }, [conversationId, initialQuestion]);

    // Speech-to-text result event
    useSpeechRecognitionEvent('result', (event) => {
        const transcript = event.results[0]?.transcript || '';
        setInput(transcript);
    });
    useSpeechRecognitionEvent('end', () => {
        setIsRecording(false);
    });

    const handleMicPress = async () => {
        if (isRecording) {
            ExpoSpeechRecognitionModule.stop();
            setIsRecording(false);
        } else {
            const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!perm.granted) return;
            setIsRecording(true);
            ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: false,
                continuous: false,
            });
        }
    };

    const send = async () => {
        if (!input.trim()) return;
        setMessages((prev) => [...prev, { role: 'user', text: input }]);
        setInput('');
        setStreaming(true);
        try {
            const response = await guardianChat(
                targetUserId,
                input,
                undefined,
                conversationId,
                false,
                (frag: GuardianStreamFragment) => {
                    if (frag.done) {
                        setStreaming(false);
                        return;
                    }
                    setMessages((prev) => {
                        const sanitized = sanitizeText(frag.answer || '');
                        const last = prev[prev.length - 1];
                        if (last.role === 'assistant') {
                            last.text += sanitized;
                            return [...prev.slice(0, -1), last];
                        } else {
                            return [...prev, { role: 'assistant', text: sanitized }];
                        }
                    });
                    setTimeout(() => flatRef.current?.scrollToEnd(), 50);
                }
            );
            if (response.ok && response.data) {
                const cleaned = sanitizeText(response.data.answer);
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', text: cleaned },
                ]);
                if (ttsEnabled) Speech.speak(cleaned, ttsOptions);
            }
        } catch (err: any) {
            console.error('[GuardianChat] Error:', err);
        } finally {
            setStreaming(false);
            setTimeout(() => flatRef.current?.scrollToEnd(), 50);
        }
    };

    useEffect(() => {
        setTimeout(() => flatRef.current?.scrollToEnd(), 100);
    }, [messages]);

    // === FULL-SCREEN IMAGE VIEW ===
    if (viewingImage && initialImage) {
        // @ts-ignore
        return (
            <GestureHandlerRootView style={styles.fullImageContainer}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => setViewingImage(false)}
                        hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                    >
                        <Text style={styles.back}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.fullImageTitle}>Image</Text>
                    <View style={{ width: 48 }} />
                </View>

                <PanGestureHandler onGestureEvent={panHandler}>
                    <Animated.View style={{ flex: 1 }}>
                        <PinchGestureHandler onGestureEvent={pinchHandler}>
                            <Animated.Image
                                source={{ uri: initialImage }}
                                style={[styles.fullImage, animatedImageStyle]}
                                resizeMode="contain"
                            />
                        </PinchGestureHandler>
                    </Animated.View>
                </PanGestureHandler>

                <View style={styles.zoomControls}>
                    <TouchableOpacity onPress={zoomIn} style={styles.zoomBtn}>
                        <Text style={styles.zoomText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={zoomOut} style={styles.zoomBtn}>
                        <Text style={styles.zoomText}>−</Text>
                    </TouchableOpacity>
                </View>
            </GestureHandlerRootView>
        );
    }

    // === NORMAL CHAT VIEW ===
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        Speech.stop();
                        navigation.goBack();
                    }}
                    hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                >
                    <Text style={styles.back}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Guardian Chat</Text>
                <TouchableOpacity
                    style={styles.toggleBtn}
                    onPress={() => {
                        setTtsEnabled((prev) => {
                            if (prev) Speech.stop();
                            return !prev;
                        });
                    }}
                    hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                >
                    <Text style={styles.toggleText}>
                        {ttsEnabled ? 'TTS On' : 'TTS Off'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.toggleBtn}
                    onPress={() => setSpeechToTextEnabled((prev) => !prev)}
                    hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                >
                    <Text style={styles.toggleText}>
                        {speechToTextEnabled ? 'STT On' : 'STT Off'}
                    </Text>
                </TouchableOpacity>
            </View>

            {initialImage && (
                <TouchableOpacity onPress={() => setViewingImage(true)}>
                    <Image source={{ uri: initialImage }} style={styles.initialImage} />
                </TouchableOpacity>
            )}

            <FlatList
                ref={flatRef}
                data={messages}
                keyExtractor={(_, i) => i.toString()}
                contentContainerStyle={{ padding: 16, paddingTop: 0 }}
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.bubble,
                            item.role === 'user' ? styles.userBubble : styles.botBubble,
                        ]}
                    >
                        <Text style={styles.speakerText}>
                            {item.role === 'assistant' ? 'JuanEye AI' : 'Guardian'}
                        </Text>
                        <Text style={styles.bubbleText}>{item.text}</Text>
                    </View>
                )}
                style={styles.list}
            />

            {streaming && (
                <ActivityIndicator size="small" color="#1786d9" style={styles.loader} />
            )}

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={input}
                    placeholder="Ask a question…"
                    onChangeText={setInput}
                    editable={!streaming && !isRecording}
                />
                {speechToTextEnabled && (
                    <TouchableOpacity onPress={handleMicPress} style={styles.micBtn}>
                        <Text style={styles.micText}>{isRecording ? '■' : '🎤'}</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[
                        styles.sendBtn,
                        (!input.trim() || streaming) && styles.sendBtnDisabled,
                    ]}
                    onPress={send}
                    disabled={!input.trim() || streaming}
                >
                    <Text style={styles.sendText}>{streaming ? '…' : 'Send'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default GuardianChatScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! : 0,
        borderBottomWidth: 1,
        borderColor: '#ddd',
        backgroundColor: 'white',
        zIndex: 1,
        elevation: 2,
    },
    back: {
        fontSize: 16,
        color: '#1786d9',
        marginRight: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    toggleBtn: {
        marginLeft: 8,
        padding: 6,
        borderRadius: 4,
        backgroundColor: '#eee',
    },
    toggleText: {
        fontSize: 12,
        color: '#333',
    },
    initialImage: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
    },
    fullImageContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    fullImageTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        color: 'white',
    },
    fullImage: {
        flex: 1,
        width: '100%',
    },
    zoomControls: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        flexDirection: 'row',
    },
    zoomBtn: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        marginLeft: 10,
        padding: 10,
        borderRadius: 20,
    },
    zoomText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
    },
    bubble: {
        marginVertical: 4,
        padding: 10,
        borderRadius: 8,
        maxWidth: '80%',
    },
    userBubble: {
        backgroundColor: '#e1f5fe',
        alignSelf: 'flex-end',
    },
    botBubble: {
        backgroundColor: '#f1f1f1',
        alignSelf: 'flex-start',
    },
    speakerText: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        color: '#666',
    },
    bubbleText: { fontSize: 14, color: '#000' },
    loader: { marginVertical: 8 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#ddd',
        padding: 8,
    },
    input: {
        flex: 1,
        marginRight: 8,
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    micBtn: {
        padding: 8,
        marginRight: 8,
    },
    micText: {
        fontSize: 18,
    },
    sendBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#1786d9',
        borderRadius: 20,
    },
    sendBtnDisabled: {
        backgroundColor: '#aaa',
    },
    sendText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
