import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Linking, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../../../config/api';

interface DonorItem {
    _id: string;
    name: string;
    bloodGroup: string;
    phone: string;
    city?: string;
    address?: string;
    isAvailable?: boolean;
    status?: string;
}

const DirectoryTab = () => {
    const [search, setSearch] = useState('');
    const [donors, setDonors] = useState<DonorItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchDonors();
    }, []);

    const fetchDonors = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/donors');
            if (response.data) {
                setDonors(response.data);
            }
        } catch (error) {
            console.error('Error fetching donors:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchDonors();
    };

    const filteredDonors = donors.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.bloodGroup.toLowerCase().includes(search.toLowerCase()) ||
        (d.city && d.city.toLowerCase().includes(search.toLowerCase()))
    );

    const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`);
    const handleSms = (phone: string) => Linking.openURL(`sms:${phone}`);

    const renderDonor = ({ item }: { item: DonorItem }) => (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                <View style={[styles.avatar, { 
                    borderColor: item.bloodGroup.includes('+') ? '#DC2626' : '#059669',
                    opacity: item.isAvailable === false || item.status === 'unavailable' ? 0.5 : 1
                }]}>
                    <Text style={styles.avatarText}>{item.bloodGroup}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.city}>
                        {item.city || item.address || 'Location not specified'}
                    </Text>
                    {(item.isAvailable === false || item.status === 'unavailable') && (
                        <Text style={styles.unavailable}>Unavailable</Text>
                    )}
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleCall(item.phone)}>
                    <Text style={styles.icon}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBtn, styles.msgBtn]} onPress={() => handleSms(item.phone)}>
                    <Text style={styles.icon}>💬</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Donor Directory</Text>
                <Text style={styles.subtitle}>{donors.length} donors registered</Text>
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search by name, blood group, or city..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#DC2626" />
                    <Text style={styles.loadingText}>Loading donors...</Text>
                </View>
            ) : filteredDonors.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyText}>
                        {search ? 'No donors found matching your search' : 'No donors registered yet'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredDonors}
                    renderItem={renderDonor}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            colors={['#DC2626']}
                        />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        padding: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    searchBar: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
    },
    avatarText: {
        fontWeight: 'bold',
        color: '#DC2626',
        fontSize: 16,
    },
    info: {
        marginLeft: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    city: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    unavailable: {
        fontSize: 11,
        color: '#DC2626',
        marginTop: 2,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    msgBtn: {
        backgroundColor: '#E0F2FE',
    },
    icon: {
        fontSize: 18,
    },
});

export default DirectoryTab;
