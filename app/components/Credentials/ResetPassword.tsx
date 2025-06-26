// components/LoginScreen.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { login } from "../services/authService";
import ResetPassword from "../Credentials/ResetPassword";

type Props = {
    onLogin: (token: string) => void;
    onSignup: () => void;
    onBack: () => void;
    role: "user" | "guardian";
    initialEmail?: string;
    initialPassword?: string;
};

const LoginScreen: React.FC<Props> = ({
                                          onLogin,
                                          onSignup,
                                          onBack,
                                          role,
                                          initialEmail = "",
                                          initialPassword = "",
                                      }) => {
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState(initialPassword);
    const [loading, setLoading] = useState(false);
    const [resetMode, setResetMode] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { token } = await login(email, password);
            onLogin(token);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (resetMode) {
        return (
            <ResetPassword
                email={email}
                onBack={() => setResetMode(false)}
                onSuccess={() => setResetMode(false)}
            />
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.logoText}>JuanEye 👁️</Text>
                <TouchableOpacity onPress={onSignup}>
                    <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.header}>
                {role === "guardian" ? "GUARDIAN LOGIN" : "LOGIN"}
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
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

            <TouchableOpacity onPress={() => setResetMode(true)}>
                <Text style={styles.recover}>Recover Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.loginBtn, loading && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator />
                ) : (
                    <Text style={styles.loginText}>Login</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onBack} style={styles.backIcon}>
                <Text style={{ fontSize: 24, color: "white" }}>❮</Text>
            </TouchableOpacity>
        </View>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1786d9",
        paddingHorizontal: 30,
        paddingTop: 60,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
    },
    logoText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    link: {
        color: "white",
        textDecorationLine: "underline",
    },
    header: {
        color: "white",
        fontSize: 24,
        textAlign: "center",
        marginBottom: 30,
        fontWeight: "bold",
    },
    label: {
        color: "white",
        fontSize: 16,
        marginBottom: 6,
    },
    input: {
        backgroundColor: "#cbe7fa",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        color: "#000",
    },
    recover: {
        color: "white",
        textDecorationLine: "underline",
        fontSize: 13,
        marginBottom: 40,
    },
    loginBtn: {
        backgroundColor: "white",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    loginText: {
        color: "#1786d9",
        fontSize: 18,
        fontWeight: "bold",
    },
    backIcon: {
        position: "absolute",
        bottom: 30,
        left: 20,
    },
});
