// src/components/ForgotPassword.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import * as authService from '../services/authService'; // ← import

type Props = {
    onBack: () => void;
    role: 'user' | 'guardian';
};

const ForgotPassword: React.FC<Props> = ({ onBack, role }) => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<1 | 2>(1);

    const headerText =
        role === 'guardian'
            ? 'GUARDIAN RECOVER PASSWORD'
            : 'RECOVER PASSWORD';

    const requestOTP = async () => {
        if (!email) {
            alert('Email is required.');
            return;
        }
        try {
            await authService.requestOTP(email); // ← use service
            alert('If that email exists, OTP sent.');
            setStep(2);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const resetPassword = async () => {
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
        try {
            await authService.resetPassword(email, code, newPassword); // ← use service
            alert('Password reset successful.');
            onBack();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.logoText}>JuanEye 👁️</Text>
                <TouchableOpacity onPress={onBack}>
                    <Text style={styles.link}>Login</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.header}>{headerText}</Text>

            {step === 1 ? (
                <>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        placeholderTextColor="#4d4d4d"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={requestOTP}
                    >
                        <Text style={styles.actionText}>Send OTP</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text style={styles.label}>OTP Code</Text>
                    <TextInput
                        style={styles.input}
                        value={code}
                        onChangeText={setCode}
                        placeholder="OTP Code"
                        placeholderTextColor="#4d4d4d"
                        keyboardType="number-pad"
                    />

                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="New Password"
                        placeholderTextColor="#4d4d4d"
                        secureTextEntry
                    />

                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm Password"
                        placeholderTextColor="#4d4d4d"
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={resetPassword}
                    >
                        <Text style={styles.actionText}>Reset Password</Text>
                    </TouchableOpacity>
                </>
            )}

            <TouchableOpacity onPress={onBack} style={styles.backIcon}>
                <Text style={{ fontSize: 32, color: 'white' }}>❮</Text>
            </TouchableOpacity>
        </View>
    );
};

export default ForgotPassword;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1786d9',
        paddingHorizontal: 30,
        paddingTop: 60,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    logoText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    link: {
        color: 'white',
        textDecorationLine: 'underline',
    },
    header: {
        color: 'white',
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 30,
        fontWeight: 'bold',
    },
    label: {
        color: 'white',
        fontSize: 16,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#cbe7fa',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        color: '#000',
    },
    actionBtn: {
        backgroundColor: 'white',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 40,
    },
    actionText: {
        color: '#1786d9',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backIcon: {
        position: 'absolute',
        bottom: 30,
        left: 20,
    },
});
