// src/components/GuardianSettings.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getScanStats } from '../services/authService';

type Props = {
    onBack: () => void;
    onLogout: () => void;
    onManageUser: () => void;
};

export default function GuardianSettings({ onBack, onLogout, onManageUser }: Props) {
    // default to today
    const todayIso = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState<string>(todayIso);
    const [endDate, setEndDate] = useState<string>(todayIso);

    const [objectScanCount, setObjectScanCount] = useState<number>(0);
    const [ocrScanCount, setOcrScanCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // control visibility of the native pickers
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const { objectScanCount, ocrScanCount } = await getScanStats(startDate, endDate);
            setObjectScanCount(objectScanCount);
            setOcrScanCount(ocrScanCount);
        } catch (err: any) {
            console.log('GuardianSettings: getScanStats error', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, [startDate, endDate]);

    // handle change from DateTimePicker
    const onStartChange = (_: any, selectedDate?: Date) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedDate) {
            const iso = selectedDate.toISOString().split('T')[0];
            setStartDate(iso);
        }
    };
    const onEndChange = (_: any, selectedDate?: Date) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) {
            const iso = selectedDate.toISOString().split('T')[0];
            setEndDate(iso);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>JuanEye 👁️</Text>
                <TouchableOpacity onPress={onBack}>
                    <Text style={styles.backIcon}>❮</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.body}>
                <Text style={styles.label}>Paired Devices:</Text>
                <View style={styles.row}>
                    <Text style={styles.device}>Samsung Galaxy S24</Text>
                    <Text style={styles.unpair}>Unpair</Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.label}>History:</Text>
                <View style={styles.dateRow}>
                    <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                        <Text style={styles.dateText}>Start: {startDate}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                        <Text style={styles.dateText}>End: {endDate}</Text>
                    </TouchableOpacity>
                </View>

                {showStartPicker && (
                    <DateTimePicker
                        value={new Date(startDate)}
                        mode="date"
                        display="default"
                        onChange={onStartChange}
                    />
                )}
                {showEndPicker && (
                    <DateTimePicker
                        value={new Date(endDate)}
                        mode="date"
                        display="default"
                        onChange={onEndChange}
                    />
                )}

                {loading
                    ? <ActivityIndicator color="#1786d9" style={{ marginVertical: 8 }} />
                    : <>
                        <Text style={styles.historyItem}>
                            <Text style={styles.bold}>Object Scan</Text> – {objectScanCount}
                        </Text>
                        <Text style={styles.historyItem}>
                            <Text style={styles.bold}>OCR Scan</Text> – {ocrScanCount}
                        </Text>
                    </>
                }

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Pair via OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={onManageUser}>
                    <Text style={styles.buttonText}>Manage Different User</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={onLogout}>
                    <Text style={styles.buttonText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: {
        backgroundColor: '#1786d9',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    backIcon: { fontSize: 28, color: 'white' },
    body: { padding: 24 },
    label: { color: '#1786d9', fontWeight: 'bold', fontSize: 16, marginBottom: 6 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    device: { fontWeight: 'bold', color: '#1786d9' },
    unpair: { color: '#1786d9', textDecorationLine: 'underline' },
    divider: {
        height: 1,
        backgroundColor: '#1786d9',
        marginVertical: 16,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    dateText: {
        color: '#1786d9',
        textDecorationLine: 'underline',
        fontSize: 14,
    },
    historyItem: { color: '#1786d9', marginBottom: 6 },
    bold: { fontWeight: 'bold' },
    button: {
        backgroundColor: '#1786d9',
        paddingVertical: 14,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    buttonText: { color: 'white', fontWeight: 'bold' },
    errorText: {
        color: '#d9534f',
        marginBottom: 12,
        textAlign: 'center',
    },
});
