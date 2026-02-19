import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../config/api';
import { Donor } from '../../../types';

const SettingsTab = () => {
    const { logout, user, updateUser } = useAuth();
    const donor = user as Donor;
    const [willingToDonate, setWillingToDonate] = useState(donor?.willingToDonate || false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [donorStats, setDonorStats] = useState<any>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    // Password Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Notification Settings State
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        emergencyAlerts: true,
    });

    useEffect(() => {
        fetchDonorStats();
    }, []);

    // Sync willingToDonate state with user data when it changes
    useEffect(() => {
        if (donor?.willingToDonate !== undefined) {
            setWillingToDonate(donor.willingToDonate);
        }
    }, [donor?.willingToDonate]);

    const fetchDonorStats = async () => {
        try {
            setIsLoadingStats(true);
            // Fetch donation history for this donor
            const response = await api.get(`/donation-history/${donor?._id}`);
            if (response.data) {
                const donations = response.data.donations || [];
                const completedDonations = donations.filter((d: any) => d.status === 'completed');
                const lastDonation = completedDonations.length > 0
                    ? new Date(completedDonations[0].completedAt).toLocaleDateString()
                    : 'Never';

                setDonorStats({
                    totalDonations: completedDonations.length,
                    lastDonation: lastDonation
                });
            }
        } catch (error) {
            console.log('Could not fetch donor stats:', error);
            setDonorStats({
                totalDonations: donor?.totalDonations || 0,
                lastDonation: donor?.lastDonationDate
                    ? new Date(donor.lastDonationDate).toLocaleDateString()
                    : 'Never'
            });
        } finally {
            setIsLoadingStats(false);
        }
    };

    const toggleAvailability = async () => {
        try {
            setIsUpdating(true);
            const newStatus = !willingToDonate;
            // Update role, willingToDonate, and isActive to reflect availability
            await updateUser({
                role: newStatus ? 'donor' : 'user',  // Change role based on status
                willingToDonate: newStatus,
                isActive: newStatus
            });
            setWillingToDonate(newStatus);
            Alert.alert(
                'Success',
                `You are now ${newStatus ? 'available' : 'unavailable'} for blood donation requests.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // User will be redirected automatically as role changed
                            console.log('Role changed, navigation will update');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error updating availability:', error);
            Alert.alert('Error', 'Could not update availability status. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        try {
            setIsUpdatingPassword(true);
            await api.post('/change-password', {
                email: user?.email,
                currentPassword,
                newPassword
            });

            Alert.alert('Success', 'Password updated successfully!');
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleSaveNotificationSettings = () => {
        // Save notification settings (you can add API call here if needed)
        Alert.alert('Success', 'Notification settings saved successfully!');
        setShowNotificationModal(false);
    };

    const handleMenuItemPress = (itemId: string) => {
        switch (itemId) {
            case '1':
                setShowPasswordModal(true);
                break;
            case '2':
                setShowNotificationModal(true);
                break;
            case '3':
                Alert.alert('Privacy Policy', 'Privacy policy content will be displayed here.');
                break;
            case '4':
                Alert.alert('Contact Support', 'Email: support@raktmap.com\nPhone: +91-XXXXXXXXXX');
                break;
        }
    };

    const menuItems = [
        { id: '1', title: 'Update Password', icon: '🔒', hint: 'Change your security credentials' },
        { id: '2', title: 'Notification Settings', icon: '🔔', hint: 'Manage alerts and reminders' },
        { id: '3', title: 'Privacy Policy', icon: '📄', hint: 'How we handle your data' },
        { id: '4', title: 'Contact Support', icon: '🎧', hint: 'Get help or report issues' },
    ];

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout }
        ]);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user?.name}</Text>
                        <Text style={styles.profileEmail}>{user?.email}</Text>
                        <View style={styles.badgeContainer}>
                            <View style={styles.bloodBadge}>
                                <Text style={styles.bloodBadgeText}>{donor?.bloodGroup || 'N/A'}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: willingToDonate ? '#DCFCE7' : '#FEE2E2' }]}>
                                <Text style={[styles.statusText, { color: willingToDonate ? '#15803D' : '#DC2626' }]}>
                                    {willingToDonate ? 'Available' : 'Unavailable'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Donor Stats */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>DONATION STATISTICS</Text>
                <View style={styles.statsContainer}>
                    {isLoadingStats ? (
                        <ActivityIndicator size="large" color="#DC2626" style={{ paddingVertical: 30 }} />
                    ) : (
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{donorStats?.totalDonations || 0}</Text>
                                <Text style={styles.statLabel}>Total Donations</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{donorStats?.lastDonation || 'Never'}</Text>
                                <Text style={styles.statLabel}>Last Donation</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
                {menuItems.map(item => (
                    <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleMenuItemPress(item.id)}>
                        <View style={styles.menuLeft}>
                            <View style={styles.menuIconBg}>
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                            </View>
                            <View>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuHint}>{item.hint}</Text>
                            </View>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.section}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutIcon}>🚪</Text>
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.version}>Raktmap v1.0.0 (Production)</Text>

            {/* Password Update Modal */}
            <Modal
                visible={showPasswordModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Password</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Current Password"
                            secureTextEntry
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholderTextColor="#9CA3AF"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholderTextColor="#9CA3AF"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholderTextColor="#9CA3AF"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => {
                                    setShowPasswordModal(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalSaveBtn}
                                onPress={handleUpdatePassword}
                                disabled={isUpdatingPassword}
                            >
                                <Text style={styles.modalSaveText}>
                                    {isUpdatingPassword ? 'Updating...' : 'Update'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Notification Settings Modal */}
            <Modal
                visible={showNotificationModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowNotificationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Notification Settings</Text>

                        <View style={styles.notificationItem}>
                            <View>
                                <Text style={styles.notificationTitle}>Email Notifications</Text>
                                <Text style={styles.notificationHint}>Receive updates via email</Text>
                            </View>
                            <Switch
                                value={notificationSettings.emailNotifications}
                                onValueChange={(value) =>
                                    setNotificationSettings({ ...notificationSettings, emailNotifications: value })
                                }
                                trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                                thumbColor={notificationSettings.emailNotifications ? '#DC2626' : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.notificationItem}>
                            <View>
                                <Text style={styles.notificationTitle}>SMS Notifications</Text>
                                <Text style={styles.notificationHint}>Receive updates via SMS</Text>
                            </View>
                            <Switch
                                value={notificationSettings.smsNotifications}
                                onValueChange={(value) =>
                                    setNotificationSettings({ ...notificationSettings, smsNotifications: value })
                                }
                                trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                                thumbColor={notificationSettings.smsNotifications ? '#DC2626' : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.notificationItem}>
                            <View>
                                <Text style={styles.notificationTitle}>Push Notifications</Text>
                                <Text style={styles.notificationHint}>Receive app notifications</Text>
                            </View>
                            <Switch
                                value={notificationSettings.pushNotifications}
                                onValueChange={(value) =>
                                    setNotificationSettings({ ...notificationSettings, pushNotifications: value })
                                }
                                trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                                thumbColor={notificationSettings.pushNotifications ? '#DC2626' : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.notificationItem}>
                            <View>
                                <Text style={styles.notificationTitle}>Emergency Alerts</Text>
                                <Text style={styles.notificationHint}>Urgent blood requests</Text>
                            </View>
                            <Switch
                                value={notificationSettings.emergencyAlerts}
                                onValueChange={(value) =>
                                    setNotificationSettings({ ...notificationSettings, emergencyAlerts: value })
                                }
                                trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                                thumbColor={notificationSettings.emergencyAlerts ? '#DC2626' : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setShowNotificationModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalSaveBtn}
                                onPress={handleSaveNotificationSettings}
                            >
                                <Text style={styles.modalSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        padding: 24,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    profileEmail: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    badgeContainer: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    bloodBadge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    bloodBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#DC2626',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    statsSection: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
    statsCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#DC2626',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
    },
    availabilityCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    availabilityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    availabilityIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    availabilityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    availabilityHint: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    menuItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIconBg: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    menuIcon: {
        fontSize: 20,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    menuHint: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    chevron: {
        fontSize: 24,
        color: '#D1D5DB',
    },
    logoutBtn: {
        backgroundColor: '#FEE2E2',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    logoutIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#DC2626',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 40,
    },
    statsContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        fontSize: 16,
        color: '#111827',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalCancelBtn: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    modalSaveBtn: {
        flex: 1,
        backgroundColor: '#DC2626',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalSaveText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    notificationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    notificationHint: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
});

export default SettingsTab;
