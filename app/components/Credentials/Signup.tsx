
// components/Signup.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { signup } from "../services/authService";

type Props = {
  onSignupSuccess: (token: string) => void;
  onBack: () => void;
};

const Signup: React.FC<Props> = ({ onSignupSuccess, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    try {
      const { token } = await signup(email, password);
      onSignupSuccess(token);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>SIGN UP</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#4d4d4d"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        placeholderTextColor="#4d4d4d"
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.6 }]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.btnText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onBack} style={styles.backIcon}>
        <Text style={{ fontSize: 24, color: "white" }}>❮</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1786d9",
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  header: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 40,
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
  btn: {
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  btnText: {
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

