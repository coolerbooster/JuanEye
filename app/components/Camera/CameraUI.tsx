import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
    onShutter: () => void;
    onToggleFlash: () => void;
    onSettings: () => void;
    iconSize?: number;
    iconOffset?: number;
}

export default function CameraUI({
                                     onShutter,
                                     onToggleFlash,
                                     onSettings,
                                     iconSize = 40,
                                     iconOffset = 80,
                                 }: Props) {
    return (
        <>
            {/* Bottom action bar */}
            <View style={[styles.container, { bottom: iconOffset }]}>
                <Pressable onPress={onSettings} style={styles.iconWrapper}>
                    <Feather name="settings" size={iconSize} color="white" />
                </Pressable>

                <Pressable onPress={onShutter} style={styles.captureBtn}>
                    <View style={styles.shutterBtn} />
                </Pressable>

                <Pressable onPress={onToggleFlash} style={styles.iconWrapper}>
                    <Feather name="zap" size={iconSize} color="white" />
                </Pressable>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 5,
    },
    iconWrapper: {
        // no background for icons
    },
    captureBtn: {
        padding: 0,
    },
    shutterBtn: {
        width: 70,
        height: 70,
        backgroundColor: 'white',
        borderRadius: 35,
    },
});
