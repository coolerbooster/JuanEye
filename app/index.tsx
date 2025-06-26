import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LoginScreen from './components/LoginScreen';
// import Signup from './components/Signup';
// import GuardianSignup from './components/Guardian/GuardianSignup';
import Signup from './components/Signup';
import RoleSelect from './components/RoleSelect';
import GuardianDashboard from './components/Guardian/GuardianDashboard';
import GuardianSettings from './components/Guardian/GuardianSettings';
import GuardianManageUser from './components/Guardian/GuardianManageUser';
import Camera from '@/app/components/Camera/Camera';

export default function App() {
    const [loggedIn, setLoggedIn] = React.useState(false);
    const [signingUp, setSigningUp] = React.useState(false);
    const [role, setRole] = React.useState<null | 'user' | 'guardian'>(null);
    const [guardianInSettings, setGuardianInSettings] = React.useState(false);
    const [managingUser, setManagingUser] = React.useState(false);

    if (!loggedIn) {
        if (!role) return <RoleSelect onSelectRole={setRole} />;
        if (signingUp) {
            return (<Signup role={role} onBackToLogin={() => setSigningUp(false)} /> );
        }
        return (
            <LoginScreen
                onSignup={() => setSigningUp(true)}
                onLogin={() => setLoggedIn(true)}
                role={role}
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

    return <Camera />;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
