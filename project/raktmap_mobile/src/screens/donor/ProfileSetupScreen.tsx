import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    Switch,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { api } from '../../config/api';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

// Simple list of states for "searchable" feel
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const ProfileSetupScreen = () => {
    const navigation = useNavigation<any>();
    const { user, updateUser, logout } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [stateSearch, setStateSearch] = useState('');
    const [showStateList, setShowStateList] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '',
        city: '',
        state: '',
        latitude: null as number | null,
        longitude: null as number | null,
        lastDonationDate: null as Date | null,
        hasTattoo: false,
    });

    const filteredStates = INDIAN_STATES.filter(s =>
        s.toLowerCase().includes(stateSearch.toLowerCase())
    );

    const [neverDonated, setNeverDonated] = useState(true);
    const [showDonationPicker, setShowDonationPicker] = useState(false);

    // Steps: 1. Basic Details, 2. Location, 3. Health Screening

    const handleNext = () => {
        if (step === 1) {
            if (!formData.name || !formData.phone) {
                Alert.alert('Error', 'Please fill in required fields');
                return;
            }
            if (formData.phone.length !== 10) {
                Alert.alert('Error', 'Phone number must be exactly 10 digits');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!formData.latitude || !formData.longitude) {
                Alert.alert('Error', 'Please select your location on the map or search for your address');
                return;
            }
            setStep(3);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            console.log('📝 Submitting profile setup...');
            // Update donor profile
            const profileData: any = {
                ...formData,
                isProfileComplete: true,
            };
            
            // Only include lastDonationDate if user has donated before
            if (neverDonated || !formData.lastDonationDate) {
                delete profileData.lastDonationDate;
            }
            
            const updatedUser = await updateUser(profileData);

            console.log('✅ Profile updated successfully:', updatedUser?.isProfileComplete);

            Alert.alert(
                'Success',
                'Profile setup completed successfully! Redirecting to your dashboard...',
                [{
                    text: 'OK',
                    onPress: () => {
                        // The App.tsx Navigator key change will force a reload
                        // but we log here for debugging
                        console.log('User acknowledged success');
                    }
                }]
            );
        } catch (error: any) {
            console.error('❌ Profile submission failed:', error);
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepSubtitle}>Verify your contact details</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Enter your full name"
                    editable={!isLoading}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text.toLowerCase() })}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9]/g, '');
                        if (cleaned.length <= 10) {
                            setFormData({ ...formData, phone: cleaned });
                        }
                    }}
                    placeholder="Enter 10-digit phone number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!isLoading}
                />
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Your Location</Text>
            <Text style={styles.stepSubtitle}>We need your exact location to show you on the live map</Text>

            <TouchableOpacity
                style={styles.primaryLocationBtn}
                onPress={async () => {
                    setIsLoading(true);
                    try {
                        let { status } = await Location.requestForegroundPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('Permission Denied', 'Please allow location access to use this feature.');
                            return;
                        }

                        let location = await Location.getCurrentPositionAsync({
                            accuracy: Location.Accuracy.Highest,
                        });

                        const { latitude, longitude } = location.coords;

                        // Reverse geocode to get address details
                        const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
                        let address = '';
                        let city = '';
                        let state = '';

                        if (reverse.length > 0) {
                            const addr = reverse[0];
                            address = [addr.name, addr.street, addr.district].filter(Boolean).join(', ');
                            city = addr.city || addr.district || '';
                            state = addr.region || '';
                        }

                        setFormData({
                            ...formData,
                            latitude,
                            longitude,
                            address,
                            city,
                            state
                        });

                        Alert.alert('Success', 'Exact GPS coordinates captured successfully!');
                    } catch (error) {
                        console.error('Fetch location error:', error);
                        Alert.alert('Error', 'Could not fetch your exact location. Please ensure GPS is on or use the search box below.');
                    } finally {
                        setIsLoading(false);
                    }
                }}
            >
                <Text style={styles.primaryLocationBtnText}>📍 Use My Current GPS Location</Text>
                {formData.latitude && (
                    <Text style={styles.coordsText}>
                        Current: {formData.latitude.toFixed(6)}, {formData.longitude?.toFixed(6)}
                    </Text>
                )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR SEARCH</Text>
                <View style={styles.dividerLine} />
            </View>

            <View style={styles.searchBox}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search city, area or landmark..."
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                />
                <TouchableOpacity
                    style={styles.searchBtn}
                    onPress={async () => {
                        if (!formData.address) return;
                        setIsLoading(true);
                        try {
                            const results = await Location.geocodeAsync(formData.address);
                            if (results.length > 0) {
                                const { latitude, longitude } = results[0];
                                setFormData({ ...formData, latitude, longitude });
                                const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
                                if (reverse.length > 0) {
                                    setFormData(prev => ({
                                        ...prev,
                                        latitude,
                                        longitude,
                                        city: reverse[0].city || reverse[0].district || '',
                                        state: reverse[0].region || ''
                                    }));
                                }
                            } else {
                                Alert.alert('Not Found', 'Could not find that area. Try more specific name.');
                            }
                        } catch (e) {
                            Alert.alert('Error', 'Failed to search location');
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                >
                    <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: formData.latitude || 20.5937,
                        longitude: formData.longitude || 78.9629,
                        latitudeDelta: formData.latitude ? 0.01 : 15,
                        longitudeDelta: formData.longitude ? 0.01 : 15,
                    }}
                    region={formData.latitude && formData.longitude ? {
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    } : undefined}
                    onPress={async (e) => {
                        const { latitude, longitude } = e.nativeEvent.coordinate;
                        setFormData({ ...formData, latitude, longitude });
                        // Get address info for the tapped point
                        try {
                            const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
                            if (reverse.length > 0) {
                                const addr = reverse[0];
                                const fullAddr = [addr.name, addr.street, addr.district].filter(Boolean).join(', ');
                                setFormData(prev => ({
                                    ...prev,
                                    latitude,
                                    longitude,
                                    address: fullAddr,
                                    city: addr.city || addr.district || '',
                                    state: addr.region || ''
                                }));
                            }
                        } catch (err) {
                            console.log('Reverse geocode error', err);
                        }
                    }}
                >
                    {formData.latitude && formData.longitude && (
                        <Marker
                            coordinate={{ latitude: formData.latitude, longitude: formData.longitude }}
                            draggable
                            onDragEnd={(e) => {
                                const { latitude, longitude } = e.nativeEvent.coordinate;
                                setFormData({ ...formData, latitude, longitude });
                            }}
                        />
                    )}
                </MapView>
                <Text style={styles.mapTip}>Tip: Tap the map to fine-tune your location</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                        style={[styles.input, styles.compactInput]}
                        placeholder="City"
                        value={formData.city}
                        onChangeText={(text) => setFormData({ ...formData, city: text })}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>State</Text>
                    <TextInput
                        style={[styles.input, styles.compactInput]}
                        placeholder="State"
                        value={formData.state}
                        onChangeText={(text) => setFormData({ ...formData, state: text })}
                    />
                </View>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Medical Screening</Text>
            <Text style={styles.stepSubtitle}>Important safety questions</Text>

            <View style={styles.toggleRow}>
                <View style={styles.toggleTextContainer}>
                    <Text style={styles.toggleLabel}>I've donated blood before</Text>
                    <Text style={styles.toggleDesc}>Toggle off if this is your first time</Text>
                </View>
                <Switch
                    value={!neverDonated}
                    onValueChange={(val) => setNeverDonated(!val)}
                    trackColor={{ false: '#E5E7EB', true: '#FECACA' }}
                    thumbColor={!neverDonated ? '#D32F2F' : '#9CA3AF'}
                />
            </View>

            {!neverDonated && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Last Donation Date (Optional)</Text>
                    <Text style={styles.toggleDesc}>Skip if you don't remember the exact date</Text>
                    <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowDonationPicker(true)}
                    >
                        <Text style={[styles.dateText, !formData.lastDonationDate && { color: '#9CA3AF' }]}>
                            {formData.lastDonationDate ? format(formData.lastDonationDate, 'PPP') : 'Tap to select date (optional)'}
                        </Text>
                        <Text style={styles.dateIcon}>📅</Text>
                    </TouchableOpacity>
                    {showDonationPicker && (
                        <DateTimePicker
                            value={formData.lastDonationDate || new Date()}
                            mode="date"
                            display="default"
                            maximumDate={new Date()}
                            onChange={(event, date) => {
                                setShowDonationPicker(false);
                                if (date) setFormData({ ...formData, lastDonationDate: date });
                            }}
                        />
                    )}
                </View>
            )}

            <View style={styles.toggleRow}>
                <View style={styles.toggleTextContainer}>
                    <Text style={styles.toggleLabel}>Got a tattoo in the past 12 months?</Text>
                    <Text style={styles.toggleDesc}>Required for safety verification</Text>
                </View>
                <Switch
                    value={formData.hasTattoo}
                    onValueChange={(val) => setFormData({ ...formData, hasTattoo: val })}
                    trackColor={{ false: '#E5E7EB', true: '#FECACA' }}
                    thumbColor={formData.hasTattoo ? '#D32F2F' : '#9CA3AF'}
                />
            </View>

        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Profile Setup</Text>
                    <Text style={styles.headerStep}>Step {step} of 3</Text>
                </View>
                <TouchableOpacity onPress={() => logout()}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {renderProgressBar()}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </ScrollView>

            <View style={styles.footer}>
                {step > 1 && (
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.nextButton, step === 1 && { width: '100%' }]}
                    onPress={step === 3 ? handleSubmit : handleNext}
                    disabled={isLoading}
                >
                    <Text style={styles.nextButtonText}>
                        {isLoading ? 'Saving...' : step === 3 ? 'Complete Setup' : 'Next Step'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerStep: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 24,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#D32F2F',
    },
    scrollContent: {
        padding: 24,
    },
    stepContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#111827',
    },
    disabledInput: {
        color: '#9CA3AF',
        backgroundColor: '#F3F4F6',
    },
    datePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
    },
    dateText: {
        fontSize: 16,
        color: '#111827',
    },
    dateIcon: {
        fontSize: 18,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    toggleTextContainer: {
        flex: 1,
        marginRight: 16,
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    toggleDesc: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    footer: {
        padding: 24,
        flexDirection: 'row',
        gap: 12,
    },
    backButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    nextButton: {
        flex: 2,
        backgroundColor: '#D32F2F',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    stateList: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginTop: 4,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    stateItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    stateItemText: {
        fontSize: 16,
        color: '#111827',
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626',
    },
    // Map & Search Styles
    searchBox: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
    },
    searchBtn: {
        backgroundColor: '#D32F2F',
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    searchBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    mapContainer: {
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    map: {
        flex: 1,
    },
    mapTip: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 4,
        fontStyle: 'italic',
    },
    compactInput: {
        padding: 12,
        fontSize: 14,
    },
    currentLocBtn: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
    },
    currentLocBtnText: {
        color: '#374151',
        fontWeight: 'bold',
        fontSize: 14,
    },
    primaryLocationBtn: {
        backgroundColor: '#DC2626',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 6,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        alignItems: 'center',
    },
    primaryLocationBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    coordsText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 4,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        paddingHorizontal: 12,
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default ProfileSetupScreen;
