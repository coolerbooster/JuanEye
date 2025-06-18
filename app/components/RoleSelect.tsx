
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Props = {
    onSelectRole: (role: 'user' | 'guardian') => void;
};

const RoleSelect: React.FC<Props> = ({ onSelectRole }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.logo}>JuanEye 👁️</Text>
            <Text style={styles.title}>Which are you?</Text>

            <TouchableOpacity style={styles.roleButton} onPress={() => onSelectRole('user')}>
                <Text style={styles.icon}>👤</Text>
                <Text style={styles.label}>User</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.roleButton} onPress={() => onSelectRole('guardian')}>
                <Text style={styles.icon}>🛡️</Text>
                <Text style={styles.label}>Guardian</Text>
            </TouchableOpacity>
        </View>
    );
};

export default RoleSelect;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1786d9',
        paddingTop: 60,
        alignItems: 'center',
    },
    logo: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        position: 'absolute',
        top: 20,
        left: 20,
    },
    title: {
        fontSize: 20,
        color: 'white',
        marginBottom: 40,
        fontWeight: 'bold',
    },
    roleButton: {
        alignItems: 'center',
        marginVertical: 20,
    },
    icon: {
        fontSize: 64,
        color: 'white',
    },
    label: {
        color: 'white',
        fontWeight: 'bold',
        marginTop: 8,
    },
});
