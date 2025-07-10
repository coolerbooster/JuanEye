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

export type Scan =
    | { scanId: number; name: string; text: string; type: 'Object' | 'Text'; createdAt: string }
    | { id: number; conversation_id: string; first_user_message: string; type: 'LLM'; createdAt: string };

type Props = {
    userId: number;
    userEmail: string;
    onSettings: () => void;
    onEdit: (scan: Scan) => void;
};

// Helper: truncate a string to `limit` words, adding "..." if longer
const truncateWords = (text: string, limit: number): string => {
    const words = text.split(' ');
    if (words.length <= limit) return text;
    return words.slice(0, limit).join(' ') + '...';
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

    const renderItem = ({ item }: { item: Scan }) => {
        // Determine capsule label
        const tagLabel =
            item.type === 'LLM'
                ? 'LLM'
                : item.type === 'Text'
                    ? 'OCR'
                    : 'OBJECT';

        // Determine tag style (red for LLM, default for others)
        const tagStyle =
            item.type === 'LLM'
                ? [styles.tag, styles.llmTag]
                : styles.tag;

        return (
            <TouchableOpacity
                style={styles.itemRow}
                onPress={() => onEdit(item)}  // always call onEdit
            >
                <Text style={tagStyle}>{tagLabel}</Text>
                {item.type === 'LLM' ? (
                    <Text style={styles.itemText}>
                        {`${item.id} | ${truncateWords(item.first_user_message, 5)}`}
                    </Text>
                ) : (
                    <Text style={styles.itemText}>
                        {`${item.scanId} | ${truncateWords(item.name, 5)}`}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

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
                    keyExtractor={(item) =>
                        // prefix with type so keys are globally unique
                        item.type === 'LLM'
                            ? `LLM-${item.id}`
                            : `SCAN-${item.scanId}`
                    }
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
        alignItems: 'center',
    },
    itemText: { fontSize: 16, color: '#000' },
    tag: {
        backgroundColor: '#1786d9',
        color: 'white',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 8,
    },
    llmTag: {
        backgroundColor: 'red',
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
