import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
} from 'react-native';

type Props = {
    onSettings: () => void;
};

const mockData = [
    'Alcohol 500 ml',
    'Unknown',
    'Apple',
    'Spoon',
    'Kiwi',
    'Plate',
];

const GuardianDashboard: React.FC<Props> = ({ onSettings }) => {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>JuanEye 👁️</Text>
                <TouchableOpacity onPress={onSettings}>
                    <Text style={styles.gearIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* List of items */}
            <FlatList
                data={mockData}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                renderItem={({ item }) => (
                    <View style={styles.itemRow}>
                        <Text
                            style={[
                                styles.itemText,
                                item === 'Kiwi' && styles.boldItem,
                            ]}
                        >
                            {item}
                        </Text>
                        {item === 'Unknown' && <Text style={styles.questionMark}>?</Text>}
                    </View>
                )}
            />

            {/* Bottom bar */}
            <View style={styles.bottomBar}>
                <Text style={styles.bottomIcon}>⚙️</Text>
                <TouchableOpacity onPress={() => alert('Scan triggered')}>
                    <View style={styles.scanButton} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default GuardianDashboard;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        backgroundColor: '#1786d9',
        paddingTop: 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    gearIcon: {
        fontSize: 20,
        color: 'white',
    },
    itemRow: {
        borderBottomColor: '#1786d9',
        borderBottomWidth: 1,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemText: {
        fontSize: 16,
        color: '#000',
    },
    boldItem: {
        fontWeight: 'bold',
    },
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
    bottomIcon: {
        fontSize: 28,
        color: 'white',
    },
    scanButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#00cc44',
        borderWidth: 2,
        borderColor: 'white',
    },
});
