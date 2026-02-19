import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Switch, Alert } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../config/api';
import { Donor } from '../../../types';

const HomeTab = () => {
    const { user, updateUser } = useAuth();
    const donor = user as Donor;
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [willingToDonate, setWillingToDonate] = useState(donor?.willingToDonate || false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [stats, setStats] = useState({
        activeRequests: 0,
        availableDonors: 0,
        myDonations: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    // Sync willingToDonate state with user data
    useEffect(() => {
        if (donor?.willingToDonate !== undefined) {
            setWillingToDonate(donor.willingToDonate);
        }
    }, [donor?.willingToDonate]);

    const toggleAvailability = async () => {
        try {
            setIsUpdating(true);
            const newStatus = !willingToDonate;
            await updateUser({
                role: newStatus ? 'donor' : 'user',
                willingToDonate: newStatus,
                isActive: newStatus
            });
            setWillingToDonate(newStatus);
            Alert.alert(
                'Success',
                `You are now ${newStatus ? 'available' : 'unavailable'} for blood donation requests.`
            );
        } catch (error) {
            console.error('Error updating availability:', error);
            Alert.alert('Error', 'Could not update availability status. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            // Fetch recent blood requests
            const reqResponse = await api.get('/blood-requests/all');
            const allRequests = reqResponse.data.bloodRequests || [];

            // Limit to most recent and active ones
            const recentActive = allRequests
                .filter((r: any) => r.status === 'pending' || r.status === 'active')
                .slice(0, 3);

            setRequests(recentActive);

            // Fetch donor count from analytics or use dummy if unavailable
            let donorCount = 12;
            try {
                const donorRes = await api.get('/donors');
                donorCount = donorRes.data.length;
            } catch (e) { }

            setStats({
                activeRequests: allRequests.filter((r: any) => r.status === 'pending' || r.status === 'active').length,
                availableDonors: donorCount,
                myDonations: donor?.totalDonations || 0
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStatCard = (title: string, value: string | number, icon: string, color: string, bgColor: string) => (
        <View style={[styles.statCard, { backgroundColor: bgColor }]}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
            <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>{icon}</Text>
            </View>
        </View>
    );

    const renderRequestCard = ({ item }: { item: any }) => (
        <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
                <View style={styles.bloodBadge}>
                    <Text style={styles.bloodBadgeText}>{item.bloodGroup}</Text>
                </View>
                <View style={[styles.urgencyBadge, { backgroundColor: item.urgency === 'critical' ? '#FEE2E2' : '#E0F2FE' }]}>
                    <Text style={[styles.urgencyText, { color: item.urgency === 'critical' ? '#DC2626' : '#0284C7' }]}>
                        {item.urgency?.toUpperCase()}
                    </Text>
                </View>
            </View>
            <Text style={styles.requestId}>Request ID: {item._id?.substring(0, 15)}...</Text>
            <Text style={styles.requestInfo}>Units Required: {item.unitsRequired || item.quantity || 1}</Text>
            <Text style={styles.requestDate}>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Raktmap Donor</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeLabel}>Welcome back,</Text>
                    <Text style={styles.userName}>{user?.name}!</Text>
                </View>

                {/* Quick Availability Toggle */}
                <View style={styles.availabilityCard}>
                    <View style={styles.availabilityLeft}>
                        <Text style={styles.availabilityIcon}>🩸</Text>
                        <View style={styles.availabilityTextContainer}>
                            <Text style={styles.availabilityTitle}>Available for Donation</Text>
                            <Text style={styles.availabilityHint}>
                                {willingToDonate
                                    ? 'You will receive emergency requests'
                                    : 'You won\'t receive any requests'}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={willingToDonate}
                        onValueChange={toggleAvailability}
                        disabled={isUpdating}
                        trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                        thumbColor={willingToDonate ? '#DC2626' : '#f4f3f4'}
                    />
                </View>

                <View style={styles.statsRow}>
                    {renderStatCard('Active Requests', stats.activeRequests, '🩸', '#DC2626', '#FFF1F2')}
                    {renderStatCard('Available Donors', stats.availableDonors, '👥', '#2563EB', '#EFF6FF')}
                    {renderStatCard('Donations', stats.myDonations, '✅', '#059669', '#ECFDF5')}
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Blood Requests</Text>
                    <TouchableOpacity onPress={fetchData}>
                        <Text style={styles.seeAll}>Refresh</Text>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#DC2626" style={{ marginTop: 20 }} />
                ) : requests.length > 0 ? (
                    requests.map((item) => (
                        <View key={item._id}>{renderRequestCard({ item })}</View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No active blood requests found.</Text>
                    </View>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>

                <TouchableOpacity style={styles.actionCard}>
                    <View style={styles.actionIconContainer}>
                        <Text style={styles.actionIcon}>🏠</Text>
                    </View>
                    <Text style={styles.actionText}>Find Nearby Requests</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard}>
                    <View style={styles.actionIconContainer}>
                        <Text style={styles.actionIcon}>📅</Text>
                    </View>
                    <Text style={styles.actionText}>Update My Availability</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: '#DC2626',
        paddingVertical: 15,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    welcomeSection: {
        marginBottom: 25,
    },
    welcomeLabel: {
        fontSize: 16,
        color: '#6B7280',
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        width: '31%',
        padding: 12,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    statTitle: {
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 8,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statIcon: {
        fontSize: 18,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    seeAll: {
        color: '#DC2626',
        fontWeight: '600',
    },
    requestCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    bloodBadge: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    bloodBadgeText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    urgencyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    urgencyText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    requestId: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    requestInfo: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    requestDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    actionIcon: {
        fontSize: 20,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#6B7280',
    },
    availabilityCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 18,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#FCA5A5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 3,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    availabilityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    availabilityIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    availabilityTextContainer: {
        flex: 1,
    },
    availabilityTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    availabilityHint: {
        fontSize: 12,
        color: '#6B7280',
    },
});

export default HomeTab;
