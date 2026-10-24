import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../../../config/api';

interface DonorCardProps { donorId: string; }
interface CardData {
  donorId: string; name: string; bloodGroup: string;
  totalDonations: number; points: number;
  lastDonationDate?: string; memberSince: string;
  badge: string; badgeColor: string;
}

const DonorCard: React.FC<DonorCardProps> = ({ donorId }) => {
  const [data, setData]       = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/donors/${donorId}/card`);
        if (res.data.success) setData(res.data.card);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [donorId]);

  if (loading) return (
    <View style={s.loadWrap}>
      <ActivityIndicator size="large" color="#C8102E" />
    </View>
  );
  if (!data) return null;

  return (
    <View style={s.wrap}>
      <View style={s.card}>
        {/* Decorative circles */}
        <View style={s.circle1} />
        <View style={s.circle2} />
        <View style={s.circle3} />

        {/* Top row */}
        <View style={s.topRow}>
          <View>
            <Text style={s.cardLabel}>BLOOD DONOR CARD</Text>
            <Text style={s.cardBrand}>RaktMap</Text>
          </View>
          <View style={[s.badge, { backgroundColor: data.badgeColor }]}>
            <Text style={s.badgeTxt}>{data.badge}</Text>
          </View>
        </View>

        {/* Name + ID */}
        <View style={s.nameSection}>
          <Text style={s.name}>{data.name}</Text>
          <Text style={s.id}>ID: {data.donorId}</Text>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statCol}>
            <Text style={s.statLbl}>BLOOD GROUP</Text>
            <Text style={s.statVal}>{data.bloodGroup}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.statCol}>
            <Text style={s.statLbl}>DONATIONS</Text>
            <Text style={s.statVal}>{data.totalDonations}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.statCol}>
            <Text style={s.statLbl}>POINTS</Text>
            <Text style={s.statVal}>{data.points}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <View>
            <Text style={s.footLbl}>Member Since</Text>
            <Text style={s.footVal}>{new Date(data.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
          </View>
          {data.lastDonationDate && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.footLbl}>Last Donation</Text>
              <Text style={s.footVal}>{new Date(data.lastDonationDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap:      { marginVertical: 16 },
  loadWrap:  { height: 200, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#B91C1C',
    borderRadius: 20, padding: 22,
    minHeight: 210, overflow: 'hidden',
    shadowColor: '#B91C1C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  // Decorative circles
  circle1:   { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -60 },
  circle2:   { position: 'absolute', width: 140, height: 140, borderRadius: 70,  backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, left: -40 },
  circle3:   { position: 'absolute', width: 80,  height: 80,  borderRadius: 40,  backgroundColor: 'rgba(255,255,255,0.05)', top: 20, right: 60 },
  // Top
  topRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  cardLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  cardBrand: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 2 },
  badge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeTxt:  { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: '#1f3725' },
  // Name
  nameSection: { marginBottom: 16 },
  name:      { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  id:        { color: 'rgba(255,255,255,0.55)', fontSize: 11, letterSpacing: 1, marginTop: 4 },
  // Stats
  statsRow:  { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)', paddingTop: 14, marginBottom: 14 },
  statCol:   { flex: 1, alignItems: 'center' },
  statLbl:   { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5 },
  statVal:   { color: '#fff', fontSize: 26, fontWeight: '800' },
  divider:   { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.18)' },
  // Footer
  footer:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footLbl:   { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  footVal:   { color: '#fff', fontSize: 12, fontWeight: '600' },
});

export default DonorCard;