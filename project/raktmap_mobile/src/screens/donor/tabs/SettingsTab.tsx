import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Switch, ActivityIndicator, Modal, TextInput, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../config/api';
import { Donor } from '../../../types';

const C = { crimson: '#C8102E', white: '#FFFFFF', offWhite: '#F9F5F5', ink: '#1A0A0F', gray: '#6B7280', border: '#E5E7EB', lightGray: '#F3F4F6' };
const TAB_BAR_HEIGHT = 68;

interface DonationStats {
  total: number;
  last: string;
}

const SettingsTab = () => {
  const insets = useSafeAreaInsets();
  const { logout, user, updateUser } = useAuth();
  const donor = user as Donor;

  const [willing, setWilling]         = useState(donor?.willingToDonate || false);
  const [isUpdating, setIsUpdating]   = useState(false);
  const [stats, setStats]             = useState<DonationStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [showPassModal, setShowPassModal]   = useState(false);
  const [currentPass, setCurrentPass]       = useState('');
  const [newPass, setNewPass]               = useState('');
  const [confirmPass, setConfirmPass]       = useState('');
  const [updatingPass, setUpdatingPass]     = useState(false);

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notif, setNotif] = useState({ email: true, sms: true, push: true, emergency: true });

  useEffect(() => { if (donor?.willingToDonate !== undefined) setWilling(donor.willingToDonate); }, [donor?.willingToDonate]);

  const formatDonationDate = (dateValue?: Date | string) => {
    if (!dateValue) return 'Never';
    const parsedDate = new Date(dateValue);
    return Number.isNaN(parsedDate.getTime()) ? 'Never' : parsedDate.toLocaleDateString();
  };

  const fetchStats = useCallback(async () => {
    if (!donor?._id) {
      setStats({ total: 0, last: 'Never' });
      setLoadingStats(false);
      return;
    }

    try {
      setLoadingStats(true);
      const donorRes = await api.get(`/donors/${donor._id}`);
      const latestDonor = donorRes.data as Partial<Donor>;

      setStats({
        total: latestDonor.totalDonations ?? donor.totalDonations ?? 0,
        last: formatDonationDate(latestDonor.lastDonationDate),
      });
    } catch {
      setStats({
        total: donor.totalDonations || 0,
        last: formatDonationDate(donor.lastDonationDate),
      });
    } finally {
      setLoadingStats(false);
    }
  }, [donor]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const toggleAvailability = async () => {
    try {
      setIsUpdating(true);
      const next = !willing;
      await updateUser({ role: next ? 'donor' : 'user', willingToDonate: next, isActive: next });
      setWilling(next);
      Alert.alert('Updated', `You are now ${next ? 'available' : 'unavailable'} for donation requests.`);
    } catch { Alert.alert('Error', 'Could not update status. Please try again.'); }
    finally { setIsUpdating(false); }
  };

  const handleUpdatePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) return Alert.alert('Error', 'Please fill in all fields');
    if (newPass.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    if (newPass !== confirmPass) return Alert.alert('Error', 'Passwords do not match');
    try {
      setUpdatingPass(true);
      await api.post('/change-password', { email: user?.email, currentPassword: currentPass, newPassword: newPass });
      Alert.alert('Success', 'Password updated!');
      setShowPassModal(false); setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed to update password'); }
    finally { setUpdatingPass(false); }
  };

  const bottomPad = TAB_BAR_HEIGHT + insets.bottom + 16;

  const menuItems = [
    { id: '1', title: 'Update Password',       icon: '🔒', hint: 'Change your security credentials' },
    { id: '2', title: 'Notification Settings', icon: '🔔', hint: 'Manage alerts and reminders' },
    { id: '3', title: 'Privacy Policy',        icon: '📄', hint: 'How we handle your data' },
    { id: '4', title: 'Contact Support',       icon: '🎧', hint: 'Get help or report issues' },
  ];

  const onMenuItem = (id: string) => {
    if (id === '1') setShowPassModal(true);
    else if (id === '2') setShowNotifModal(true);
    else if (id === '3') Alert.alert('Privacy Policy', 'Privacy policy content will be displayed here.');
    else if (id === '4') Alert.alert('Contact Support', 'Email: support@raktmap.com\nPhone: +91-XXXXXXXXXX');
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.crimson} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[s.header, { paddingTop: insets.top + 14 }]}>
          <View style={s.hCircle1} /><View style={s.hCircle2} />
          <View style={s.profileRow}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{user?.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={s.profileInfo}>
              <Text style={s.profileName}>{user?.name}</Text>
              <Text style={s.profileEmail}>{user?.email}</Text>
              <View style={s.badgeRow}>
                <View style={s.bgBadge}><Text style={s.bgBadgeTxt}>{donor?.bloodGroup || 'N/A'}</Text></View>
                <View style={[s.statusBadge, { backgroundColor: willing ? '#DCFCE7' : '#FEE2E2' }]}>
                  <Text style={[s.statusTxt, { color: willing ? '#15803D' : C.crimson }]}>
                    {willing ? '● Available' : '● Unavailable'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Availability toggle in header */}
          <View style={s.availCard}>
            <View style={s.availLeft}>
              <Text style={s.availIcon}>🩸</Text>
              <View>
                <Text style={s.availTitle}>Donation Availability</Text>
                <Text style={s.availHint}>{willing ? 'Receiving emergency requests' : 'Not receiving requests'}</Text>
              </View>
            </View>
            <Switch
              value={willing} onValueChange={toggleAvailability} disabled={isUpdating}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.75)' }}
              thumbColor={willing ? C.crimson : '#eee'}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={s.section}>
          <Text style={s.secLabel}>DONATION STATISTICS</Text>
          <View style={s.statsCard}>
            {loadingStats ? (
              <ActivityIndicator size="large" color={C.crimson} style={{ paddingVertical: 24 }} />
            ) : (
              <View style={s.statsRow}>
                <View style={s.statCol}>
                  <Text style={s.statVal}>{stats?.total ?? 0}</Text>
                  <Text style={s.statLbl}>Total Donations</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statCol}>
                  <Text style={[s.statVal, { fontSize: (stats?.last?.length ?? 0) > 6 ? 16 : 24 }]}>{stats?.last ?? 'Never'}</Text>
                  <Text style={s.statLbl}>Last Donation</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Menu */}
        <View style={s.section}>
          <Text style={s.secLabel}>ACCOUNT SETTINGS</Text>
          {menuItems.map(item => (
            <TouchableOpacity key={item.id} style={s.menuItem} onPress={() => onMenuItem(item.id)} activeOpacity={0.75}>
              <View style={s.menuLeft}>
                <View style={s.menuIconBg}><Text style={s.menuIcon}>{item.icon}</Text></View>
                <View>
                  <Text style={s.menuTitle}>{item.title}</Text>
                  <Text style={s.menuHint}>{item.hint}</Text>
                </View>
              </View>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View style={s.section}>
          <TouchableOpacity
            style={s.logoutBtn}
            onPress={() => Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: logout },
            ])}
            activeOpacity={0.8}
          >
            <Text style={s.logoutIcon}>🚪</Text>
            <Text style={s.logoutTxt}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.version}>Raktmap v1.0.0</Text>
      </ScrollView>

      {/* ── Password Modal ── */}
      <Modal visible={showPassModal} animationType="slide" transparent onRequestClose={() => setShowPassModal(false)}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>Update Password</Text>
            {[
              { val: currentPass, set: setCurrentPass, ph: 'Current Password' },
              { val: newPass,     set: setNewPass,     ph: 'New Password' },
              { val: confirmPass, set: setConfirmPass, ph: 'Confirm New Password' },
            ].map(({ val, set, ph }) => (
              <TextInput key={ph} style={m.input} placeholder={ph} placeholderTextColor="#9CA3AF" secureTextEntry value={val} onChangeText={set} />
            ))}
            <View style={m.btns}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => { setShowPassModal(false); setCurrentPass(''); setNewPass(''); setConfirmPass(''); }}>
                <Text style={m.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={m.saveBtn} onPress={handleUpdatePassword} disabled={updatingPass}>
                <Text style={m.saveTxt}>{updatingPass ? 'Updating…' : 'Update'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Notification Modal ── */}
      <Modal visible={showNotifModal} animationType="slide" transparent onRequestClose={() => setShowNotifModal(false)}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>Notifications</Text>
            {([
              { key: 'email',     label: 'Email Notifications', hint: 'Receive updates via email' },
              { key: 'sms',       label: 'SMS Notifications',   hint: 'Receive updates via SMS' },
              { key: 'push',      label: 'Push Notifications',  hint: 'Receive app notifications' },
              { key: 'emergency', label: 'Emergency Alerts',    hint: 'Urgent blood requests' },
            ] as const).map(({ key, label, hint }) => (
              <View key={key} style={m.notifRow}>
                <View>
                  <Text style={m.notifTitle}>{label}</Text>
                  <Text style={m.notifHint}>{hint}</Text>
                </View>
                <Switch
                  value={notif[key]}
                  onValueChange={v => setNotif({ ...notif, [key]: v })}
                  trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                  thumbColor={notif[key] ? C.crimson : '#f4f3f4'}
                />
              </View>
            ))}
            <View style={m.btns}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setShowNotifModal(false)}>
                <Text style={m.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={m.saveBtn} onPress={() => { Alert.alert('Saved', 'Notification settings saved!'); setShowNotifModal(false); }}>
                <Text style={m.saveTxt}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F9F5F5' },
  scroll:      { },
  header:      { backgroundColor: '#C8102E', paddingHorizontal: 20, paddingBottom: 22, overflow: 'hidden' },
  hCircle1:    { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -50 },
  hCircle2:    { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -20, left: -35 },
  profileRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatar:      { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 26, fontWeight: '800', color: '#fff' },
  profileInfo: { marginLeft: 14, flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  profileEmail:{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  badgeRow:    { flexDirection: 'row', marginTop: 8, gap: 8 },
  bgBadge:     { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  bgBadgeTxt:  { fontSize: 12, fontWeight: '800', color: '#fff' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusTxt:   { fontSize: 11, fontWeight: '700' },
  availCard:   { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  availLeft:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
  availIcon:   { fontSize: 22, marginRight: 10 },
  availTitle:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  availHint:   { color: 'rgba(255,255,255,0.68)', fontSize: 11, marginTop: 2 },
  section:     { paddingHorizontal: 16, marginTop: 24 },
  secLabel:    { fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginLeft: 2 },
  statsCard:   { backgroundColor: '#fff', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statsRow:    { flexDirection: 'row', alignItems: 'center' },
  statCol:     { flex: 1, alignItems: 'center' },
  statVal:     { fontSize: 26, fontWeight: '800', color: '#C8102E' },
  statLbl:     { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  menuItem:    { backgroundColor: '#fff', padding: 14, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  menuLeft:    { flexDirection: 'row', alignItems: 'center' },
  menuIconBg:  { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuIcon:    { fontSize: 20 },
  menuTitle:   { fontSize: 15, fontWeight: '700', color: '#1A0A0F' },
  menuHint:    { fontSize: 12, color: '#6B7280', marginTop: 2 },
  chevron:     { fontSize: 22, color: '#D1D5DB', fontWeight: '300' },
  logoutBtn:   { backgroundColor: '#FEE2E2', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FECACA' },
  logoutIcon:  { fontSize: 18, marginRight: 8 },
  logoutTxt:   { fontSize: 16, fontWeight: '800', color: '#C8102E' },
  version:     { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 20 },
});

const m = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 },
  title:      { fontSize: 20, fontWeight: '800', color: '#1A0A0F', marginBottom: 20, textAlign: 'center' },
  input:      { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15, color: '#1A0A0F' },
  btns:       { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:  { flex: 1, backgroundColor: '#F3F4F6', padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelTxt:  { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  saveBtn:    { flex: 1, backgroundColor: '#C8102E', padding: 14, borderRadius: 12, alignItems: 'center' },
  saveTxt:    { fontSize: 15, fontWeight: '700', color: '#fff' },
  notifRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  notifTitle: { fontSize: 15, fontWeight: '700', color: '#1A0A0F' },
  notifHint:  { fontSize: 12, color: '#6B7280', marginTop: 2 },
});

export default SettingsTab;