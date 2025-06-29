// src/index.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import LoginScreen from './components/Credentials/LoginScreen';
import Signup from './components/Credentials/Signup';
import ForgotPassword from './components/Credentials/ForgotPassword';
import RoleSelect from './components/Credentials/RoleSelect';
import GuardianDashboard from './components/Guardian/GuardianDashboard';
import GuardianSettings from './components/Guardian/GuardianSettings';
import GuardianManageUser from './components/Guardian/GuardianManageUser';
import Camera from './components/Camera/Camera';
import CameraSettings from './components/Camera/CameraSettings';

export default function App() {
    const [loggedIn, setLoggedIn] = React.useState(false);
    const [signingUp, setSigningUp] = React.useState(false);
    const [forgotPassword, setForgotPassword] = React.useState(false);
    const [role, setRole] = React.useState<null | 'user' | 'guardian'>(null);
    const [guardianInSettings, setGuardianInSettings] = React.useState(false);
    const [managingUser, setManagingUser] = React.useState(false);
    const [cameraInSettings, setCameraInSettings] = React.useState(false);

    if (!loggedIn) {
        if (!role) return <RoleSelect onSelectRole={setRole} />;
        if (forgotPassword) return <ForgotPassword role={role} onBack={() => setForgotPassword(false)} />;
        if (signingUp) return <Signup role={role} onBackToLogin={() => setSigningUp(false)} />;
        return (
            <LoginScreen
                role={role}
                onLogin={() => setLoggedIn(true)}
                onSignup={() => setSigningUp(true)}
                onForgot={() => setForgotPassword(true)}
                onBack={() => setRole(null)}
            />
        );
    }

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

    if (cameraInSettings) {
        return (
            <CameraSettings
                pairedDevices={[]}
                onUnpair={() => {}}
                onToggleOCR={() => {}}
                onToggleFilter={() => {}}
                onPairToGuardian={() => {}}
                onSubscribePremium={() => {}}
                onClose={() => setCameraInSettings(false)}
            />
        );
    }

    return (
        <Camera
            onBackToMenu={() => {
                setLoggedIn(false);
                setRole(null);
            }}
            onSettings={() => setCameraInSettings(true)}
        />
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
