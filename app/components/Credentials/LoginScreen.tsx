// src/components/LoginScreen.tsx
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
    onLogin: () => void;
    onSignup: () => void;
    onBack: () => void;
    onForgot: () => void;
    role: 'user' | 'guardian';
};

const LoginScreen: React.FC<Props> = ({ onLogin, onSignup, onBack, onForgot, role }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            alert('Email and password are required...');
            return;
        }
        try {
            // perform login
            await authService.login(email, password);

            // fetch profile to check accountType
            const profile = await authService.getProfile();
            const expectedType = role === 'guardian' ? 'Guardian' : 'User';

            if (profile.accountType !== expectedType) {
                // if mismatch, show error and do not proceed
                alert(`User Account type is not ${expectedType}.`);
                return;
            }

            onLogin();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.logoText}>JuanEye 👁️</Text>
                <TouchableOpacity onPress={onSignup}>
                    <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.header}>
                {role === 'guardian' ? 'GUARDIAN LOGIN' : 'LOGIN'}
            </Text>

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

            <Text style={styles.label}>Password</Text>
            <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#4d4d4d"
                secureTextEntry
            />

            <TouchableOpacity onPress={onForgot}>
                <Text style={styles.recover}>Recover Password</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onBack} style={styles.backIcon}>
                <Text style={{ fontSize: 24, color: 'white' }}>❮</Text>
            </TouchableOpacity>
        </View>
    );
};

export default LoginScreen;

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
    recover: {
        color: 'white',
        textDecorationLine: 'underline',
        fontSize: 13,
        marginBottom: 20,
    },
    loginBtn: {
        backgroundColor: 'white',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    loginText: {
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
