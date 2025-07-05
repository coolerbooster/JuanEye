// src/components/GuardianSettings.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    getScanStats,
    requestGuardianBind,
    confirmGuardianBind,
} from '../services/authService';

type Props = {
    onBack: () => void;
    onLogout: () => void;
    onManageUser: () => void;
};

export default function GuardianSettings({ onBack, onLogout, onManageUser }: Props) {
    // default dates
    const todayIso = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState<string>(todayIso);
    const [endDate, setEndDate] = useState<string>(todayIso);

    // scan counts
    const [objectScanCount, setObjectScanCount] = useState<number>(0);
    const [ocrScanCount, setOcrScanCount] = useState<number>(0);

    // loading and error states
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // date pickers visibility
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // OTP binding flow states
    const [showEmailInput, setShowEmailInput] = useState(false);
    const [bindingEmail, setBindingEmail] = useState<string>('');
    const [showOTPInput, setShowOTPInput] = useState(false);
    const [bindingOTP, setBindingOTP] = useState<string>('');

    // fetch stats for given date range
    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const { objectScanCount, ocrScanCount } = await getScanStats(startDate, endDate);
            setObjectScanCount(objectScanCount);
            setOcrScanCount(ocrScanCount);
        } catch (err: any) {
            console.error('GuardianSettings: getScanStats error', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // initial and date-change effect
    useEffect(() => {
        loadStats();
    }, [startDate, endDate]);

    // DatePicker handlers (always hide picker after selection)
    const onStartChange = (_: any, selectedDate?: Date) => {
        setShowStartPicker(false);
        if (selectedDate) {
            setStartDate(selectedDate.toISOString().split('T')[0]);
        }
    };

    const onEndChange = (_: any, selectedDate?: Date) => {
        setShowEndPicker(false);
        if (selectedDate) {
            setEndDate(selectedDate.toISOString().split('T')[0]);
        }
    };

    // begin OTP binding: show email input
    const startBind = () => {
        setBindingEmail('');
        setShowEmailInput(true);
        setShowOTPInput(false);
    };

    // send OTP to the entered email
    const sendOTP = async () => {
        if (!bindingEmail) {
            Alert.alert('Error', 'Please enter an email.');
            return;
        }
        try {
            await requestGuardianBind(bindingEmail);
            setShowEmailInput(false);
            setShowOTPInput(true);
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    // confirm OTP and bind, then show success and reset view
    const confirmOTP = async () => {
        if (!bindingOTP) {
            Alert.alert('Error', 'Please enter the OTP code.');
            return;
        }
        try {
            await confirmGuardianBind(bindingEmail, bindingOTP);
            Alert.alert('Success', `Successfully bound to ${bindingEmail}.`, [
                { text: 'OK', onPress: () => setShowOTPInput(false) }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>JuanEye 👁️</Text>
                <TouchableOpacity onPress={onBack}>
                    <Text style={styles.backIcon}>❮</Text>
                </TouchableOpacity>
            </View>

            {/* Body */}
            <View style={styles.body}>
                {showEmailInput ? (
                    // Email input for OTP
                    <>
                        <Text style={styles.label}>Enter user email:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={bindingEmail}
                            onChangeText={setBindingEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity style={styles.button} onPress={sendOTP}>
                            <Text style={styles.buttonText}>Send OTP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.linkBtn}
                            onPress={() => setShowEmailInput(false)}
                        >
                            <Text style={styles.link}>Cancel</Text>
                        </TouchableOpacity>
                    </>
                ) : showOTPInput ? (
                    // OTP input
                    <>
                        <Text style={styles.label}>Enter OTP code:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="OTP Code"
                            value={bindingOTP}
                            onChangeText={setBindingOTP}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity style={styles.button} onPress={confirmOTP}>
                            <Text style={styles.buttonText}>Confirm OTP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.linkBtn}
                            onPress={() => setShowOTPInput(false)}
                        >
                            <Text style={styles.link}>Cancel</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    // Main settings and stats view
                    <>
                        {/*<Text style={styles.label}>Paired Devices:</Text>*/}
                        {/*<View style={styles.row}>*/}
                        {/*    <Text style={styles.device}>Samsung Galaxy S24</Text>*/}
                        {/*    <Text style={styles.unpair}>Unpair</Text>*/}
                        {/*</View>*/}

                        {/*<View style={styles.divider} />*/}

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

                        {loading ? (
                            <ActivityIndicator color="#1786d9" style={{ marginVertical: 8 }} />
                        ) : (
                            <>
                                <Text style={styles.historyItem}>
                                    <Text style={styles.bold}>Object Scan</Text> – {objectScanCount}
                                </Text>
                                <Text style={styles.historyItem}>
                                    <Text style={styles.bold}>OCR Scan</Text> – {ocrScanCount}
                                </Text>
                            </>
                        )}

                        {error && <Text style={styles.errorText}>{error}</Text>}

                        <TouchableOpacity style={styles.button} onPress={startBind}>
                            <Text style={styles.buttonText}>Pair via OTP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={onManageUser}>
                            <Text style={styles.buttonText}>Manage Different User</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={onLogout}>
                            <Text style={styles.buttonText}>Logout</Text>
                        </TouchableOpacity>
                    </>
                )}
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
    divider: { height: 1, backgroundColor: '#1786d9', marginVertical: 16 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    dateText: { color: '#1786d9', textDecorationLine: 'underline', fontSize: 14 },
    historyItem: { color: '#1786d9', marginBottom: 6 },
    bold: { fontWeight: 'bold' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 12,
        borderRadius: 6,
    },
    button: {
        backgroundColor: '#1786d9',
        paddingVertical: 14,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    buttonText: { color: 'white', fontWeight: 'bold' },
    link: { color: '#1786d9', textDecorationLine: 'underline', textAlign: 'center', marginBottom: 20 },
    linkBtn: { marginBottom: 20 },
    errorText: { color: '#d9534f', marginBottom: 12, textAlign: 'center' },
});
