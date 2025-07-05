import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getBoundUsers } from '../services/authService';

type Props = {
    onBack: () => void;
    // now onProceed takes a number
    onProceed: (selectedUserId: number) => void;
};

type BoundUser = {
    user_id: number;
    email: string;
};

const GuardianManageUser: React.FC<Props> = ({ onBack, onProceed }) => {
    const [users, setUsers] = useState<BoundUser[]>([]);
    // only keep the numeric ID
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setError(null);
            setLoading(true);

            try {
                const data = await getBoundUsers();
                setUsers(data);

                if (data.length) {
                    // default selection
                    setSelectedUserId(data[0].user_id);
                }
            } catch (err: any) {
                console.log('GuardianManageUser: getBoundUsers error', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <Text style={styles.backIcon}>❮</Text>
                </TouchableOpacity>
                <Text style={styles.logo}>JuanEye 👁️</Text>
            </View>

            <Text style={styles.title}>SELECT USER TO MANAGE</Text>
            <Text style={styles.label}>USER</Text>

            {loading && (
                <ActivityIndicator size="large" color="#ffffff" style={{ marginVertical: 20 }} />
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {!loading && !error && Platform.OS === 'android' && (
                <View style={styles.pickerWrapper}>
                    <Picker
                        // Convert the selectedUserId back to string for Picker
                        selectedValue={selectedUserId?.toString()}
                        onValueChange={value => {
                            const id = parseInt(value, 10);
                            setSelectedUserId(id);
                        }}
                        style={styles.picker}
                    >
                        {users.map(u => (
                            <Picker.Item
                                key={u.user_id}
                                label={`${u.user_id} | ${u.email}`}
                                value={u.user_id.toString()}
                            />
                        ))}
                    </Picker>
                </View>
            )}

            {!loading && !error && Platform.OS !== 'android' && (
                <Text style={{ color: 'white' }}>(Dropdown visible only on Android for now)</Text>
            )}

            <TouchableOpacity
                style={[styles.button, (loading || !selectedUserId) && styles.disabledBtn]}
                onPress={() => {
                    if (selectedUserId !== null) {
                        console.log('Proceed with ID:', selectedUserId);
                        onProceed(selectedUserId);
                    }
                }}
                disabled={loading || !selectedUserId}
            >
                <Text style={styles.buttonText}>PROCEED</Text>
            </TouchableOpacity>
        </View>
    );
};

export default GuardianManageUser;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1786d9',
        paddingHorizontal: 30,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        gap: 10,
    },
    logo: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    backIcon: {
        fontSize: 28,
        color: 'white',
    },
    title: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    label: {
        color: 'white',
        fontSize: 16,
        marginBottom: 8,
    },
    pickerWrapper: {
        backgroundColor: '#cbe7fa',
        borderRadius: 8,
        marginBottom: 40,
    },
    picker: {
        color: '#000',
        height: 50,
        width: '100%',
    },
    button: {
        backgroundColor: 'white',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#1786d9',
        fontWeight: 'bold',
    },
    errorText: {
        color: '#ffe6e6',
        backgroundColor: '#d9534f',
        padding: 8,
        borderRadius: 4,
        marginBottom: 16,
        textAlign: 'center',
    },
    disabledBtn: {
        opacity: 0.6,
    },
});
