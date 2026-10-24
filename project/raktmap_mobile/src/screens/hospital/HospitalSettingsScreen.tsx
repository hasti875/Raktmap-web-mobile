import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../config/api';

const HospitalSettingsScreen = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [address, setAddress] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif]     = useState(true);
  const [pushNotif, setPushNotif]   = useState(true);
  const [curPw, setCurPw]     = useState('');
  const [newPw, setNewPw]     = useState('');
  const [confPw, setConfPw]   = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      if (!user?._id) return;
      const r = await api.get(`/hospitals/${user._id}`);
      const d = r.data.hospital || r.data;
      setName(d.name || ''); setEmail(d.email || ''); setPhone(d.phone || ''); setAddress(d.address || '');
      setEmailNotif(d.emailNotifications !== false); setSmsNotif(d.smsNotifications !== false); setPushNotif(d.pushNotifications !== false);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    if (!name.trim() || !email.trim()) { Alert.alert('Error', 'Name and email are required'); return; }
    setSaving(true);
    try { await updateUser({ name, email, phone, address } as any); Alert.alert('Saved', 'Profile updated successfully'); }
    catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  const saveNotifs = async () => {
    setSaving(true);
    try { await updateUser({ emailNotifications: emailNotif, smsNotifications: smsNotif, pushNotifications: pushNotif } as any); Alert.alert('Saved', 'Notification settings updated'); }
    catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed to update settings'); }
    finally { setSaving(false); }
  };

  const changePw = async () => {
    if (!curPw || !newPw || !confPw) { Alert.alert('Error', 'All password fields are required'); return; }
    if (newPw.length < 6) { Alert.alert('Error', 'New password must be at least 6 characters'); return; }
    if (newPw !== confPw) { Alert.alert('Error', 'New passwords do not match'); return; }
    setSaving(true);
    try { await api.put(`/hospitals/${user?._id}`, { currentPassword: curPw, newPassword: newPw }); Alert.alert('Success', 'Password changed successfully'); setCurPw(''); setNewPw(''); setConfPw(''); }
    catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed to change password'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color="#C8102E" /></View>;

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>

      {/* Profile */}
      <Section title="👤 Profile Information">
        <Field label="Hospital Name" value={name} onChange={setName} placeholder="Enter hospital name" />
        <Field label="Email" value={email} onChange={setEmail} placeholder="Enter email" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone" value={phone} onChange={setPhone} placeholder="Enter phone number" keyboardType="phone-pad" />
        <Field label="Address" value={address} onChange={setAddress} placeholder="Enter hospital address" multiline />
        <SaveBtn onPress={saveProfile} saving={saving} label="Save Profile" />
      </Section>

      {/* Notifications */}
      <Section title="🔔 Notification Preferences">
        {[
          { label: 'Email Notifications', sub: 'Receive notifications via email', val: emailNotif, set: setEmailNotif },
          { label: 'SMS Notifications',   sub: 'Receive alerts via SMS',           val: smsNotif,   set: setSmsNotif   },
          { label: 'Push Notifications',  sub: 'Receive push notifications',       val: pushNotif,  set: setPushNotif  },
        ].map(({ label, sub, val, set }) => (
          <View key={label} style={s.switchRow}>
            <View style={s.switchInfo}>
              <Text style={s.switchLabel}>{label}</Text>
              <Text style={s.switchSub}>{sub}</Text>
            </View>
            <Switch value={val} onValueChange={set} trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }} thumbColor={val ? '#C8102E' : '#F3F4F6'} />
          </View>
        ))}
        <SaveBtn onPress={saveNotifs} saving={saving} label="Save Preferences" />
      </Section>

      {/* Password */}
      <Section title="🔒 Change Password">
        <Field label="Current Password" value={curPw} onChange={setCurPw} placeholder="Enter current password" secureTextEntry />
        <Field label="New Password" value={newPw} onChange={setNewPw} placeholder="Enter new password (min. 6 chars)" secureTextEntry />
        <Field label="Confirm New Password" value={confPw} onChange={setConfPw} placeholder="Confirm new password" secureTextEntry />
        <SaveBtn onPress={changePw} saving={saving} label="Change Password" color="#1E40AF" />
      </Section>
    </ScrollView>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={s.section}>
    <Text style={s.secTitle}>{title}</Text>
    {children}
  </View>
);

const Field = ({ label, value, onChange, ...rest }: any) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput style={[s.input, rest.multiline && s.textarea]} value={value} onChangeText={onChange} {...rest} />
  </View>
);

const SaveBtn = ({ onPress, saving, label, color = '#C8102E' }: { onPress: () => void; saving: boolean; label: string; color?: string }) => (
  <TouchableOpacity style={[s.saveBtn, { backgroundColor: color }, saving && s.saveBtnDim]} onPress={onPress} disabled={saving} activeOpacity={0.85}>
    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnTxt}>{label}</Text>}
  </TouchableOpacity>
);

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F9F5F5' },
  loading:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section:    { backgroundColor: '#fff', padding: 16, marginBottom: 14, borderRadius: 0, borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#E5E7EB' },
  secTitle:   { fontSize: 16, fontWeight: '800', color: '#1A0A0F', marginBottom: 16 },
  label:      { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  input:      { backgroundColor: '#F9F5F5', borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12, padding: 12, fontSize: 14, color: '#1A0A0F' },
  textarea:   { height: 80, textAlignVertical: 'top' },
  switchRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  switchInfo: { flex: 1, marginRight: 16 },
  switchLabel:{ fontSize: 15, fontWeight: '600', color: '#1A0A0F', marginBottom: 3 },
  switchSub:  { fontSize: 13, color: '#6B7280' },
  saveBtn:    { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16, shadowColor: '#C8102E', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  saveBtnDim: { opacity: 0.6 },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default HospitalSettingsScreen;