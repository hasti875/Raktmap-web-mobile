// src/screens/user/tabs/UserSettingsTab.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Modal, TextInput, Switch, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../config/api';
import * as Location from 'expo-location';
// @ts-ignore
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const UserSettingsTab = () => {
  const { logout, user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

  // ── Password Modal State ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // ── Notification State ──
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
  });

  // ── Profile State ──
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // ── Donor Status State ──
  const [isDonor, setIsDonor] = useState(false);
  const [donorInfo, setDonorInfo] = useState<any>(null);
  const [loadingDonorStatus, setLoadingDonorStatus] = useState(true);
  const [togglingDonor, setTogglingDonor] = useState(false);

  // ── Become Donor Modal State ──
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

  // ── Other Modal States ──
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => { checkDonorStatus(); }, []);

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
      setShowBecomeDonorModal(true);
    } else {
      Alert.alert(
        'Stop Being a Donor?',
        'Are you sure you want to deactivate your donor profile? You can reactivate it anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Deactivate', style: 'destructive', onPress: handleStopDonating },
        ]
      );
    }
  };

  const handleGetLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is required to register as a donor.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude: lat, longitude: lng } = loc.coords;
      setLatitude(lat);
      setLongitude(lng);
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geo && geo.length > 0) {
          const g = geo[0];
          const parts = [];
          if (g.street) parts.push(g.street);
          if (g.district) parts.push(g.district);
          setAddress(parts.join(', '));
          setCity(g.city || g.district || '');
          setState(g.region || '');
        }
      } catch (_) {}
      setLocationObtained(true);
      Alert.alert('Success', 'Location captured successfully!');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleBecomeDonor = async () => {
    if (!bloodGroup) { Alert.alert('Error', 'Please select your blood group'); return; }
    if (!latitude || !longitude) {
      Alert.alert('Location Required', 'Please enable your location so hospitals can find you during emergencies.');
      return;
    }
    try {
      setTogglingDonor(true);
      const response = await api.post('/users/become-donor', {
        bloodGroup, latitude, longitude,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        lastDonationDate: lastDonationDate || undefined,
      });
      if (response.data.success) {
        await updateUser({ role: 'donor', willingToDonate: true, bloodGroup, isActive: true });
        Alert.alert('Success', 'You are now registered as a blood donor!');
        setIsDonor(true);
        setDonorInfo(response.data.donor);
        setShowBecomeDonorModal(false);
        setBloodGroup(''); setLatitude(null); setLongitude(null);
        setAddress(''); setCity(''); setState('');
        setLastDonationDate(''); setLocationObtained(false);
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
        await updateUser({ role: 'user', willingToDonate: false, isActive: false });
        Alert.alert('Success', 'Your donor profile has been deactivated.');
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
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields'); return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters'); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match'); return;
    }
    try {
      setIsUpdatingPassword(true);
      await api.post('/change-password', { email: user?.email, currentPassword, newPassword });
      Alert.alert('Success', 'Password updated successfully!');
      setShowPasswordModal(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
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
    if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    try {
      setIsUpdatingProfile(true);
      await updateUser({ name, phone });
      Alert.alert('Success', 'Profile updated successfully!');
      setShowProfileModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleMenuItemPress = (itemId: string) => {
    switch (itemId) {
      case '1': setShowProfileModal(true); setName(user?.name || ''); setPhone(user?.phone || ''); break;
      case '2': setShowPasswordModal(true); break;
      case '3': setShowNotificationModal(true); break;
      case '4': Alert.alert('Privacy Policy', 'Privacy policy content will be displayed here.'); break;
      case '5': Alert.alert('Contact Support', 'Email: support@raktmap.com\nPhone: +91-XXXXXXXXXX'); break;
    }
  };

  const menuItems = [
    { id: '1', title: 'Update Profile',       icon: 'person-outline',        hint: 'Edit your personal information' },
    { id: '2', title: 'Update Password',       icon: 'lock-closed-outline',   hint: 'Change your security credentials' },
    { id: '3', title: 'Notification Settings', icon: 'notifications-outline', hint: 'Manage alerts and reminders' },
    { id: '4', title: 'Privacy Policy',        icon: 'document-text-outline', hint: 'How we handle your data' },
    { id: '5', title: 'Contact Support',       icon: 'headset-outline',       hint: 'Get help or report issues' },
  ];

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Crimson Hero Header ── */}
        <View style={[s.hero, { paddingTop: insets.top + 20 }]}>
          <View style={s.hc1} />
          <View style={s.hc2} />
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{user?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <Text style={s.heroName}>{user?.name}</Text>
          <Text style={s.heroEmail}>{user?.email}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleTxt}>👤 Regular User</Text>
          </View>
          {user?.phone && (
            <View style={s.phoneBadge}>
              <Ionicons name="call-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={s.phoneTxt}>{user.phone}</Text>
            </View>
          )}
        </View>

        {/* ── Become Donor Card ── */}
        <View style={s.sectionGap}>
          <View style={[s.donorCard, isDonor && s.donorCardActive]}>
            <View style={s.donorCardTop}>
              <View style={[s.donorIconWrap, { backgroundColor: isDonor ? '#FFF1F2' : '#F3F4F6' }]}>
                <MaterialCommunityIcons name="blood-bag" size={24} color={isDonor ? '#C8102E' : '#9CA3AF'} />
              </View>
              <View style={s.donorTexts}>
                <Text style={s.donorTitle}>{isDonor ? 'Active Donor' : 'Become a Donor'}</Text>
                <Text style={s.donorSub}>
                  {isDonor
                    ? 'You are visible to hospitals & receiving alerts'
                    : 'Help save lives — register as a blood donor'}
                </Text>
              </View>
              {loadingDonorStatus
                ? <ActivityIndicator size="small" color="#C8102E" />
                : <Switch
                    value={isDonor}
                    onValueChange={handleDonorToggle}
                    trackColor={{ false: '#E5E7EB', true: '#FECACA' }}
                    thumbColor={isDonor ? '#C8102E' : '#9CA3AF'}
                    disabled={togglingDonor}
                  />
              }
            </View>
            {isDonor && donorInfo && (
              <View style={s.donorActiveBanner}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={s.donorActiveTxt}>
                  {`Blood Group: ${donorInfo?.blood_group ?? 'N/A'} · Registered donor`}
                </Text>
              </View>
            )}
            {!isDonor && (
              <View style={s.donorInfoBanner}>
                <Ionicons name="information-circle-outline" size={14} color="#2563EB" />
                <Text style={s.donorInfoTxt}>Toggle ON to receive emergency blood requests from hospitals</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Account Settings ── */}
        <View style={s.sectionGap}>
          <Text style={s.sectionLabel}>ACCOUNT SETTINGS</Text>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={s.menuItem}
              onPress={() => handleMenuItemPress(item.id)}
              activeOpacity={0.7}
            >
              <View style={s.menuLeft}>
                <View style={s.menuIconBg}>
                  <Ionicons name={item.icon as any} size={20} color="#C8102E" />
                </View>
                <View style={s.menuTexts}>
                  <Text style={s.menuTitle}>{item.title}</Text>
                  <Text style={s.menuHint}>{item.hint}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Sign Out ── */}
        <View style={s.sectionGap}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color="#C8102E" />
            <Text style={s.logoutTxt}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.version}>Raktmap v1.0.0 (Production)</Text>
      </ScrollView>

      {/* ── Password Modal ── */}
      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <View style={s.modalIconWrap}>
                <Ionicons name="lock-closed-outline" size={28} color="#C8102E" />
              </View>
              <Text style={s.modalTitle}>Update Password</Text>
            </View>
            {[
              { placeholder: 'Current password',          value: currentPassword, onChange: setCurrentPassword },
              { placeholder: 'New password (min. 6 chars)', value: newPassword,   onChange: setNewPassword },
              { placeholder: 'Confirm new password',       value: confirmPassword, onChange: setConfirmPassword },
            ].map((f, i) => (
              <View key={i} style={s.inputRow}>
                <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder={f.placeholder}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={f.value}
                  onChangeText={f.onChange}
                />
              </View>
            ))}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                <Text style={s.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleUpdatePassword} disabled={isUpdatingPassword}>
                {isUpdatingPassword ? <ActivityIndicator color="#fff" /> : <Text style={s.saveTxt}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Notification Modal ── */}
      <Modal visible={showNotificationModal} transparent animationType="fade" onRequestClose={() => setShowNotificationModal(false)}>
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <View style={s.modalIconWrap}>
                <Ionicons name="notifications-outline" size={28} color="#C8102E" />
              </View>
              <Text style={s.modalTitle}>Notification Settings</Text>
            </View>
            {[
              { label: 'Email Notifications', hint: 'Receive updates via email', key: 'emailNotifications' as const },
              { label: 'Push Notifications',  hint: 'Receive app notifications',  key: 'pushNotifications'  as const },
            ].map(item => (
              <View key={item.key} style={s.notifRow}>
                <View style={s.notifTexts}>
                  <Text style={s.notifTitle}>{item.label}</Text>
                  <Text style={s.notifHint}>{item.hint}</Text>
                </View>
                <Switch
                  value={notificationSettings[item.key]}
                  onValueChange={v => setNotificationSettings({ ...notificationSettings, [item.key]: v })}
                  trackColor={{ false: '#E5E7EB', true: '#FECACA' }}
                  thumbColor={notificationSettings[item.key] ? '#C8102E' : '#9CA3AF'}
                />
              </View>
            ))}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={s.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSaveNotificationSettings}>
                <Text style={s.saveTxt}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Profile Modal ── */}
      <Modal visible={showProfileModal} transparent animationType="fade" onRequestClose={() => setShowProfileModal(false)}>
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <View style={s.modalIconWrap}>
                <Ionicons name="person-outline" size={28} color="#C8102E" />
              </View>
              <Text style={s.modalTitle}>Update Profile</Text>
            </View>
            <Text style={s.inputLabel}>Full Name</Text>
            <View style={s.inputRow}>
              <Ionicons name="person-outline" size={16} color="#9CA3AF" style={s.inputIcon} />
              <TextInput style={s.input} placeholder="Your name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
            </View>
            <Text style={s.inputLabel}>Phone Number</Text>
            <View style={s.inputRow}>
              <Ionicons name="call-outline" size={16} color="#9CA3AF" style={s.inputIcon} />
              <TextInput style={s.input} placeholder="+91 98765 43210" placeholderTextColor="#9CA3AF" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowProfileModal(false)}>
                <Text style={s.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleUpdateProfile} disabled={isUpdatingProfile}>
                {isUpdatingProfile ? <ActivityIndicator color="#fff" /> : <Text style={s.saveTxt}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Become Donor Modal ── */}
      <Modal visible={showBecomeDonorModal} transparent animationType="slide" onRequestClose={() => setShowBecomeDonorModal(false)}>
        <View style={s.overlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={s.modalCard}>
              <View style={s.modalHeader}>
                <View style={s.modalIconWrap}>
                  <MaterialCommunityIcons name="blood-bag" size={28} color="#C8102E" />
                </View>
                <Text style={s.modalTitle}>Register as Donor</Text>
                <Text style={s.modalSub}>Fill in your details to become a blood donor</Text>
              </View>

              <Text style={s.inputLabel}>Blood Group *</Text>
              <View style={s.bloodGroupRow}>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <TouchableOpacity
                    key={bg}
                    style={[s.bgBtn, bloodGroup === bg && s.bgBtnActive]}
                    onPress={() => setBloodGroup(bg)}
                  >
                    <Text style={[s.bgBtnTxt, bloodGroup === bg && s.bgBtnTxtActive]}>{bg}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.inputLabel}>Location (Required) *</Text>
              <TouchableOpacity
                style={[s.locationBtn, locationObtained && s.locationBtnSuccess]}
                onPress={handleGetLocation}
                disabled={gettingLocation}
              >
                {gettingLocation
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Ionicons name={locationObtained ? 'checkmark-circle' : 'location-outline'} size={18} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={s.locationBtnTxt}>{locationObtained ? '✓ Location Captured' : 'Get Current Location'}</Text>
                    </>
                }
              </TouchableOpacity>
              {locationObtained && (
                <View style={s.locationCapture}>
                  <Ionicons name="location" size={13} color="#059669" />
                  <Text style={s.locationCaptureTxt}>{address || `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}</Text>
                </View>
              )}
              <Text style={s.locationNote}>Your location helps hospitals find nearby donors during emergencies</Text>

              <Text style={s.inputLabel}>Last Donation Date (Optional)</Text>
              <View style={s.inputRow}>
                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" style={s.inputIcon} />
                <TextInput style={s.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" value={lastDonationDate} onChangeText={setLastDonationDate} />
              </View>

              <Text style={s.inputLabel}>Address (Optional)</Text>
              <View style={s.inputRow}>
                <Ionicons name="home-outline" size={16} color="#9CA3AF" style={s.inputIcon} />
                <TextInput style={s.input} placeholder="Street, area..." placeholderTextColor="#9CA3AF" value={address} onChangeText={setAddress} />
              </View>

              <View style={s.modalBtns}>
                <TouchableOpacity
                  style={s.cancelBtn}
                  disabled={togglingDonor}
                  onPress={() => {
                    setShowBecomeDonorModal(false);
                    setBloodGroup(''); setLatitude(null); setLongitude(null);
                    setAddress(''); setCity(''); setState('');
                    setLastDonationDate(''); setLocationObtained(false);
                  }}
                >
                  <Text style={s.cancelTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleBecomeDonor} disabled={togglingDonor}>
                  {togglingDonor ? <ActivityIndicator color="#fff" /> : <Text style={s.saveTxt}>Register</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F9F5F5' },
  scroll:     { flexGrow: 1 },
  hero:       { backgroundColor: '#C8102E', paddingBottom: 28, paddingHorizontal: 20, alignItems: 'center', overflow: 'hidden', marginBottom: 16 },
  hc1:        { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -50 },
  hc2:        { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: -30 },
  avatar:     { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarTxt:  { fontSize: 30, fontWeight: '800', color: '#fff' },
  heroName:   { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 3 },
  heroEmail:  { color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '500', marginBottom: 10 },
  roleBadge:  { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', marginBottom: 8 },
  roleTxt:    { color: '#fff', fontSize: 12, fontWeight: '700' },
  phoneBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  phoneTxt:   { color: 'rgba(255,255,255,0.70)', fontSize: 12 },
  sectionGap:   { marginHorizontal: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  donorCard:        { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  donorCardActive:  { borderColor: '#FECACA', backgroundColor: '#FFF9F9' },
  donorCardTop:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  donorIconWrap:    { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  donorTexts:       { flex: 1 },
  donorTitle:       { fontSize: 15, fontWeight: '800', color: '#1A0A0F', marginBottom: 3 },
  donorSub:         { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  donorActiveBanner:{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#A7F3D0' },
  donorActiveTxt:   { color: '#059669', fontSize: 12, fontWeight: '600', flex: 1 },
  donorInfoBanner:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE' },
  donorInfoTxt:     { color: '#2563EB', fontSize: 12, fontWeight: '600', flex: 1 },
  menuItem:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  menuLeft:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuTexts:  { flex: 1 },
  menuTitle:  { fontSize: 15, fontWeight: '700', color: '#111827' },
  menuHint:   { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1F2', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', gap: 10 },
  logoutTxt:  { fontSize: 16, fontWeight: '700', color: '#C8102E' },
  version:    { textAlign: 'center', fontSize: 12, color: '#9CA3AF', paddingVertical: 20 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard:     { backgroundColor: '#fff', borderRadius: 22, padding: 22, width: '100%', maxWidth: 400 },
  modalHeader:   { alignItems: 'center', marginBottom: 20 },
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalTitle:    { fontSize: 20, fontWeight: '800', color: '#1A0A0F', textAlign: 'center' },
  modalSub:      { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  inputLabel:    { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginLeft: 2 },
  inputRow:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9F5F5', paddingHorizontal: 12, marginBottom: 14 },
  inputIcon:     { marginRight: 8 },
  input:         { flex: 1, paddingVertical: 13, fontSize: 15, color: '#111827' },
  modalBtns:     { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:     { flex: 1, backgroundColor: '#F3F4F6', padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelTxt:     { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  saveBtn:       { flex: 1, backgroundColor: '#C8102E', padding: 14, borderRadius: 12, alignItems: 'center', shadowColor: '#C8102E', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  saveTxt:       { fontSize: 15, fontWeight: '800', color: '#fff' },
  notifRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  notifTexts:  { flex: 1 },
  notifTitle:  { fontSize: 15, fontWeight: '700', color: '#111827' },
  notifHint:   { fontSize: 12, color: '#6B7280', marginTop: 2 },
  bloodGroupRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  bgBtn:              { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#F9F5F5', minWidth: 58, alignItems: 'center' },
  bgBtnActive:        { borderColor: '#C8102E', backgroundColor: '#FFF1F2' },
  bgBtnTxt:           { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  bgBtnTxtActive:     { color: '#C8102E' },
  locationBtn:        { backgroundColor: '#C8102E', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8, flexDirection: 'row', justifyContent: 'center' },
  locationBtnSuccess: { backgroundColor: '#059669' },
  locationBtnTxt:     { fontSize: 15, fontWeight: '700', color: '#fff' },
  locationCapture:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ECFDF5', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 8 },
  locationCaptureTxt: { color: '#059669', fontSize: 12, fontWeight: '600', flex: 1 },
  locationNote:       { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 14, fontStyle: 'italic' },
});

export default UserSettingsTab;
