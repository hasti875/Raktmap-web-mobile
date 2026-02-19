import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, Switch, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../config/api';
import * as Location from 'expo-location';

const UserSettingsTab = () => {
    const { logout, user, updateUser } = useAuth();

    // Password Modal State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Notification Settings State
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
    });

    // Profile Modal State
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Donor Status State
    const [isDonor, setIsDonor] = useState(false);
    const [donorInfo, setDonorInfo] = useState<any>(null);
    const [loadingDonorStatus, setLoadingDonorStatus] = useState(true);
    const [togglingDonor, setTogglingDonor] = useState(false);

    // Become Donor Modal State
    const [showBecomeDonorModal, setShowBecomeDonorModal] = useState(false);
    const [bloodGroup, setBloodGroup] = useState('');
    const [lastDonationDate, setLastDonationDate] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [locationObtained, setLocationObtained] = useState(false);

    // Other Modal States
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        checkDonorStatus();
    }, []);

    const checkDonorStatus = async () => {
        try {
            setLoadingDonorStatus(true);
            const response = await api.get('/users/donor-status');
            if (response.data.success) {
                setIsDonor(response.data.isDonor && response.data.isActive);
                setDonorInfo(response.data.donor);
            }
        } catch (error: any) {
            console.error('Error checking donor status:', error);
        } finally {
            setLoadingDonorStatus(false);
        }
    };

    const handleDonorToggle = async (value: boolean) => {
        if (value) {
            // User wants to become a donor - show modal to collect info
            setShowBecomeDonorModal(true);
        } else {
            // User wants to stop being a donor - confirm and deactivate
            Alert.alert(
                'Stop Being a Donor?',
                'Are you sure you want to deactivate your donor profile? You can reactivate it anytime.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Yes, Deactivate',
                        style: 'destructive',
                        onPress: handleStopDonating
                    }
                ]
            );
        }
    };

    const handleGetLocation = async () => {
        try {
            setGettingLocation(true);
            
            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Location access is required to register as a donor. This helps hospitals find donors nearby in emergencies.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => {
                            // User can manually enable in settings
                            Alert.alert('Info', 'Please enable location permission in your device settings.');
                        }}
                    ]
                );
                return;
            }

            // Get current position
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude: lat, longitude: lng } = location.coords;
            setLatitude(lat);
            setLongitude(lng);

            // Reverse geocode to get address
            try {
                const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
                if (reverseGeocode && reverseGeocode.length > 0) {
                    const location = reverseGeocode[0];
                    const addressParts = [];
                    if (location.street) addressParts.push(location.street);
                    if (location.district) addressParts.push(location.district);
                    
                    setAddress(addressParts.join(', '));
                    setCity(location.city || location.district || '');
                    setState(location.region || '');
                }
            } catch (geocodeError) {
                console.log('Geocoding failed, but location captured');
            }

            setLocationObtained(true);
            Alert.alert('Success', 'Location captured successfully!');
        } catch (error: any) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Failed to get location. Please try again.');
        } finally {
            setGettingLocation(false);
        }
    };

    const handleBecomeDonor = async () => {
        if (!bloodGroup) {
            Alert.alert('Error', 'Please select your blood group');
            return;
        }

        if (!latitude || !longitude) {
            Alert.alert(
                'Location Required',
                'Please enable your location so hospitals can find you during emergencies.',
                [
                    { text: 'OK' }
                ]
            );
            return;
        }

        try {
            setTogglingDonor(true);
            const response = await api.post('/users/become-donor', {
                bloodGroup,
                latitude,
                longitude,
                address: address || undefined,
                city: city || undefined,
                state: state || undefined,
                lastDonationDate: lastDonationDate || undefined
            });

            if (response.data.success) {
                // Update AuthContext with new donor status
                await updateUser({
                    role: 'donor',
                    willingToDonate: true,
                    bloodGroup,
                    isActive: true
                });
                
                Alert.alert(
                    'Success', 
                    'You are now registered as a blood donor! Redirecting to donor dashboard...',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                console.log('User will be redirected to DonorDashboard');
                            }
                        }
                    ]
                );
                setIsDonor(true);
                setDonorInfo(response.data.donor);
                setShowBecomeDonorModal(false);
                // Reset form
                setBloodGroup('');
                setLatitude(null);
                setLongitude(null);
                setAddress('');
                setCity('');
                setState('');
                setLastDonationDate('');
                setLocationObtained(false);
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to register as donor');
        } finally {
            setTogglingDonor(false);
        }
    };

    const handleStopDonating = async () => {
        try {
            setTogglingDonor(true);
            const response = await api.post('/users/stop-donating');

            if (response.data.success) {
                // Update AuthContext with new user status
                await updateUser({
                    role: 'user',
                    willingToDonate: false,
                    isActive: false
                });
                
                Alert.alert(
                    'Success', 
                    'Your donor profile has been deactivated. Redirecting to user dashboard...',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                console.log('User will be redirected to UserDashboard');
                            }
                        }
                    ]
                );
                setIsDonor(false);
                setDonorInfo(null);
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to deactivate donor profile');
        } finally {
            setTogglingDonor(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout }
        ]);
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
        Alert.alert('Success', 'Notification settings saved successfully!');
        setShowNotificationModal(false);
    };

    const handleUpdateProfile = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        try {
            setIsUpdatingProfile(true);
            await updateUser({
                name,
                phone
            });

            Alert.alert('Success', 'Profile updated successfully!');
            setShowProfileModal(false);
        } catch (error: any) {
            console.error('Update profile error:', error);
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleMenuItemPress = (itemId: string) => {
        switch (itemId) {
            case '1':
                setShowProfileModal(true);
                setName(user?.name || '');
                setPhone(user?.phone || '');
                break;
            case '2':
                setShowPasswordModal(true);
                break;
            case '3':
                setShowNotificationModal(true);
                break;
            case '4':
                Alert.alert('Privacy Policy', 'Privacy policy content will be displayed here.');
                break;
            case '5':
                Alert.alert('Contact Support', 'Email: support@raktmap.com\nPhone: +91-XXXXXXXXXX');
                break;
        }
    };

    const menuItems = [
        { id: '1', title: 'Update Profile', icon: '👤', hint: 'Edit your personal information' },
        { id: '2', title: 'Update Password', icon: '🔒', hint: 'Change your security credentials' },
        { id: '3', title: 'Notification Settings', icon: '🔔', hint: 'Manage alerts and reminders' },
        { id: '4', title: 'Privacy Policy', icon: '📄', hint: 'How we handle your data' },
        { id: '5', title: 'Contact Support', icon: '🎧', hint: 'Get help or report issues' },
    ];

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
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>Regular User</Text>
                        </View>
                        {user?.phone && (
                            <Text style={styles.phoneText}>📱 {user.phone}</Text>
                        )}
                    </View>
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
                                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                                thumbColor={notificationSettings.emailNotifications ? '#2563EB' : '#f4f3f4'}
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
                                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                                thumbColor={notificationSettings.pushNotifications ? '#2563EB' : '#f4f3f4'}
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

            {/* Profile Update Modal */}
            <Modal
                visible={showProfileModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowProfileModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Profile</Text>

                        <Text style={styles.inputLabel}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor="#9CA3AF"
                        />

                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholderTextColor="#9CA3AF"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setShowProfileModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalSaveBtn}
                                onPress={handleUpdateProfile}
                                disabled={isUpdatingProfile}
                            >
                                <Text style={styles.modalSaveText}>
                                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Become Donor Modal */}
            <Modal
                visible={showBecomeDonorModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBecomeDonorModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Register as Donor</Text>
                        <Text style={styles.modalSubtitle}>
                            Fill in your details to become a blood donor
                        </Text>

                        <Text style={styles.inputLabel}>Blood Group *</Text>
                        <View style={styles.bloodGroupContainer}>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                                <TouchableOpacity
                                    key={bg}
                                    style={[
                                        styles.bloodGroupButton,
                                        bloodGroup === bg && styles.bloodGroupButtonSelected
                                    ]}
                                    onPress={() => setBloodGroup(bg)}
                                >
                                    <Text style={[
                                        styles.bloodGroupButtonText,
                                        bloodGroup === bg && styles.bloodGroupButtonTextSelected
                                    ]}>
                                        {bg}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.inputLabel}>Location (Required) *</Text>
                        <TouchableOpacity
                            style={[
                                styles.locationButton,
                                locationObtained && styles.locationButtonSuccess
                            ]}
                            onPress={handleGetLocation}
                            disabled={gettingLocation}
                        >
                            {gettingLocation ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.locationButtonText}>
                                    {locationObtained ? '✓ Location Captured' : '📍 Get Current Location'}
                                </Text>
                            )}
                        </TouchableOpacity>
                        {locationObtained && (
                            <Text style={styles.locationHint}>
                                {address || `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}
                            </Text>
                        )}
                        <Text style={styles.locationNote}>
                            Your location helps hospitals find nearby donors during emergencies
                        </Text>

                        <Text style={styles.inputLabel}>Last Donation Date (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD"
                            value={lastDonationDate}
                            onChangeText={setLastDonationDate}
                            placeholderTextColor="#9CA3AF"
                        />

                        <Text style={styles.inputLabel}>Address (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Your address"
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            numberOfLines={3}
                            placeholderTextColor="#9CA3AF"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => {
                                    setShowBecomeDonorModal(false);
                                    setBloodGroup('');
                                    setLatitude(null);
                                    setLongitude(null);
                                    setAddress('');
                                    setCity('');
                                    setState('');
                                    setLastDonationDate('');
                                    setLocationObtained(false);
                                }}
                                disabled={togglingDonor}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalSaveBtn}
                                onPress={handleBecomeDonor}
                                disabled={togglingDonor}
                            >
                                {togglingDonor ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.modalSaveText}>Register</Text>
                                )}
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
        backgroundColor: '#2563EB',
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
        marginTop: 2,
    },
    roleBadge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    roleText: {
        fontSize: 11,
        color: '#1E40AF',
        fontWeight: '600',
    },
    phoneText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 6,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuIcon: {
        fontSize: 20,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    menuHint: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    chevron: {
        fontSize: 24,
        color: '#D1D5DB',
        fontWeight: '300',
    },
    becomeSection: {
        padding: 16,
    },
    donorCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    donorCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    donorCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    donorCardSubtitle: {
        fontSize: 14,
        color: '#DC2626',
        fontWeight: '600',
    },
    donorCardDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    donorInfoBox: {
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    donorInfoText: {
        fontSize: 13,
        color: '#111827',
        marginBottom: 4,
        fontWeight: '500',
    },
    donorInfoHint: {
        fontSize: 12,
        color: '#DC2626',
        marginTop: 4,
        fontStyle: 'italic',
    },
    becomeCard: {
        backgroundColor: '#FEF2F2',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    becomeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    becomeText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 16,
    },
    becomeButton: {
        backgroundColor: '#DC2626',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    becomeButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
        padding: 16,
        borderRadius: 12,
    },
    logoutIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#DC2626',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        color: '#9CA3AF',
        paddingVertical: 24,
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
        backgroundColor: '#2563EB',
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
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
        marginLeft: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    bloodGroupContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    bloodGroupButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        minWidth: 60,
        alignItems: 'center',
    },
    bloodGroupButtonSelected: {
        borderColor: '#DC2626',
        backgroundColor: '#FEE2E2',
    },
    bloodGroupButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    bloodGroupButtonTextSelected: {
        color: '#DC2626',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 14,
    },
    locationButton: {
        backgroundColor: '#2563EB',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    locationButtonSuccess: {
        backgroundColor: '#10B981',
    },
    locationButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    locationHint: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
        textAlign: 'center',
    },
    locationNote: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 12,
    },
});

export default UserSettingsTab;
