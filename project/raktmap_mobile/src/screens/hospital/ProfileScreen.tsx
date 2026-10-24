import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const confirmLogout = () => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: logout },
  ]);

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>

      {/* Profile card */}
      <View style={s.profileCard}>
        <View style={s.hc1} /><View style={s.hc2} />
        <View style={s.avatarWrap}>
          <Text style={s.avatarTxt}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.email}>{user?.email}</Text>
        <View style={s.roleBadge}><Text style={s.roleTxt}>🏥 Hospital Account</Text></View>
      </View>

      {/* Account Info */}
      <View style={s.section}>
        <Text style={s.secTitle}>Account Information</Text>
        {[
          ['Name',   user?.name     || '—'],
          ['Email',  user?.email    || '—'],
          ['Phone',  user?.phone    || 'Not set'],
          ['Role',   'Hospital'],
          ['Status', user?.isActive ? '● Active' : '● Inactive'],
        ].map(([lbl, val]) => (
          <View key={lbl} style={s.infoRow}>
            <Text style={s.infoLbl}>{lbl}:</Text>
            <Text style={[s.infoVal, lbl === 'Status' && { color: user?.isActive ? '#059669' : '#EF4444', fontWeight: '700' }]}>{val}</Text>
          </View>
        ))}
      </View>

      {/* Settings menu */}
      <View style={s.section}>
        <Text style={s.secTitle}>Settings</Text>
        {[
          { icon: '👤', label: 'Edit Profile',        hint: 'Update your hospital info' },
          { icon: '🔔', label: 'Notifications',        hint: 'Manage alert preferences'  },
          { icon: '🔒', label: 'Privacy & Security',   hint: 'Password and security'     },
          { icon: '❓', label: 'Help & Support',        hint: 'Get assistance'            },
          { icon: 'ℹ️', label: 'About Raktmap',         hint: 'Version & app info'        },
        ].map(({ icon, label, hint }) => (
          <TouchableOpacity key={label} style={s.menuItem} activeOpacity={0.7}>
            <View style={s.menuIconWrap}><Text style={s.menuIcon}>{icon}</Text></View>
            <View style={s.menuText}>
              <Text style={s.menuLabel}>{label}</Text>
              <Text style={s.menuHint}>{hint}</Text>
            </View>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* App info */}
      <View style={s.appInfo}>
        <Text style={s.appInfoTxt}>Raktmap Mobile v1.0.0</Text>
        <Text style={s.appInfoSub}>Blood Donation Management System</Text>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout} activeOpacity={0.85}>
        <Text style={s.logoutTxt}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F9F5F5' },
  profileCard: { backgroundColor: '#C8102E', paddingTop: 40, paddingBottom: 30, paddingHorizontal: 20, alignItems: 'center', overflow: 'hidden' },
  hc1:         { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(255,255,255,0.06)', top: -65, right: -55 },
  hc2:         { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: -30 },
  avatarWrap:  { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarTxt:   { fontSize: 34, color: '#fff', fontWeight: '800' },
  name:        { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  email:       { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginBottom: 14 },
  roleBadge:   { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  roleTxt:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  section:     { backgroundColor: '#fff', padding: 16, marginBottom: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  secTitle:    { fontSize: 16, fontWeight: '800', color: '#1A0A0F', marginBottom: 14 },
  infoRow:     { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLbl:     { width: 80, fontSize: 14, color: '#6B7280', fontWeight: '600' },
  infoVal:     { flex: 1, fontSize: 14, color: '#1A0A0F' },
  menuItem:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIconWrap:{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuIcon:    { fontSize: 20 },
  menuText:    { flex: 1 },
  menuLabel:   { fontSize: 15, fontWeight: '600', color: '#1A0A0F' },
  menuHint:    { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  menuArrow:   { fontSize: 22, color: '#D1D5DB' },
  appInfo:     { alignItems: 'center', paddingVertical: 16 },
  appInfoTxt:  { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  appInfoSub:  { fontSize: 12, color: '#D1D5DB', marginTop: 3 },
  logoutBtn:   { backgroundColor: '#C8102E', margin: 16, padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 40, shadowColor: '#C8102E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 6 },
  logoutTxt:   { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default ProfileScreen;