// index.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './components/LoginScreen';
import Signup from './components/Credentials/Signup';
import ResetPassword from './components/Credentials/ResetPassword';
import RoleSelect from './components/RoleSelect';
import GuardianDashboard from './components/Guardian/GuardianDashboard';
import GuardianSettings from './components/Guardian/GuardianSettings';
import GuardianManageUser from './components/Guardian/GuardianManageUser';
import Camera from './components/Camera/Camera';

export default function App() {
    const [loggedIn, setLoggedIn] = React.useState(false);
    const [signingUp, setSigningUp] = React.useState(false);
    const [recovering, setRecovering] = React.useState(false);
    const [role, setRole] = React.useState<null | 'user' | 'guardian'>(null);
    const [guardianInSettings, setGuardianInSettings] = React.useState(false);
    const [managingUser, setManagingUser] = React.useState(false);

    // store credentials for prefill
    const [prefillEmail, setPrefillEmail] = React.useState<string>('');
    const [prefillPassword, setPrefillPassword] = React.useState<string>('');

    const handleLogin = async (token: string) => {
        await AsyncStorage.setItem('token', token);
        setLoggedIn(true);
    };

    const handleSignupSuccess = (email: string, password: string) => {
        setPrefillEmail(email);
        setPrefillPassword(password);
        setSigningUp(false);
    };

    const handleRecoverBack = () => {
        setRecovering(false);
    };

    const handleRecoverSuccess = () => {
        setRecovering(false);
        // optionally show a toast: "Please login with new password"
    };

    // Pre-login:
    if (!loggedIn) {
        if (!role) return <RoleSelect onSelectRole={setRole} />;
        if (signingUp) {
            return <Signup onSignupSuccess={handleSignupSuccess} onBack={() => setSigningUp(false)} />;
        }
        if (recovering) {
            return <ResetPassword onBack={handleRecoverBack} onSuccess={handleRecoverSuccess} />;
        }
        return (
            <LoginScreen
                role={role}
                initialEmail={prefillEmail}
                initialPassword={prefillPassword}
                onLogin={handleLogin}
                onSignup={() => {
                    setPrefillEmail('');
                    setPrefillPassword('');
                    setSigningUp(true);
                }}
                onRecover={() => setRecovering(true)}
                onBack={() => {
                    setRole(null);
                    setPrefillEmail('');
                    setPrefillPassword('');
                }}
            />
        );
    }

    // Guardian flows:
    if (role === 'guardian') {
        if (guardianInSettings) {
            if (managingUser) {
                return (
                    <GuardianManageUser
                        onBack={() => setManagingUser(false)}
                        onProceed={(selected) => {
                            console.log('Selected user:', selected);
                            setManagingUser(false);
                            setGuardianInSettings(false);
                        }}
                    />
                );
            }
            return (
                <GuardianSettings
                    onBack={() => setGuardianInSettings(false)}
                    onLogout={() => {
                        setLoggedIn(false);
                        setRole(null);
                        setGuardianInSettings(false);
                        setManagingUser(false);
                    }}
                    onManageUser={() => setManagingUser(true)}
                />
            );
        }
        return <GuardianDashboard onSettings={() => setGuardianInSettings(true)} />;
    }

    // Regular user:
    return <Camera />;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
});