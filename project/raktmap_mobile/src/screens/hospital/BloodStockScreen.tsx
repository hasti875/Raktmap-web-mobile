import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../config/api';

interface BloodStock { _id?: string; bloodGroup: string; unitsAvailable: number; status: string; lastUpdated: string | null; }
const BG = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const sCol = (st: string) => ({ available: '#10B981', low: '#F59E0B', critical: '#F97316', out_of_stock: '#EF4444' }[st] ?? '#6B7280');
const sBg  = (st: string) => ({ available: '#ECFDF5', low: '#FEF3C7', critical: '#FFEDD5', out_of_stock: '#FEE2E2' }[st] ?? '#F3F4F6');
const sLbl = (st: string) => st === 'out_of_stock' ? 'Out of Stock' : st.charAt(0).toUpperCase() + st.slice(1);

const BloodStockScreen = () => {
  const insets = useSafeAreaInsets();
  const [stocks, setStocks]         = useState<BloodStock[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [savingEach, setSavingEach] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [vals, setVals]             = useState<Record<string, string>>({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const r = await api.get('/blood-stock/my-stock');
      if (r.data.success) {
        const full = BG.map(bg => r.data.stocks?.find((s: BloodStock) => s.bloodGroup === bg) || { bloodGroup: bg, unitsAvailable: 0, status: 'out_of_stock', lastUpdated: null });
        setStocks(full);
        const v: Record<string, string> = {};
        full.forEach((s: BloodStock) => { v[s.bloodGroup] = s.unitsAvailable.toString(); });
        setVals(v);
      }
    } catch { Alert.alert('Error', 'Failed to load blood stock data'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const saveOne = async (bg: string) => {
    try {
      setSavingEach(p => ({ ...p, [bg]: true }));
      await api.post('/blood-stock/update', { bloodGroup: bg, unitsAvailable: parseInt(vals[bg]) || 0 });
      Alert.alert('Saved', `${bg} stock updated`);
      fetchData();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.error || 'Update failed'); }
    finally { setSavingEach(p => ({ ...p, [bg]: false })); }
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      await api.post('/blood-stock/bulk-update', { stocks: BG.map(bg => ({ bloodGroup: bg, unitsAvailable: parseInt(vals[bg]) || 0 })) });
      Alert.alert('Success', 'All blood stocks updated');
      fetchData();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.error || 'Failed to update stocks'); }
    finally { setSaving(false); }
  };

  if (loading && !refreshing) return (
    <View style={s.loading}><ActivityIndicator size="large" color="#C8102E" /><Text style={s.loadingTxt}>Loading stock data…</Text></View>
  );

  const counts = {
    available: stocks.filter(x => x.status === 'available').length,
    low:       stocks.filter(x => x.status === 'low').length,
    critical:  stocks.filter(x => x.status === 'critical').length,
    out:       stocks.filter(x => x.status === 'out_of_stock').length,
  };

  return (
    <View style={s.root}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={['#C8102E']} tintColor="#C8102E" />}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View style={s.summaryRow}>
          {[
            { l: 'Available', v: counts.available, bg: '#ECFDF5', col: '#10B981' },
            { l: 'Low',       v: counts.low,       bg: '#FEF3C7', col: '#F59E0B' },
            { l: 'Critical',  v: counts.critical,  bg: '#FFEDD5', col: '#F97316' },
            { l: 'Out',       v: counts.out,        bg: '#FEE2E2', col: '#EF4444' },
          ].map(({ l, v, bg, col }) => (
            <View key={l} style={[s.summaryCard, { backgroundColor: bg }]}>
              <Text style={[s.summaryVal, { color: col }]}>{v}</Text>
              <Text style={s.summaryLbl}>{l}</Text>
            </View>
          ))}
        </View>

        <Text style={s.secTitle}>Blood Group Stock Levels</Text>

        {stocks.map(stock => (
          <View key={stock.bloodGroup} style={s.stockCard}>
            <View style={s.stockTop}>
              <View style={s.stockAvatar}><Text style={s.stockAvatarTxt}>{stock.bloodGroup}</Text></View>
              <View style={{ flex: 1 }}>
                <View style={[s.statusPill, { backgroundColor: sBg(stock.status) }]}>
                  <Text style={[s.statusTxt, { color: sCol(stock.status) }]}>{sLbl(stock.status)}</Text>
                </View>
                {stock.lastUpdated && <Text style={s.lastUpd}>Updated {new Date(stock.lastUpdated).toLocaleDateString()} {new Date(stock.lastUpdated).toLocaleTimeString()}</Text>}
              </View>
            </View>
            <View style={s.inputRow}>
              <Text style={s.inputLbl}>Units Available</Text>
              <TextInput style={s.input} value={vals[stock.bloodGroup]} onChangeText={v => { if (v === '' || /^\d+$/.test(v)) setVals(p => ({ ...p, [stock.bloodGroup]: v })); }} keyboardType="numeric" placeholder="0" />
              <TouchableOpacity style={[s.saveBtn, savingEach[stock.bloodGroup] && s.saveBtnDim]} onPress={() => saveOne(stock.bloodGroup)} disabled={savingEach[stock.bloodGroup]} activeOpacity={0.8}>
                {savingEach[stock.bloodGroup] ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnTxt}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Info cards */}
        <View style={s.guide}>
          <Text style={s.guideTitle}>📊 Stock Status Guide</Text>
          {[['Available', '> 10 units', '#10B981'], ['Low', '6–10 units', '#F59E0B'], ['Critical', '1–5 units', '#F97316'], ['Out of Stock', '0 units', '#EF4444']].map(([l, v, c]) => (
            <View key={l} style={s.guideRow}>
              <View style={[s.guideDot, { backgroundColor: c }]} />
              <Text style={s.guideLbl}>{l}:</Text>
              <Text style={s.guideVal}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={[s.guide, { backgroundColor: '#F0FDF4', marginTop: 10 }]}>
          <Text style={[s.guideTitle, { color: '#166534' }]}>💡 Best Practices</Text>
          {['Update stock levels daily in the morning', 'Maintain minimum 10 units of each group', 'Notify blood bank when critically low'].map(t => (
            <Text key={t} style={[s.guideVal, { color: '#166534', marginBottom: 5 }]}>• {t}</Text>
          ))}
        </View>
      </ScrollView>

      {/* Save All FAB */}
      <View style={[s.fab, { bottom: insets.bottom + 14 }]}>
        <TouchableOpacity style={[s.fabBtn, saving && s.fabDim]} onPress={saveAll} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.fabTxt}>💾  Save All Changes</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F9F5F5' },
  loading:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt:   { marginTop: 12, color: '#6B7280', fontSize: 14 },
  scroll:       { padding: 16 },
  summaryRow:   { flexDirection: 'row', gap: 8, marginBottom: 20 },
  summaryCard:  { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  summaryVal:   { fontSize: 24, fontWeight: '800' },
  summaryLbl:   { fontSize: 10, color: '#6B7280', marginTop: 4, fontWeight: '600' },
  secTitle:     { fontSize: 17, fontWeight: '800', color: '#1A0A0F', marginBottom: 12 },
  stockCard:    { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  stockTop:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  stockAvatar:  { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FEE2E2', borderWidth: 2, borderColor: '#C8102E', alignItems: 'center', justifyContent: 'center' },
  stockAvatarTxt:{ fontSize: 16, fontWeight: '800', color: '#C8102E' },
  statusPill:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 4 },
  statusTxt:    { fontSize: 11, fontWeight: '700' },
  lastUpd:      { fontSize: 11, color: '#9CA3AF' },
  inputRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputLbl:     { flex: 1, fontSize: 13, color: '#6B7280', fontWeight: '600' },
  input:        { width: 90, borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, backgroundColor: '#F9F5F5', textAlign: 'center', fontWeight: '700', color: '#1A0A0F' },
  saveBtn:      { backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, minWidth: 64, alignItems: 'center' },
  saveBtnDim:   { opacity: 0.6 },
  saveBtnTxt:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  guide:        { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16, marginTop: 8 },
  guideTitle:   { fontSize: 14, fontWeight: '800', color: '#1E40AF', marginBottom: 12 },
  guideRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  guideDot:     { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  guideLbl:     { fontSize: 13, color: '#1E40AF', fontWeight: '600', width: 90 },
  guideVal:     { fontSize: 13, color: '#1E40AF' },
  fab:          { position: 'absolute', left: 16, right: 16 },
  fabBtn:       { backgroundColor: '#C8102E', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#C8102E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 8 },
  fabDim:       { opacity: 0.6 },
  fabTxt:       { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default BloodStockScreen;