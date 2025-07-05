// src/components/GuardianDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { getUserScans } from '../services/authService';

export type Scan = {
    scanId: number;
    name: string;
    text: string;
    type: string;
    createdAt: string;
};

type Props = {
    userId: number;
    userEmail: string;
    onSettings: () => void;
    onEdit: (scan: Scan) => void;
};

const GuardianDashboard: React.FC<Props> = ({
                                                userId,
                                                userEmail,
                                                onSettings,
                                                onEdit,
                                            }) => {
    const [scans, setScans] = useState<Scan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchScans = async () => {
            setError(null);
            setLoading(true);
            try {
                const data = await getUserScans(userId);
                setScans(data);
            } catch (err: any) {
                console.log('GuardianDashboard: getUserScans error', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchScans();
    }, [userId]);

    const renderItem = ({ item }: { item: Scan }) => (
        <TouchableOpacity
            style={styles.itemRow}
            onPress={() => onEdit(item)}
        >
            <Text style={styles.itemText}>
                {`${item.scanId} | ${item.name}`}
            </Text>
            {item.type === 'Unknown' && (
                <Text style={styles.questionMark}>?</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>JuanEye 👁️</Text>
            </View>

            {/* Subheader shows the selected user’s email */}
            <Text style={styles.subHeader}>
                Showing scans for: {userEmail}
            </Text>

            {/* Loading indicator */}
            {loading && (
                <ActivityIndicator
                    size="large"
                    color="#1786d9"
                    style={{ marginTop: 20 }}
                />
            )}
            {/* Error message */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* List of scans */}
            {!loading && !error && (
                <FlatList
                    data={scans}
                    keyExtractor={item => item.scanId.toString()}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <Text style={styles.noDataText}>
                            No scans found.
                        </Text>
                    }
                />
            )}

            {/* Bottom bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity onPress={onSettings}>
                    <Text style={styles.bottomIcon}>⚙️</Text>
                </TouchableOpacity>
                {/*<TouchableOpacity onPress={() => alert('Scan triggered')}>*/}
                {/*    <View style={styles.scanButton} />*/}
                {/*</TouchableOpacity>*/}
            </View>
        </View>
    );
};

export default GuardianDashboard;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: {
        backgroundColor: '#1786d9',
        paddingTop: 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        alignItems: 'center',
    },
    logo: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    subHeader: {
        fontSize: 14,
        color: '#333',
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    itemRow: {
        borderBottomColor: '#1786d9',
        borderBottomWidth: 1,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemText: { fontSize: 16, color: '#000' },
    questionMark: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        paddingRight: 4,
    },
    bottomBar: {
        backgroundColor: '#1786d9',
        paddingVertical: 16,
        paddingHorizontal: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bottomIcon: { fontSize: 28, color: 'white' },
    scanButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#00cc44',
        borderWidth: 2,
        borderColor: 'white',
    },
    errorText: {
        color: '#d9534f',
        textAlign: 'center',
        marginVertical: 12,
    },
    noDataText: {
        textAlign: 'center',
        color: '#555',
        marginTop: 20,
    },
});
