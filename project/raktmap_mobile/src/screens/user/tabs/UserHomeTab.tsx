import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Alert } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../config/api';

const UserHomeTab = () => {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [willingToDonate, setWillingToDonate] = useState(user?.willingToDonate || false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [stats, setStats] = useState({
        availableDonors: 0,
        activeHospitals: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    // Sync willingToDonate state with user data
    useEffect(() => {
        if (user?.willingToDonate !== undefined) {
            setWillingToDonate(user.willingToDonate);
        }
    }, [user?.willingToDonate]);

    const toggleBecomeDonor = async () => {
        try {
            setIsUpdating(true);
            const newStatus = !willingToDonate;
            
            if (newStatus) {
                // Check if user has complete profile
                if (!user?.bloodGroup) {
                    Alert.alert(
                        'Complete Profile',
                        'Please complete your donor profile in Settings first (blood group, location, etc.)',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Go to Settings', onPress: () => {} }
                        ]
                    );
                    setIsUpdating(false);
                    return;
                }
            }
            
            await updateUser({
                role: newStatus ? 'donor' : 'user',
                willingToDonate: newStatus,
                isActive: newStatus
            });
            setWillingToDonate(newStatus);
            Alert.alert(
                'Success',
                newStatus 
                    ? 'You are now registered as a donor! You will receive emergency blood requests.'
                    : 'You have deactivated your donor profile. You won\'t receive donation requests.'
            );
        } catch (error) {
            console.error('Error updating donor status:', error);
            Alert.alert('Error', 'Could not update donor status. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            
            // Fetch donor count
            let donorCount = 0;
            try {
                const donorRes = await api.get('/donors');
                donorCount = donorRes.data.length;
            } catch (e) {
                console.log('Could not fetch donors');
            }

            setStats({
                availableDonors: donorCount,
                activeHospitals: 5 // Placeholder
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStatCard = (title: string, value: string | number, icon: string, bgColor: string) => (
        <View style={[styles.statCard, { backgroundColor: bgColor }]}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
            <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>{icon}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Raktmap User</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeLabel}>Welcome back,</Text>
                    <Text style={styles.userName}>{user?.name}!</Text>
                    <View style={styles.userBadge}>
                        <Text style={styles.badgeText}>👤 Regular User</Text>
                    </View>
                </View>

                {/* Become Donor Toggle */}
                <View style={styles.becomeDonorCard}>
                    <View style={styles.becomeDonorHeader}>
                        <Text style={styles.becomeDonorIcon}>💝</Text>
                        <View style={styles.becomeDonorTextContainer}>
                            <Text style={styles.becomeDonorTitle}>Become a Blood Donor</Text>
                            <Text style={styles.becomeDonorHint}>
                                {willingToDonate
                                    ? 'You are registered as a donor'
                                    : 'Help save lives by becoming a donor'}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={willingToDonate}
                        onValueChange={toggleBecomeDonor}
                        disabled={isUpdating}
                        trackColor={{ false: '#D1D5DB', true: '#DCFCE7' }}
                        thumbColor={willingToDonate ? '#15803D' : '#f4f3f4'}
                    />
                </View>

                {!willingToDonate && (
                    <View style={styles.infoCard}>
                        <Text style={styles.cardTitle}>About Regular Users</Text>
                        <Text style={styles.cardText}>
                            As a regular user, you can browse the Raktmap platform and view donor information.
                            Enable the toggle above to become a donor and receive emergency blood donation alerts.
                        </Text>
                    </View>
                )}

                <View style={styles.statsRow}>
                    {renderStatCard('Available Donors', stats.availableDonors, '👥', '#EFF6FF')}
                    {renderStatCard('Active Hospitals', stats.activeHospitals, '🏥', '#ECFDF5')}
                </View>

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
        backgroundColor: '#2563EB',
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
        marginBottom: 20,
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
    userBadge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
        marginTop: 12,
    },
    badgeText: {
        fontSize: 12,
        color: '#1E40AF',
        fontWeight: '600',
    },
    infoCard: {
        backgroundColor: '#F0F9FF',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    cardText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 16,
    },
    becomeDonorButton: {
        backgroundColor: '#FEE2E2',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    becomeDonorText: {
        color: '#B91C1C',
        fontWeight: '600',
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#111827',
    },
    statTitle: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 8,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statIcon: {
        fontSize: 24,
    },
    becomeDonorCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 15,
        padding: 18,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#86EFAC',
        elevation: 3,
        shadowColor: '#15803D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    becomeDonorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    becomeDonorIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    becomeDonorTextContainer: {
        flex: 1,
    },
    becomeDonorTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    becomeDonorHint: {
        fontSize: 12,
        color: '#6B7280',
    },
});

export default UserHomeTab;
