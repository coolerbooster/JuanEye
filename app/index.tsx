import React from 'react';
import { StyleSheet } from 'react-native';

import LoginScreen from './components/Credentials/LoginScreen';
import Signup from './components/Credentials/Signup';
import ForgotPassword from './components/Credentials/ForgotPassword';
import RoleSelect from './components/RoleSelect';

import GuardianManageUser from './components/Guardian/GuardianManageUser';
import GuardianDashboard, { Scan } from './components/Guardian/GuardianDashboard';
import UpdateScanScreen from './components/Guardian/UpdateScanScreen';
import GuardianSettings from './components/Guardian/GuardianSettings';

import CameraScreen from './components/Camera/Camera';

export default function App() {
    const [loggedIn, setLoggedIn] = React.useState(false);
    const [signingUp, setSigningUp] = React.useState(false);
    const [forgotPassword, setForgotPassword] = React.useState(false);
    const [role, setRole] = React.useState<null | 'user' | 'guardian'>(null);

    const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);
    const [selectedUserEmail, setSelectedUserEmail] = React.useState<string>('');
    const [selectedScan, setSelectedScan] = React.useState<Scan | null>(null);
    const [guardianInSettings, setGuardianInSettings] = React.useState(false);

    if (!loggedIn) {
        if (!role) return <RoleSelect onSelectRole={setRole} />;
        if (forgotPassword)
            return <ForgotPassword role={role} onBack={() => setForgotPassword(false)} />;
        if (signingUp)
            return <Signup role={role} onBackToLogin={() => setSigningUp(false)} />;
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
        if (selectedUserId === null) {
            return (
                <GuardianManageUser
                    onBack={() => {}}
                    onProceed={(id, email) => {
                        setSelectedUserId(id);
                        setSelectedUserEmail(email);
                    }}
                />
            );
        }
        if (selectedScan) {
            return (
                <UpdateScanScreen
                    route={{ params: { scan: selectedScan } }}
                    navigation={{ goBack: () => setSelectedScan(null) }}
                />
            );
        }
        if (guardianInSettings) {
            return (
                <GuardianSettings
                    onBack={() => setGuardianInSettings(false)}
                    onLogout={() => {
                        setLoggedIn(false);
                        setRole(null);
                        setSelectedUserId(null);
                        setSelectedUserEmail('');
                        setGuardianInSettings(false);
                    }}
                    onManageUser={() => {
                        setGuardianInSettings(false);
                        setSelectedUserId(null);
                        setSelectedUserEmail('');
                    }}
                />
            );
        }
        return (
            <GuardianDashboard
                userId={selectedUserId}
                userEmail={selectedUserEmail}
                onSettings={() => setGuardianInSettings(true)}
                onEdit={setSelectedScan}
            />
        );
    }

    // user → camera
    return <CameraScreen onBackToMenu={() => { setLoggedIn(false); setRole(null); }} />;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
