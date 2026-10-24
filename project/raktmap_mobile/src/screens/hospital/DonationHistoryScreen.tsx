// DonationHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { api } from '../../config/api';

const DonationHistoryScreen = () => {
  const [history, setHistory]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState<'all' | 'thisMonth' | 'thisYear'>('all');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const r = await api.get('/donation-history/donation-history');
      setHistory(r.data.success ? r.data.donationHistory || [] : []);
    } catch { setHistory([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const filtered = history.filter(item => {
    if (filter === 'all') return true;
    const d = new Date(item.completedAt || item.createdAt), now = new Date();
    if (filter === 'thisMonth') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return d.getFullYear() === now.getFullYear();
  });

  if (loading) return <View style={dh.loading}><ActivityIndicator size="large" color="#C8102E" /></View>;

  return (
    <View style={dh.root}>
      <View style={dh.filterBar}>
        {(['all', 'thisMonth', 'thisYear'] as const).map(f => (
          <TouchableOpacity key={f} style={[dh.filterBtn, filter === f && dh.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[dh.filterTxt, filter === f && dh.filterTxtActive]}>{f === 'all' ? 'All' : f === 'thisMonth' ? 'This Month' : 'This Year'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={dh.statsBar}><Text style={dh.statsTxt}>🩸 {filtered.length} donation{filtered.length !== 1 ? 's' : ''}</Text></View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} tintColor="#C8102E" />} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={dh.empty}><Text style={dh.emptyIcon}>📜</Text><Text style={dh.emptyTitle}>No donation history</Text><Text style={dh.emptySub}>Records appear once donors complete donations</Text></View>
        ) : (
          <View style={dh.list}>
            {filtered.map(d => (
              <View key={d._id} style={dh.card}>
                <View style={dh.cardTop}>
                  <View style={dh.bgBadge}><Text style={dh.bgBadgeTxt}>{d.donorBloodGroup || d.bloodGroup}</Text></View>
                  <Text style={dh.cardDate}>{new Date(d.completedAt || d.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={dh.cardBody}>
                  <DR label="Donor" value={d.donorName || 'N/A'} />
                  {d.donorPhone && <DR label="Phone" value={d.donorPhone} />}
                  {d.address   && <DR label="Location" value={d.address} />}
                  <View style={dh.statusRow}>
                    <Text style={dh.drLbl}>Status</Text>
                    <View style={[dh.statusBadge, { backgroundColor: d.status === 'completed' ? '#DCFCE7' : '#DBEAFE' }]}>
                      <Text style={[dh.statusTxt, { color: d.status === 'completed' ? '#166534' : '#1E40AF' }]}>{d.status?.charAt(0).toUpperCase() + d.status?.slice(1)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
const DR = ({ label, value }: { label: string; value: string }) => (
  <View style={dh.dr}><Text style={dh.drLbl}>{label}</Text><Text style={dh.drVal}>{value}</Text></View>
);
const dh = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F9F5F5' },
  loading:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar:   { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 8 },
  filterBtn:   { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#C8102E' },
  filterTxt:   { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  filterTxtActive: { color: '#fff' },
  statsBar:    { backgroundColor: '#DBEAFE', padding: 10, alignItems: 'center' },
  statsTxt:    { fontSize: 13, color: '#1E40AF', fontWeight: '700' },
  list:        { padding: 14 },
  card:        { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#F9F5F5', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  bgBadge:     { backgroundColor: '#C8102E', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  bgBadgeTxt:  { color: '#fff', fontWeight: '800', fontSize: 13 },
  cardDate:    { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  cardBody:    { padding: 14 },
  dr:          { flexDirection: 'row', marginBottom: 7 },
  drLbl:       { width: 75, fontSize: 13, color: '#6B7280', fontWeight: '600' },
  drVal:       { flex: 1, fontSize: 13, color: '#1A0A0F' },
  statusRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusTxt:   { fontSize: 12, fontWeight: '700' },
  empty:       { alignItems: 'center', paddingVertical: 80 },
  emptyIcon:   { fontSize: 52, opacity: 0.3, marginBottom: 12 },
  emptyTitle:  { fontSize: 18, fontWeight: '800', color: '#1A0A0F', marginBottom: 6 },
  emptySub:    { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
export { DonationHistoryScreen };
export default DonationHistoryScreen;