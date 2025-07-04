import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PairedDevice {
    id: string;
    email: string;
}

interface CameraSettingsProps {
    pairedDevices: PairedDevice[];
    onUnpair: (id: string) => void;
    onToggleOCR: (enabled: boolean) => void;
    onToggleFilter: (enabled: boolean) => void;
    onPairToGuardian: () => void;
    onSubscribePremium: () => void;
    onClose: () => void;
}

export default function CameraSettings({
                                           pairedDevices,
                                           onUnpair,
                                           onToggleOCR,
                                           onToggleFilter,
                                           onPairToGuardian,
                                           onSubscribePremium,
                                           onClose,
                                       }: CameraSettingsProps) {
    const [ocrEnabled, setOcrEnabled] = useState(false);
    const [filterEnabled, setFilterEnabled] = useState(false);

    const handleOCR = (value: boolean) => {
        setOcrEnabled(value);
        onToggleOCR(value);
    };

    const handleFilter = (value: boolean) => {
        setFilterEnabled(value);
        onToggleFilter(value);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>


            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Feather name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Paired Devices:</Text>
                    {pairedDevices.map(device => (
                        <View key={device.id} style={styles.deviceRow}>
                            <Text style={styles.deviceText}>{device.email}</Text>
                            <TouchableOpacity onPress={() => onUnpair(device.id)}>
                                <Text style={styles.unpairText}>Unpair</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
                <View style={styles.divider} />
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Enabled Features</Text>
                    <View style={styles.featureRow}>
                        <Text style={styles.featureText}>OCR</Text>
                        <Switch
                            value={ocrEnabled}
                            onValueChange={handleOCR}
                            thumbColor={ocrEnabled ? '#fff' : '#fff'}
                            trackColor={{ false: '#777', true: '#0f0' }}
                        />
                    </View>
                    <View style={styles.featureRow}>
                        <Text style={styles.featureText}>Filter</Text>
                        <Switch
                            value={filterEnabled}
                            onValueChange={handleFilter}
                            thumbColor={filterEnabled ? '#fff' : '#fff'}
                            trackColor={{ false: '#777', true: '#0f0' }}
                        />
                    </View>
                </View>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.primaryButton} onPress={onPairToGuardian}>
                    <Text style={styles.primaryButtonText}>Pair To Guardian</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={onSubscribePremium}>
                    <Text style={styles.secondaryButtonText}>Subscribe To PREMIUM</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#007AFF',
    },
    closeBtn: {
        alignSelf: 'center',
        marginTop: 10,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    deviceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    deviceText: {
        color: '#fff',
        fontSize: 14,
    },
    unpairText: {
        color: '#fff',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginVertical: 10,
    },
    featureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    featureText: {
        color: '#fff',
        fontSize: 14,
    },
    primaryButton: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    primaryButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: '#fff',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        position: 'absolute',
        top: 53,
        right: 35,
        zIndex: 2,
    },

});
