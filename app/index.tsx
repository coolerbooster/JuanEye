import { LogBox } from 'react-native';

// Ignore that specific Fragment-style error:
LogBox.ignoreLogs([
    'Invalid prop `style` supplied to `React.Fragment`'
]);
LogBox.ignoreAllLogs(true);

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
import GuardianChatScreen from './components/Guardian/GuardianChatScreen';

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

    // ◀ New: persist the logged-in user’s email across *all* roles
    const [currentUserEmail, setCurrentUserEmail] = React.useState<string>('');

    if (!loggedIn) {
        if (!role) return <RoleSelect onSelectRole={setRole} />;
        if (forgotPassword)
            return <ForgotPassword role={role} onBack={() => setForgotPassword(false)} />;
        if (signingUp)
            return <Signup role={role} onBackToLogin={() => setSigningUp(false)} />;
        return (
            <LoginScreen
                role={role}
                // now onLogin hands us back an email
                onLogin={(userId: number, email: string) => {
                    setLoggedIn(true);
                    setCurrentUserEmail(email);
                }}
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

        // ◀ New: if an LLM scan is selected, show chat screen
        if (selectedScan && selectedScan.type === 'LLM') {
            // cast for TS
            const llm = selectedScan as {
                id: number;
                conversation_id: string;
                first_user_message: string;
                type: 'LLM';
                createdAt: string;
            };
            // @ts-ignore
            return (
                <GuardianChatScreen
                    route={{
                        params: {
                            targetUserId: selectedUserId,
                            conversationId: llm.conversation_id,
                            initialQuestion: llm.first_user_message,
                        }
                    }}
                    navigation={{
                        goBack: () => setSelectedScan(null)
                    }}
                />
            );
        }

        // existing: edit/update non-LLM scans
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
                        setCurrentUserEmail('');     // clear it on logout
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

    // user → camera: always pass the persisted email
    return (
        <CameraScreen
            userEmail={currentUserEmail}
            onBackToMenu={() => {
                setLoggedIn(false);
                setRole(null);
                setCurrentUserEmail('');
            }}
        />
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
