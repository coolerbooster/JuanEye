import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
    onSelect: (role: 'user' | 'guardian') => void;
};

const RoleSelect: React.FC<Props> = ({ onSelect }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.logo}>JuanEye 👁️</Text>
            <Text style={styles.question}>Which are you?</Text>

            <TouchableOpacity style={styles.option} onPress={() => onSelect('user')}>
                <Ionicons name="person-outline" size={100} color="white" />
                <Text style={styles.label}>User</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={() => onSelect('guardian')}>
                <MaterialCommunityIcons name="shield-outline" size={100} color="white" />
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    logo: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        position: 'absolute',
        top: 40,
        left: 30,
    },
    question: {
        fontSize: 22,
        color: 'white',
        marginBottom: 40,
        fontWeight: 'bold',
    },
    option: {
        alignItems: 'center',
        marginBottom: 40,
    },
    label: {
        color: 'white',
        fontSize: 16,
        marginTop: 8,
    },
});
