import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';

type Props = {
    role: 'user' | 'guardian';
    onLogin: () => void;
    onSignUp: () => void;
    onBack: () => void;
};

const LoginScreen: React.FC<Props> = ({ role, onLogin, onSignUp, onBack }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (username === 'admin' && password === 'admin') {
            alert(`${role.toUpperCase()} login successful`);
            onLogin();
        } else {
            alert('Invalid credentials');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.logoText}>JuanEye 👁️</Text>
                <TouchableOpacity onPress={onSignUp}>
                    <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.header}>LOGIN</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Email"
                placeholderTextColor="#4d4d4d"
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

            <TouchableOpacity>
                <Text style={styles.recover}>Recover Password</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} style={styles.loginBtn}>
                <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onBack} style={styles.backIcon}>
                <Text style={{ fontSize: 32, color: 'white' }}>❮</Text>
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
        marginBottom: 30,
    },
    loginBtn: {
        backgroundColor: 'white',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 40,
    },
    loginText: {
        color: '#1786d9',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backIcon: {
        position: 'absolute',
        bottom: 60,
        left: 20,
    },
});
