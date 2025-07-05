// src/index.tsx
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

import Camera from './components/Camera/Camera';
import CameraSettings from './components/Camera/CameraSettings';

export default function App() {
    const [loggedIn, setLoggedIn] = React.useState(false);
    const [signingUp, setSigningUp] = React.useState(false);
    const [forgotPassword, setForgotPassword] = React.useState(false);
    const [role, setRole] = React.useState<null | 'user' | 'guardian'>(null);

    const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);
    const [selectedScan, setSelectedScan] = React.useState<Scan | null>(null);
    const [guardianInSettings, setGuardianInSettings] = React.useState(false);
    const [cameraInSettings, setCameraInSettings] = React.useState(false);

    // Not logged in flows
    if (!loggedIn) {
        if (!role) {
            return <RoleSelect onSelectRole={setRole} />;
        }
        if (forgotPassword) {
            return (
                <ForgotPassword
                    role={role}
                    onBack={() => setForgotPassword(false)}
                />
            );
        }
        if (signingUp) {
            return (
                <Signup
                    role={role}
                    onBackToLogin={() => setSigningUp(false)}
                />
            );
        }
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

    // Guardian flows
    if (role === 'guardian') {
        // 1) Select which user to manage
        if (selectedUserId === null) {
            return (
                <GuardianManageUser
                    onBack={() => {
                        /* you could logout or go back to role select */
                    }}
                    onProceed={(userId) => {
                        setSelectedUserId(userId);
                    }}
                />
            );
        }

        // 2) If a scan is tapped, show the edit screen
        if (selectedScan !== null) {
            return (
                <UpdateScanScreen
                    route={{ params: { scan: selectedScan } }}
                    navigation={{ goBack: () => setSelectedScan(null) }}
                />
            );
        }

        // 3) Guardian settings (logout / manage user)
        if (guardianInSettings) {
            return (
                <GuardianSettings
                    onBack={() => setGuardianInSettings(false)}
                    onLogout={() => {
                        setLoggedIn(false);
                        setRole(null);
                        setSelectedUserId(null);
                        setGuardianInSettings(false);
                    }}
                    onManageUser={() => {
                        setSelectedUserId(null);
                        setGuardianInSettings(false);
                    }}
                />
            );
        }

        // 4) Dashboard: list scans and allow tapping to edit
        return (
            <GuardianDashboard
                userId={selectedUserId}
                onSettings={() => setGuardianInSettings(true)}
                onEdit={(scan) => setSelectedScan(scan)}
            />
        );
    }

    // Camera settings flow (for regular User)
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

    // Default: camera view for User
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
