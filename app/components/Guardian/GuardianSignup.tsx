import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';

type Props = {
    onBackToLogin: () => void;
};

const GuardianSignup: React.FC<Props> = ({ onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [agreed, setAgreed] = useState(false);

    const handleSignup = () => {
        if (!agreed) return alert('Please agree to the Data Privacy Notice');
        if (password !== confirm) return alert('Passwords do not match');
        alert('Guardian signed up successfully');
        onBackToLogin();
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.logoText}>JuanEye 👁️</Text>
                <TouchableOpacity onPress={onBackToLogin}>
                    <Text style={styles.link}>Login</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.header}>GUARDIAN SIGN UP</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#4d4d4d"
                keyboardType="email-address"
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

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Confirm Password"
                placeholderTextColor="#4d4d4d"
                secureTextEntry
            />

            <View style={styles.checkboxRow}>
                <CheckBox value={agreed} onValueChange={setAgreed} />
                <Text style={styles.privacyText}>
                    Read <Text style={styles.privacyLink}>Data Privacy Notice</Text>
                </Text>
            </View>

            <TouchableOpacity onPress={handleSignup} style={styles.signupBtn}>
                <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onBackToLogin} style={styles.backIcon}>
                <Text style={{ fontSize: 32, color: 'white' }}>❮</Text>
            </TouchableOpacity>
        </View>
    );
};

export default GuardianSignup;

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
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    privacyText: {
        color: 'white',
        marginLeft: 8,
        fontSize: 13,
    },
    privacyLink: {
        textDecorationLine: 'underline',
    },
    signupBtn: {
        backgroundColor: 'white',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 40,
    },
    signupText: {
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
