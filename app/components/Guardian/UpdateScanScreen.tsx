// src/components/UpdateScanScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { updateScan } from '../services/authService';
import type { Scan } from './GuardianDashboard';

type Props = {
    route: {
        params: {
            scan: Scan;
        };
    };
    navigation: any;
};

const UpdateScanScreen: React.FC<Props> = ({ route, navigation }) => {
    const { scan } = route.params;
    const [name, setName] = useState(scan.name);       // ← prefill
    const [text, setText] = useState(scan.text);
    const [type, setType] = useState<'Object' | 'Text'>(scan.type as any);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateScan(scan.scanId, type, name, text);
            Alert.alert(
                'Success',
                'Scan updated.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Edit Scan #{scan.scanId}</Text>

            {/*<Text style={styles.label}>Type</Text>*/}
            {/*<View style={styles.typeRow}>*/}
            {/*    {(['Object', 'Text'] as const).map((t) => (*/}
            {/*        <TouchableOpacity*/}
            {/*            key={t}*/}
            {/*            onPress={() => setType(t)}*/}
            {/*            style={[*/}
            {/*                styles.typeButton,*/}
            {/*                type === t && styles.typeButtonActive,*/}
            {/*            ]}*/}
            {/*        >*/}
            {/*            <Text*/}
            {/*                style={[*/}
            {/*                    styles.typeButtonText,*/}
            {/*                    type === t && styles.typeButtonTextActive,*/}
            {/*                ]}*/}
            {/*            >*/}
            {/*                {t}*/}
            {/*            </Text>*/}
            {/*        </TouchableOpacity>*/}
            {/*    ))}*/}
            {/*</View>*/}

            <Text style={styles.label}>Name</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Name"
            />

            <Text style={styles.label}>Text</Text>
            <TextInput
                style={[styles.input, { height: 100 }]}
                value={text}
                onChangeText={setText}
                placeholder="Text"
                multiline
            />

            <TouchableOpacity
                style={[styles.saveBtn, loading && styles.disabledBtn]}
                onPress={handleSave}
                disabled={loading}
            >
                {loading
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
};

export default UpdateScanScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 6,
        color: '#333',
    },
    typeRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    typeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#aaa',
        marginRight: 8,
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: '#1786d9',
        borderColor: '#1786d9',
    },
    typeButtonText: {
        color: '#555',
    },
    typeButtonTextActive: {
        color: 'white',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 12,
        marginBottom: 16,
        textAlignVertical: 'top',
    },
    saveBtn: {
        backgroundColor: '#1786d9',
        padding: 14,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
    },
    disabledBtn: {
        opacity: 0.6,
    },
    saveText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelBtn: {
        marginTop: 12,
        alignItems: 'center',
    },
    cancelText: {
        color: '#1786d9',
        fontSize: 16,
    },
});
