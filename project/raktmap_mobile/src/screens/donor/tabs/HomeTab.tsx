import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Switch, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../config/api';
import { Donor } from '../../../types';
import DonorCard from './DonorCard';

const C = {
  crimson: '#C8102E', white: '#FFFFFF', offWhite: '#F9F5F5',
  ink: '#1A0A0F', gray: '#6B7280', border: '#E5E7EB',
};
const TAB_BAR_HEIGHT = 68;

const HomeTab = () => {
  const insets = useSafeAreaInsets();
  const { user, updateUser, updateRole } = useAuth(); // ✅ add updateRole
  const donor = user as Donor;

  const [requests, setRequests]     = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [willing, setWilling]       = useState(donor?.willingToDonate ?? false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats]           = useState({ activeRequests: 0, availableDonors: 0, myDonations: 0 });

  useEffect(() => { fetchData(); }, []);

  // ✅ Always sync toggle with latest user data from AuthContext
  useEffect(() => {
    if (user?.willingToDonate !== undefined) {
      setWilling(user.willingToDonate);
    }
  }, [user?.willingToDonate, user?.role]);

  const toggleAvailability = async () => {
    try {
      setIsUpdating(true);
      const next    = !willing;
      const newRole = next ? 'donor' : 'user';

      // ✅ Step 1: Update backend
      await updateUser({
        role: newRole,
        willingToDonate: next,
        isActive: next,
      });

      // ✅ Step 2: Update AuthContext role → triggers App.tsx dashboard switch
      await updateRole(newRole);

      setWilling(next);

      Alert.alert(
        next ? '🩸 Active' : '👤 Unavailable',
        next
          ? 'You are now available for donation requests.'
          : 'You have deactivated your donor profile. Dashboard switching to User view.',
      );
    } catch {
      Alert.alert('Error', 'Could not update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res    = await api.get('/blood-requests/all');
      const all    = res.data.bloodRequests || [];
      const active = all.filter((r: any) => r.status === 'pending' || r.status === 'active');
      setRequests(active.slice(0, 3));
      let donorCount = 12;
      try { const dr = await api.get('/donors'); donorCount = dr.data.length; } catch {}
      setStats({
        activeRequests:  active.length,
        availableDonors: donorCount,
        myDonations:     donor?.totalDonations || 0,
      });
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const bottomPad = TAB_BAR_HEIGHT + insets.bottom + 16;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.crimson} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <View style={s.hCircle1} /><View style={s.hCircle2} />
        <View style={s.hRow}>
          <View>
            <Text style={s.hGreeting}>Welcome back 👋</Text>
            <Text style={s.hName}>{user?.name ?? 'Donor'}</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{(user?.name ?? 'D').charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Availability toggle */}
        <View style={s.availCard}>
          <View style={s.availLeft}>
            <Text style={s.availIcon}>🩸</Text>
            <View>
              <Text style={s.availTitle}>Available for Donation</Text>
              <Text style={s.availHint}>
                {willing
                  ? 'You will receive emergency requests'
                  : "Turn off → switches to User dashboard"}
              </Text>
            </View>
          </View>
          {isUpdating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Switch
              value={willing}
              onValueChange={toggleAvailability}
              disabled={isUpdating}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.75)' }}
              thumbColor={willing ? C.crimson : '#eee'}
            />
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {donor?._id && <DonorCard donorId={donor._id} />}

        <View style={s.statsRow}>
          <StatCard label="Active Requests"  value={stats.activeRequests}  icon="🩸" bg="#FFF1F2" />
          <StatCard label="Available Donors" value={stats.availableDonors} icon="👥" bg="#EFF6FF" />
          <StatCard label="My Donations"     value={stats.myDonations}     icon="✅" bg="#ECFDF5" />
        </View>

        <View style={s.secRow}>
          <Text style={s.secTitle}>Recent Blood Requests</Text>
          <TouchableOpacity onPress={fetchData}><Text style={s.refresh}>Refresh</Text></TouchableOpacity>
        </View>

        {isLoading
          ? <ActivityIndicator size="large" color={C.crimson} style={{ marginTop: 20 }} />
          : requests.length > 0
            ? requests.map(item => <RequestCard key={item._id} item={item} />)
            : (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>🩺</Text>
                <Text style={s.emptyTxt}>No active blood requests found.</Text>
              </View>
            )
        }
      </ScrollView>
    </View>
  );
};

const StatCard = ({ label, value, icon, bg }: { label: string; value: number; icon: string; bg: string }) => (
  <View style={[s.statCard, { backgroundColor: bg }]}>
    <Text style={s.statVal}>{value}</Text>
    <Text style={s.statLbl}>{label}</Text>
    <View style={s.statIconWrap}><Text style={s.statIcon}>{icon}</Text></View>
  </View>
);

const RequestCard = ({ item }: { item: any }) => (
  <View style={s.reqCard}>
    <View style={s.reqTop}>
      <View style={s.bgBadge}><Text style={s.bgBadgeTxt}>{item.bloodGroup}</Text></View>
      <View style={[s.urgBadge, { backgroundColor: item.urgency === 'critical' ? '#FEE2E2' : '#E0F2FE' }]}>
        <Text style={[s.urgTxt, { color: item.urgency === 'critical' ? '#DC2626' : '#0284C7' }]}>
          {item.urgency?.toUpperCase()}
        </Text>
      </View>
    </View>
    <Text style={s.reqId}>ID: {item._id?.substring(0, 15)}…</Text>
    <Text style={s.reqInfo}>Units: {item.unitsRequired || item.quantity || 1}</Text>
    <Text style={s.reqDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
  </View>
);

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F9F5F5' },
  header:     { backgroundColor: '#C8102E', paddingHorizontal: 20, paddingBottom: 22, overflow: 'hidden' },
  hCircle1:   { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.06)', top: -65, right: -45 },
  hCircle2:   { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -20, left: -30 },
  hRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  hGreeting:  { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '500', letterSpacing: 0.3 },
  hName:      { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  avatar:     { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { color: '#fff', fontSize: 20, fontWeight: '800' },
  availCard:  { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  availLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  availIcon:  { fontSize: 24, marginRight: 10 },
  availTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  availHint:  { color: 'rgba(255,255,255,0.68)', fontSize: 11, marginTop: 2 },
  scroll:     { padding: 16 },
  statsRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22, gap: 8 },
  statCard:   { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center', minHeight: 108, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statVal:    { fontSize: 26, fontWeight: '800', color: '#1A0A0F' },
  statLbl:    { fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 8, lineHeight: 13 },
  statIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  statIcon:   { fontSize: 15 },
  secRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  secTitle:   { fontSize: 17, fontWeight: '800', color: '#1A0A0F' },
  refresh:    { color: '#C8102E', fontWeight: '700', fontSize: 13 },
  reqCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  reqTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bgBadge:    { backgroundColor: '#C8102E', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  bgBadgeTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  urgBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  urgTxt:     { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  reqId:      { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 3 },
  reqInfo:    { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  reqDate:    { fontSize: 11, color: '#9CA3AF' },
  empty:      { alignItems: 'center', paddingVertical: 40 },
  emptyIcon:  { fontSize: 40, opacity: 0.35, marginBottom: 8 },
  emptyTxt:   { color: '#6B7280', fontSize: 14 },
});

export default HomeTab;
