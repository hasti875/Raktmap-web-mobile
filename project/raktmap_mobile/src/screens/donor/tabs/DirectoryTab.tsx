import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Linking, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../config/api';

const C = { crimson: '#C8102E', white: '#FFFFFF', offWhite: '#F9F5F5', ink: '#1A0A0F', gray: '#6B7280', border: '#E5E7EB', lightGray: '#F3F4F6' };
const TAB_BAR_HEIGHT = 68;

interface DonorItem {
  _id: string; name: string; bloodGroup: string; phone: string;
  city?: string; address?: string; isAvailable?: boolean; status?: string;
}

const DirectoryTab = () => {
  const insets = useSafeAreaInsets();
  const [search, setSearch]       = useState('');
  const [donors, setDonors]       = useState<DonorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => { fetchDonors(); }, []);

  const fetchDonors = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/donors');
      if (res.data) setDonors(res.data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  };

  const filtered = donors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.bloodGroup.toLowerCase().includes(search.toLowerCase()) ||
    (d.city && d.city.toLowerCase().includes(search.toLowerCase()))
  );

  const unavailable = (d: DonorItem) => d.isAvailable === false || d.status === 'unavailable';
  const bottomPad = TAB_BAR_HEIGHT + insets.bottom + 16;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.crimson} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <View style={s.hCircle1} /><View style={s.hCircle2} />
        <View style={s.hRow}>
          <View>
            <Text style={s.hSub}>Community</Text>
            <Text style={s.hTitle}>Donor Directory</Text>
          </View>
          <View style={s.countBubble}>
            <Text style={s.countNum}>{donors.length}</Text>
            <Text style={s.countLbl}>registered</Text>
          </View>
        </View>
        {/* Search */}
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search name, blood group or city…"
            placeholderTextColor="rgba(255,255,255,0.55)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={s.loading}>
          <ActivityIndicator size="large" color={C.crimson} />
          <Text style={s.loadingTxt}>Loading donors…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🔍</Text>
          <Text style={s.emptyTitle}>{search ? 'No results found' : 'No donors yet'}</Text>
          <Text style={s.emptySub}>{search ? `No donors match "${search}"` : 'Donors will appear here once registered.'}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={[s.list, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchDonors(); }} colors={[C.crimson]} tintColor={C.crimson} />}
          renderItem={({ item }) => (
            <View style={[s.card, unavailable(item) && s.cardDim]}>
              <View style={s.cardLeft}>
                {/* Blood group avatar */}
                <View style={[s.avatar, { borderColor: item.bloodGroup.includes('+') ? C.crimson : '#059669' }]}>
                  <Text style={s.avatarTxt}>{item.bloodGroup}</Text>
                </View>
                <View style={s.info}>
                  <Text style={s.name}>{item.name}</Text>
                  <Text style={s.city}>{item.city || item.address || 'Location not specified'}</Text>
                  {unavailable(item) && <Text style={s.unavail}>● Unavailable</Text>}
                </View>
              </View>
              <View style={s.actions}>
                <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${item.phone}`)} activeOpacity={0.8}>
                  <Text style={s.btnIcon}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.smsBtn} onPress={() => Linking.openURL(`sms:${item.phone}`)} activeOpacity={0.8}>
                  <Text style={s.btnIcon}>💬</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F9F5F5' },
  header:     { backgroundColor: '#C8102E', paddingHorizontal: 20, paddingBottom: 22, overflow: 'hidden' },
  hCircle1:   { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -50 },
  hCircle2:   { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -20, left: -35 },
  hRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  hSub:       { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  hTitle:     { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  countBubble:{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  countNum:   { color: '#fff', fontSize: 22, fontWeight: '800' },
  countLbl:   { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput:{ flex: 1, fontSize: 14, color: '#fff', fontWeight: '500' },
  loading:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon:  { fontSize: 52, marginBottom: 12, opacity: 0.35 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A0A0F', marginBottom: 6 },
  emptySub:   { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  list:       { padding: 16 },
  card:       { backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardDim:    { opacity: 0.6 },
  cardLeft:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar:     { width: 52, height: 52, borderRadius: 26, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2' },
  avatarTxt:  { fontWeight: '800', color: '#C8102E', fontSize: 15 },
  info:       { marginLeft: 12, flex: 1 },
  name:       { fontSize: 15, fontWeight: '700', color: '#1A0A0F' },
  city:       { fontSize: 13, color: '#6B7280', marginTop: 2 },
  unavail:    { fontSize: 11, color: '#C8102E', marginTop: 3, fontWeight: '700' },
  actions:    { flexDirection: 'row', gap: 8 },
  callBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  smsBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  btnIcon:    { fontSize: 18 },
});

export default DirectoryTab;