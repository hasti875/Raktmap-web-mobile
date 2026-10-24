import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Linking, Alert, FlatList } from 'react-native';
import { api } from '../../config/api';

interface Donor { _id: string; name: string; email: string; phone: string; bloodGroup: string; status?: string; isAvailable: boolean; totalDonations: number; uniqueId?: string; }

const BG = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const SearchDonorsScreen = () => {
  const [donors, setDonors]     = useState<Donor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');
  const [selBg, setSelBg]       = useState('');

  useEffect(() => { fetchDonors(); }, []);

  const fetchDonors = async () => {
    try { const r = await api.get('/donors'); setDonors(r.data || []); }
    catch { Alert.alert('Error', 'Failed to load donors'); }
    finally { setLoading(false); }
  };

  const filtered = donors.filter(d => {
    const bgMatch = !selBg || d.bloodGroup === selBg;
    const q = query.toLowerCase().trim();
    const qMatch = !q || d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || d.phone.includes(q) || d.bloodGroup.toLowerCase().includes(q);
    return bgMatch && qMatch;
  });

  const isAvail = (d: Donor) => d.status === 'available' || d.isAvailable;

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color="#C8102E" /></View>;

  return (
    <View style={s.root}>
      {/* Search bar */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Search by name, email, or phone…" value={query} onChangeText={setQuery} placeholderTextColor="#9CA3AF" />
        {query.length > 0 && <TouchableOpacity onPress={() => setQuery('')}><Text style={s.clearBtn}>✕</Text></TouchableOpacity>}
      </View>

      {/* Blood group filter */}
      <View style={s.filterWrap}>
        <FlatList horizontal showsHorizontalScrollIndicator={false}
          data={[{ label: `All (${donors.length})`, value: '' }, ...BG.map(g => ({ label: `${g} (${donors.filter(d => d.bloodGroup === g).length})`, value: g }))]}
          keyExtractor={i => i.value || 'all'} contentContainerStyle={s.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.chip, selBg === item.value && s.chipActive]} onPress={() => setSelBg(item.value)}>
              <Text style={[s.chipTxt, selBg === item.value && s.chipTxtActive]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Result count */}
      <View style={s.resultsBar}>
        <Text style={s.resultsTxt}>Found {filtered.length} donor{filtered.length !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🔍</Text>
            <Text style={s.emptyTitle}>No donors found</Text>
            <Text style={s.emptySub}>Try adjusting your search or filter criteria</Text>
          </View>
        ) : (
          <View style={s.list}>
            {filtered.map(donor => (
              <View key={donor._id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.cardLeft}>
                    <View style={s.avatar}><Text style={s.avatarTxt}>{donor.bloodGroup}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.donorName}>{donor.name}</Text>
                      <View style={[s.availBadge, { backgroundColor: isAvail(donor) ? '#DCFCE7' : '#FEE2E2' }]}>
                        <Text style={[s.availTxt, { color: isAvail(donor) ? '#166534' : '#991B1B' }]}>{isAvail(donor) ? '✓ Available' : '✗ Unavailable'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={s.cardBody}>
                  {[['📧', donor.email], ['📱', donor.phone], ['🩸', `${donor.totalDonations || 0} donations`]].map(([icon, text]) => (
                    <View key={text as string} style={s.infoRow}>
                      <Text style={s.infoIcon}>{icon as string}</Text>
                      <Text style={s.infoTxt}>{text as string}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.actions}>
                  <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${donor.phone}`)} activeOpacity={0.8}><Text style={s.callTxt}>📞 Call</Text></TouchableOpacity>
                  <TouchableOpacity style={s.smsBtn} onPress={() => Linking.openURL(`sms:${donor.phone}`)} activeOpacity={0.8}><Text style={s.smsTxt}>💬 SMS</Text></TouchableOpacity>
                  <TouchableOpacity style={s.emailBtn} onPress={() => Linking.openURL(`mailto:${donor.email}`)} activeOpacity={0.8}><Text style={s.emailTxt}>✉️ Email</Text></TouchableOpacity>
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
  root:         { flex: 1, backgroundColor: '#F9F5F5' },
  loading:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 10 },
  searchIcon:   { fontSize: 18 },
  searchInput:  { flex: 1, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1A0A0F' },
  clearBtn:     { fontSize: 16, color: '#9CA3AF', padding: 4 },
  filterWrap:   { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', maxHeight: 56 },
  filterList:   { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F3F4F6', height: 32, justifyContent: 'center' },
  chipActive:   { backgroundColor: '#C8102E' },
  chipTxt:      { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  chipTxtActive:{ color: '#fff' },
  resultsBar:   { backgroundColor: '#DBEAFE', paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  resultsTxt:   { fontSize: 13, color: '#1E40AF', fontWeight: '700' },
  list:         { padding: 14 },
  card:         { backgroundColor: '#fff', borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardTop:      { padding: 14, backgroundColor: '#F9F5F5', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  cardLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:       { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE2E2', borderWidth: 2, borderColor: '#C8102E', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { fontSize: 15, fontWeight: '800', color: '#C8102E' },
  donorName:    { fontSize: 15, fontWeight: '700', color: '#1A0A0F', marginBottom: 4 },
  availBadge:   { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  availTxt:     { fontSize: 11, fontWeight: '700' },
  cardBody:     { padding: 14 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon:     { fontSize: 16, marginRight: 8, width: 22 },
  infoTxt:      { fontSize: 14, color: '#374151', flex: 1 },
  actions:      { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  callBtn:      { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#DBEAFE', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  callTxt:      { fontSize: 13, fontWeight: '700', color: '#1E40AF' },
  smsBtn:       { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#DCFCE7', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  smsTxt:       { fontSize: 13, fontWeight: '700', color: '#166534' },
  emailBtn:     { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#F3F4F6' },
  emailTxt:     { fontSize: 13, fontWeight: '700', color: '#374151' },
  empty:        { alignItems: 'center', paddingVertical: 80 },
  emptyIcon:    { fontSize: 52, opacity: 0.3, marginBottom: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '800', color: '#1A0A0F', marginBottom: 6 },
  emptySub:     { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});

export default SearchDonorsScreen;