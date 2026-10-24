import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../config/api';

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [stats, setStats] = useState({ activeRequests: 0, totalDonors: 0, completedThisMonth: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [reqRes, donRes, histRes] = await Promise.all([
        api.get('/blood-requests/hospital'),
        api.get('/donors'),
        api.get('/donation-history/donation-history'),
      ]);
      const reqs = reqRes.data.bloodRequests || [];
      setStats({
        activeRequests: reqs.filter((r: any) => r.status === 'active' || r.status === 'pending').length,
        totalDonors: donRes.data.length || 0,
        completedThisMonth: histRes.data.length || 0,
      });
      setRecentRequests(reqs.slice(0, 4));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const urgencyColor = (u: string) => ({ critical: '#EF4444', urgent: '#F59E0B', high: '#EF4444', medium: '#F59E0B', low: '#10B981', pregnancy: '#EC4899' }[u] ?? '#10B981');

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color="#C8102E" /></View>;

  return (
    <ScrollView style={s.root} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#C8102E" />} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={s.hero}>
        <View style={s.hc1} /><View style={s.hc2} />
        <Text style={s.heroGreet}>Welcome back 👋</Text>
        <Text style={s.heroName}>{user?.name}</Text>
        <Text style={s.heroSub}>Hospital Blood Management Dashboard</Text>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { label: 'Active\nRequests', value: stats.activeRequests, bg: '#FFF1F2', col: '#C8102E', icon: 'water', lib: 'Ion' },
          { label: 'Total\nDonors',   value: stats.totalDonors,    bg: '#EFF6FF', col: '#2563EB', icon: 'people', lib: 'Ion' },
          { label: 'Donations',       value: stats.completedThisMonth, bg: '#ECFDF5', col: '#059669', icon: 'check-circle', lib: 'Mat' },
        ].map(({ label, value, bg, col, icon, lib }) => (
          <View key={label} style={[s.statCard, { backgroundColor: bg }]}>
            <Text style={[s.statVal, { color: col }]}>{value}</Text>
            <Text style={s.statLbl}>{label}</Text>
            <View style={[s.statIcon, { borderColor: col + '30' }]}>
              {lib === 'Mat' ? <MaterialCommunityIcons name={icon} size={17} color={col} /> : <Ionicons name={icon} size={17} color={col} />}
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={s.section}>
        <Text style={s.secTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {[
            { label: 'New Request',    icon: 'add-circle',      screen: 'CreateRequest',    color: '#C8102E',  lib: 'Ion' },
            { label: 'Scan QR',        icon: 'qrcode-scan',     screen: 'Scanner',          color: '#2563EB',  lib: 'Mat' },
            { label: 'Blood Stock',    icon: 'water',           screen: 'BloodStock',       color: '#059669',  lib: 'Ion' },
            { label: 'Live Map',       icon: 'map',             screen: 'LiveMap',          color: '#D97706',  lib: 'Ion' },
            { label: 'Search Donors',  icon: 'account-search',  screen: 'SearchDonors',     color: '#7C3AED',  lib: 'Mat' },
            { label: 'History',        icon: 'history',         screen: 'DonationHistory',  color: '#0891B2',  lib: 'Mat' },
          ].map(({ label, icon, screen, color, lib }) => (
            <TouchableOpacity key={label} style={[s.actionCard, { backgroundColor: color }]} onPress={() => navigation.navigate(screen)} activeOpacity={0.85}>
              {lib === 'Mat' ? <MaterialCommunityIcons name={icon} size={24} color="#fff" /> : <Ionicons name={icon} size={24} color="#fff" />}
              <Text style={s.actionTxt}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Requests */}
      <View style={s.section}>
        <View style={s.secRow}>
          <Text style={s.secTitle}>Recent Blood Requests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyRequests')}><Text style={s.seeAll}>View All</Text></TouchableOpacity>
        </View>
        {recentRequests.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>No active requests</Text>
            <Text style={s.emptySub}>Create your first blood request to get started</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('CreateRequest')}>
              <Text style={s.emptyBtnTxt}>+ Create Request</Text>
            </TouchableOpacity>
          </View>
        ) : recentRequests.map(req => (
          <View key={req._id} style={s.reqCard}>
            <View style={s.reqTop}>
              <View style={s.bgBadge}><Text style={s.bgBadgeTxt}>{req.bloodGroup}</Text></View>
              <View style={[s.urgBadge, { backgroundColor: urgencyColor(req.urgency) + '18' }]}>
                <Text style={[s.urgTxt, { color: urgencyColor(req.urgency) }]}>{req.urgency?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Text style={s.reqDate}>{new Date(req.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={s.reqId}>ID: {req._id?.substring(0, 20)}…</Text>
            <Text style={s.reqInfo}>Units: {req.quantity}  ·  Patient: {req.patientName || 'N/A'}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F9F5F5' },
  loading:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero:       { backgroundColor: '#C8102E', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28, overflow: 'hidden' },
  hc1:        { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(255,255,255,0.06)', top: -65, right: -55 },
  hc2:        { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: -30 },
  heroGreet:  { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
  heroName:   { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
  heroSub:    { color: 'rgba(255,255,255,0.58)', fontSize: 12, marginTop: 5 },
  statsRow:   { flexDirection: 'row', padding: 16, gap: 10 },
  statCard:   { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', minHeight: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statVal:    { fontSize: 26, fontWeight: '800', color: '#1A0A0F' },
  statLbl:    { fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 8, lineHeight: 13 },
  statIcon:   { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  section:    { paddingHorizontal: 16, marginBottom: 20 },
  secRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secTitle:   { fontSize: 17, fontWeight: '800', color: '#1A0A0F', marginBottom: 12 },
  seeAll:     { color: '#C8102E', fontWeight: '700', fontSize: 13 },
  actionsGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '31%', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  actionTxt:  { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  reqCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  reqTop:     { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  bgBadge:    { backgroundColor: '#C8102E', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 8 },
  bgBadgeTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  urgBadge:   { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  urgTxt:     { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  reqDate:    { fontSize: 11, color: '#9CA3AF' },
  reqId:      { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 3 },
  reqInfo:    { fontSize: 12, color: '#6B7280' },
  empty:      { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  emptyIcon:  { fontSize: 40, marginBottom: 8, opacity: 0.35 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A0A0F', marginBottom: 4 },
  emptySub:   { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  emptyBtn:   { backgroundColor: '#C8102E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },
});

export default HomeScreen;