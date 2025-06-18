import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // ✅ Updated Picker import

type Props = {
    onBack: () => void;
    onProceed: (selectedUser: string) => void;
};

const GuardianManageUser: React.FC<Props> = ({ onBack, onProceed }) => {
    const mockUsers: string[] = [
        'megatester@yahoo.com',
        'guardianuser1@mail.com',
        'tester123@mail.com',
    ];
    const [selected, setSelected] = useState(mockUsers[0]);

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

            {Platform.OS === 'android' ? (
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={selected}
                        onValueChange={setSelected}
                        style={styles.picker}
                    >
                        {mockUsers.map((email, index) => (
                            <Picker.Item key={index} label={email} value={email} />
                        ))}
                    </Picker>
                </View>
            ) : (
                <Text style={{ color: 'white' }}>(Dropdown visible only on Android for now)</Text>
            )}

            <TouchableOpacity style={styles.button} onPress={() => onProceed(selected)}>
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
});
