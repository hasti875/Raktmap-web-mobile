import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert, TouchableOpacity, Linking, FlatList } from 'react-native';
import { api } from '../../config/api';

const BG_FILTERS = ['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DonorsScreen = () => {
  const [donors, setDonors]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selBg, setSelBg]           = useState('all');

  useEffect(() => { fetchDonors(); }, []);

  const fetchDonors = async () => {
    try {
      const r = await api.get('/donors');
      setDonors(r.data || []);
    } catch { Alert.alert('Error', 'Failed to load donors'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const filtered  = donors.filter(d => selBg === 'all' || d.bloodGroup === selBg);
  const available = filtered.filter(d => d.isAvailable || d.status === 'available');
  const isAvail   = (d: any) => d.status === 'available' || d.isAvailable;

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color="#C8102E" /></View>;

  return (
    <View style={s.root}>
      {/* Blood group chips */}
      <View style={s.filterWrap}>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={BG_FILTERS} keyExtractor={i => i}
          contentContainerStyle={s.filterList}
          renderItem={({ item }) => {
            const cnt = item === 'all' ? donors.length : donors.filter(d => d.bloodGroup === item).length;
            return (
              <TouchableOpacity style={[s.chip, selBg === item && s.chipActive]} onPress={() => setSelBg(item)}>
                <Text style={[s.chipTxt, selBg === item && s.chipTxtActive]}>{item === 'all' ? 'All' : item}{cnt > 0 ? ` (${cnt})` : ''}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        <Text style={s.statsTxt}>✅ {available.length} available  ·  Total: {filtered.length}</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDonors(); }} tintColor="#C8102E" />} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>👥</Text>
            <Text style={s.emptyTitle}>No donors found</Text>
            <Text style={s.emptySub}>{selBg === 'all' ? 'No donors registered yet' : `No donors with blood group ${selBg}`}</Text>
          </View>
        ) : (
          <View style={s.list}>
            {filtered.map(donor => (
              <View key={donor._id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.cardLeft}>
                    <View style={s.avatar}><Text style={s.avatarTxt}>{donor.bloodGroup}</Text></View>
                    <View>
                      <Text style={s.donorName}>{donor.name}</Text>
                      <Text style={s.donorId}>ID: {donor.uniqueId || donor._id?.substring(0, 14)}…</Text>
                    </View>
                  </View>
                  <View style={[s.availBadge, { backgroundColor: isAvail(donor) ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[s.availTxt, { color: isAvail(donor) ? '#166534' : '#991B1B' }]}>{isAvail(donor) ? '✓ Available' : '✗ Unavailable'}</Text>
                  </View>
                </View>

                <View style={s.cardBody}>
                  {[['📧', donor.email], ['📱', donor.phone], ...(donor.address ? [['📍', donor.address]] : []), ['🩸', `${donor.totalDonations || 0} donations`], ...(donor.lastDonationDate ? [['📅', `Last: ${new Date(donor.lastDonationDate).toLocaleDateString()}`]] : [])].map(([icon, text]) => (
                    <View key={text as string} style={s.infoRow}>
                      <Text style={s.infoIcon}>{icon as string}</Text>
                      <Text style={s.infoTxt}>{text as string}</Text>
                    </View>
                  ))}
                </View>

                <View style={s.actions}>
                  <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${donor.phone}`)} activeOpacity={0.8}>
                    <Text style={s.callTxt}>📞 Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.smsBtn} onPress={() => Linking.openURL(`sms:${donor.phone}`)} activeOpacity={0.8}>
                    <Text style={s.smsTxt}>💬 SMS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F9F5F5' },
  loading:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterWrap:  { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', maxHeight: 56 },
  filterList:  { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip:        { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F3F4F6', height: 32, justifyContent: 'center' },
  chipActive:  { backgroundColor: '#C8102E' },
  chipTxt:     { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  chipTxtActive:{ color: '#fff' },
  statsBar:    { backgroundColor: '#FEF3C7', padding: 10, borderBottomWidth: 1, borderBottomColor: '#FDE68A' },
  statsTxt:    { fontSize: 13, color: '#92400E', fontWeight: '700', textAlign: 'center' },
  list:        { padding: 14 },
  card:        { backgroundColor: '#fff', borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#F9F5F5', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  cardLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar:      { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE2E2', borderWidth: 2, borderColor: '#C8102E', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 15, fontWeight: '800', color: '#C8102E' },
  donorName:   { fontSize: 15, fontWeight: '700', color: '#1A0A0F' },
  donorId:     { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  availBadge:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  availTxt:    { fontSize: 11, fontWeight: '700' },
  cardBody:    { padding: 14 },
  infoRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon:    { fontSize: 16, marginRight: 8, width: 22 },
  infoTxt:     { fontSize: 14, color: '#374151', flex: 1 },
  actions:     { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  callBtn:     { flex: 1, padding: 13, alignItems: 'center', backgroundColor: '#DBEAFE', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  callTxt:     { fontSize: 14, fontWeight: '700', color: '#1E40AF' },
  smsBtn:      { flex: 1, padding: 13, alignItems: 'center', backgroundColor: '#DCFCE7' },
  smsTxt:      { fontSize: 14, fontWeight: '700', color: '#166534' },
  empty:       { alignItems: 'center', paddingVertical: 80 },
  emptyIcon:   { fontSize: 52, opacity: 0.3, marginBottom: 12 },
  emptyTitle:  { fontSize: 18, fontWeight: '800', color: '#1A0A0F', marginBottom: 6 },
  emptySub:    { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});

export default DonorsScreen;