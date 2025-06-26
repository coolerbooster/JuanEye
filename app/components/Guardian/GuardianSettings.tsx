import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';

type Props = {
    onBack: () => void;
    onLogout: () => void;
    onManageUser: () => void;
};

const GuardianSettings: React.FC<Props> = ({ onBack, onLogout, onManageUser }) => {
    const pairedDevice = 'Samsung Galaxy S24';
    const objectScanCount = 327364;
    const ocrScanCount = 747372;

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
                    <Text style={styles.device}>{pairedDevice}</Text>
                    <Text style={styles.unpair}>Unpair</Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.label}>Today’s History:</Text>
                <Text style={styles.historyItem}>
                    <Text style={styles.bold}>Object Scan</Text> - {objectScanCount}
                </Text>
                <Text style={styles.historyItem}>
                    <Text style={styles.bold}>OCR Scan</Text> - {ocrScanCount}
                </Text>
                <Text style={styles.link}>Custom Date Range</Text>

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
};

export default GuardianSettings;

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
    historyItem: { color: '#1786d9', marginBottom: 6 },
    bold: { fontWeight: 'bold' },
    link: {
        color: '#1786d9',
        textDecorationLine: 'underline',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#1786d9',
        paddingVertical: 14,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    buttonText: { color: 'white', fontWeight: 'bold' },
});
