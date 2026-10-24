import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { api } from '../../config/api';

interface BloodRequest { _id: string; bloodGroup: string; quantity: number; urgency: string; status: string; createdAt: string; }
interface Donor { id: string; name: string; email: string; phone: string; bloodGroup: string; status: string; hasLocationData: boolean; distance?: number; address?: string; rollNo?: string; totalDonations?: number; }

const BG = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPAT: Record<string, string[]> = { 'A+': ['A+','A-','O+','O-'], 'A-': ['A-','O-'], 'B+': ['B+','B-','O+','O-'], 'B-': ['B-','O-'], 'AB+': ['A+','A-','B+','B-','AB+','AB-','O+','O-'], 'AB-': ['A-','B-','AB-','O-'], 'O+': ['O+','O-'], 'O-': ['O-'] };

const AvailableDonorsScreen = () => {
  const [donors, setDonors]           = useState<Donor[]>([]);
  const [requests, setRequests]       = useState<BloodRequest[]>([]);
  const [selReq, setSelReq]           = useState('all');
  const [selBg, setSelBg]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => { setLoading(true); await Promise.all([fetchDonors(), fetchRequests()]); setLoading(false); };

  const fetchRequests = async () => {
    try { const r = await api.get('/blood-requests/hospital'); if (r.data.success) setRequests(r.data.bloodRequests || []); } catch {}
  };

  const fetchDonors = async () => {
    try {
      const r = await api.get('/donor-response/available-donors');
      if (r.data.success) setDonors(r.data.donors || []);
      else throw new Error(r.data.message);
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to load available donors'); }
    finally { setRefreshing(false); }
  };

  const filtered = (() => {
    let list = donors;
    if (selBg) list = list.filter(d => d.bloodGroup === selBg);
    if (selReq !== 'all') {
      const req = requests.find(r => r._id === selReq);
      if (req) { const compat = COMPAT[req.bloodGroup] || []; list = list.filter(d => d.hasLocationData && compat.includes(d.bloodGroup.trim())); }
    }
    return list;
  })();

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color="#C8102E" /></View>;

  return (
    <View style={s.root}>
      {/* Request filter */}
      {requests.length > 0 && (
        <View style={s.filterSection}>
          <Text style={s.filterLabel}>Filter by Request</Text>
          <FlatList horizontal showsHorizontalScrollIndicator={false}
            data={[{ _id: 'all', bloodGroup: 'All Donors', createdAt: '' } as any, ...requests]}
            keyExtractor={i => i._id} contentContainerStyle={s.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity style={[s.chip, selReq === item._id && s.chipActive]} onPress={() => setSelReq(item._id)}>
                <Text style={[s.chipTxt, selReq === item._id && s.chipTxtActive]}>
                  {item._id === 'all' ? 'All Donors' : `${item.bloodGroup} · ${new Date((item as BloodRequest).createdAt).toLocaleDateString()}`}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Blood group filter */}
      <View style={s.filterSection}>
        <Text style={s.filterLabel}>Blood Group  <Text style={s.filterCount}>{filtered.length} donors</Text></Text>
        <FlatList horizontal showsHorizontalScrollIndicator={false}
          data={[{ label: 'All', value: '' }, ...BG.map(g => ({ label: g, value: g }))]}
          keyExtractor={i => i.value || 'all'} contentContainerStyle={s.filterList}
          renderItem={({ item }) => {
            const cnt = item.value ? donors.filter(d => d.bloodGroup === item.value).length : donors.length;
            return (
              <TouchableOpacity style={[s.chip, selBg === item.value && s.chipActive]} onPress={() => setSelBg(item.value)}>
                <Text style={[s.chipTxt, selBg === item.value && s.chipTxtActive]}>{item.label}{cnt > 0 ? ` (${cnt})` : ''}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList data={filtered} keyExtractor={i => i.id}
        refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDonors(); }}
        contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🔍</Text>
            <Text style={s.emptyTitle}>No donors found</Text>
            <Text style={s.emptySub}>{selBg ? `No available donors with ${selBg}` : 'No available donors at the moment'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={s.cardLeft}>
                <View style={s.avatar}><Text style={s.avatarTxt}>{item.bloodGroup}</Text></View>
                <View style={s.cardInfo}>
                  <Text style={s.donorName}>{item.name}</Text>
                  <View style={[s.statusBadge, { backgroundColor: item.hasLocationData ? '#DCFCE7' : '#F3F4F6' }]}>
                    <Text style={[s.statusTxt, { color: item.hasLocationData ? '#065F46' : '#6B7280' }]}>
                      {item.hasLocationData ? '✓ Responded' : 'Not Contacted'}
                    </Text>
                  </View>
                </View>
              </View>
              {item.distance != null && (
                <View style={s.distBadge}><Text style={s.distTxt}>📍 {item.distance.toFixed(1)} km</Text></View>
              )}
            </View>
            <View style={s.cardBody}>
              {item.rollNo     && <InfoRow icon="🆔" text={item.rollNo} />}
              <InfoRow icon="📱" text={item.phone} />
              {item.address    && <InfoRow icon="🏠" text={item.address} />}
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${item.phone}`)} activeOpacity={0.8}>
                <Text style={s.callTxt}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.smsBtn} onPress={() => Linking.openURL(`sms:${item.phone}`)} activeOpacity={0.8}>
                <Text style={s.smsTxt}>💬 SMS</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const InfoRow = ({ icon, text }: { icon: string; text: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
    <Text style={{ fontSize: 16, marginRight: 8, width: 22 }}>{icon}</Text>
    <Text style={{ fontSize: 14, color: '#374151', flex: 1 }}>{text}</Text>
  </View>
);

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F9F5F5' },
  loading:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterSection:{ backgroundColor: '#fff', paddingTop: 12, paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterLabel:  { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.4, marginBottom: 8, textTransform: 'uppercase' },
  filterCount:  { color: '#C8102E', fontWeight: '800' },
  filterList:   { gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6' },
  chipActive:   { backgroundColor: '#C8102E' },
  chipTxt:      { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  chipTxtActive:{ color: '#fff' },
  list:         { padding: 14 },
  card:         { backgroundColor: '#fff', borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#F9F5F5', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  cardLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  avatar:       { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FEE2E2', borderWidth: 2, borderColor: '#C8102E', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { fontSize: 15, fontWeight: '800', color: '#C8102E' },
  cardInfo:     { flex: 1 },
  donorName:    { fontSize: 16, fontWeight: '700', color: '#1A0A0F', marginBottom: 4 },
  statusBadge:  { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  statusTxt:    { fontSize: 11, fontWeight: '700' },
  distBadge:    { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  distTxt:      { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  cardBody:     { padding: 14 },
  actions:      { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  callBtn:      { flex: 1, padding: 13, alignItems: 'center', backgroundColor: '#DBEAFE', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  callTxt:      { fontSize: 14, fontWeight: '700', color: '#1E40AF' },
  smsBtn:       { flex: 1, padding: 13, alignItems: 'center', backgroundColor: '#DCFCE7' },
  smsTxt:       { fontSize: 14, fontWeight: '700', color: '#166534' },
  empty:        { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:    { fontSize: 52, opacity: 0.3, marginBottom: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '800', color: '#1A0A0F', marginBottom: 6 },
  emptySub:     { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});

export default AvailableDonorsScreen;