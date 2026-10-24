import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../config/api';


import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const UserHomeTab = () => {
  const { user, updateUser, updateRole } = useAuth();
  const insets = useSafeAreaInsets();
  const [isUpdating, setIsUpdating]           = useState(false);
  const [willingToDonate, setWillingToDonate] = useState(user?.willingToDonate || false);
  const [stats, setStats] = useState({ availableDonors: 0, activeHospitals: 5 });

  useEffect(() => { fetchData(); }, []);


  useEffect(() => {
    if (user?.willingToDonate !== undefined) {
      setWillingToDonate(user.willingToDonate);
    }
  }, [user?.willingToDonate, user?.role]);

  const toggleBecomeDonor = async () => {
    try {
      setIsUpdating(true);
      const newStatus = !willingToDonate;
      const newRole   = newStatus ? 'donor' : 'user';

      await updateUser({
        role: newRole,
        willingToDonate: newStatus,
        isActive: newStatus,
      });


      await updateRole(newRole);

      setWillingToDonate(newStatus);

      Alert.alert(
        newStatus ? '🩸 Welcome back, Donor!' : '👤 Switched to User',
        newStatus
          ? 'You are now an active donor. You will receive emergency blood requests.'
          : 'You have deactivated your donor profile.',
      );
    } catch (error: any) {
      console.error('Toggle error:', error);

      const newStatus = !willingToDonate;
      const newRole   = newStatus ? 'donor' : 'user';
      await updateRole(newRole);
      setWillingToDonate(newStatus);

      Alert.alert(
        'Partial Update',
        'Dashboard switched but server sync failed. Will retry on next open.',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchData = async () => {
    try {
      const donorRes = await api.get('/donors');
      setStats(s => ({ ...s, availableDonors: donorRes.data.length || 0 }));
    } catch (e) {
      console.log('Could not fetch donors');
    }
  };

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}

          <View style={[s.hero, { paddingTop: insets.top + 24 }]}>
            <View style={s.hc1} />
            <View style={s.hc2} />
            <View style={s.heroIcon}>
              <MaterialCommunityIcons name="account-circle" size={38} color="#C8102E" />
            </View>
            <Text style={s.heroGreet}>Welcome back 👋</Text>
            <Text style={s.heroName}>{user?.name}</Text>
            <View style={s.badge}>
              <Text style={s.badgeTxt}>👤 Regular User</Text>
            </View>
          </View>


        {/* Become Donor Toggle Card */}
        <View style={[s.toggleCard, willingToDonate && s.toggleCardActive]}>
          <View style={s.toggleTop}>
            <View style={[s.toggleIconWrap, { backgroundColor: willingToDonate ? '#FEE2E2' : '#F3F4F6' }]}>
              <MaterialCommunityIcons
                name="blood-bag"
                size={26}
                color={willingToDonate ? '#C8102E' : '#9CA3AF'}
              />
            </View>
            <View style={s.toggleTexts}>
              <Text style={s.toggleTitle}>
                {willingToDonate ? 'Active Donor' : 'Become a Donor'}
              </Text>
              <Text style={s.toggleSub}>
                {willingToDonate
                  ? 'You are visible to hospitals & receiving alerts'
                  : 'Help save lives — toggle to register as donor'}
              </Text>
            </View>
            {isUpdating ? (
              <ActivityIndicator color="#C8102E" size="small" />
            ) : (
              <Switch
                value={willingToDonate}
                onValueChange={toggleBecomeDonor}
                trackColor={{ false: '#E5E7EB', true: '#FECACA' }}
                thumbColor={willingToDonate ? '#C8102E' : '#9CA3AF'}
              />
            )}
          </View>
          {willingToDonate ? (
            <View style={s.activeBanner}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={s.activeBannerTxt}>
                Dashboard will switch to Donor view automatically
              </Text>
            </View>
          ) : (
            <View style={s.infoBanner}>
              <Ionicons name="information-circle-outline" size={14} color="#2563EB" />
              <Text style={s.infoBannerTxt}>
                Toggle ON to become an active donor and receive blood requests
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Available\nDonors',  value: stats.availableDonors,  bg: '#EFF6FF', col: '#2563EB', icon: 'people-outline', lib: 'Ion' },
            { label: 'Active\nHospitals',  value: stats.activeHospitals,  bg: '#ECFDF5', col: '#059669', icon: 'hospital-box',   lib: 'Mat' },
          ].map(({ label, value, bg, col, icon, lib }) => (
            <View key={label} style={[s.statCard, { backgroundColor: bg }]}>
              <Text style={[s.statVal, { color: col }]}>{value}</Text>
              <Text style={s.statLbl}>{label}</Text>
              <View style={[s.statIcon, { borderColor: col }]}>
                {lib === 'Ion'
                  ? <Ionicons name={icon} size={18} color={col} />
                  : <MaterialCommunityIcons name={icon} size={18} color={col} />
                }
              </View>
            </View>
          ))}
        </View>

        {/* Info card shown only when not a donor */}
        {!willingToDonate && (
          <View style={s.infoCard}>
            <Text style={s.infoCardTitle}>About Regular Users</Text>
            <Text style={s.infoCardTxt}>
              As a regular user, you can browse donors and hospitals on the map.
              Toggle above to become an active donor and receive emergency alerts.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F9F5F5' },
  scroll: { flexGrow: 1 },
  hero: {
    backgroundColor: '#C8102E', paddingBottom: 28,
  paddingHorizontal: 20, alignItems: 'center',
  overflow: 'hidden', marginBottom: 16,
  },
  hc1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -50,
  },
  hc2: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: -30,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },
  heroGreet: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
  heroName:  { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4, marginBottom: 10 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14,
    paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  badgeTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  toggleCard: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff',
    borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  toggleCardActive: { borderColor: '#FECACA', backgroundColor: '#FFF9F9' },
  toggleTop:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  toggleIconWrap:{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toggleTexts:   { flex: 1 },
  toggleTitle:   { fontSize: 15, fontWeight: '800', color: '#1A0A0F', marginBottom: 3 },
  toggleSub:     { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#ECFDF5', padding: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  activeBannerTxt: { color: '#059669', fontSize: 12, fontWeight: '600', flex: 1 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', padding: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoBannerTxt: { color: '#2563EB', fontSize: 12, fontWeight: '600', flex: 1 },
  statsRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, marginBottom: 16,
  },
  statCard: {
    flex: 1, borderRadius: 16, padding: 16,
    alignItems: 'center', minHeight: 110,
  },
  statVal:  { fontSize: 28, fontWeight: '800', color: '#1A0A0F' },
  statLbl:  { fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 8, lineHeight: 15 },
  statIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#fff', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  infoCard: {
    marginHorizontal: 16, backgroundColor: '#EFF6FF',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoCardTitle: { fontSize: 14, fontWeight: '800', color: '#1E40AF', marginBottom: 6 },
  infoCardTxt:   { fontSize: 13, color: '#3B82F6', lineHeight: 20 },
});

export default UserHomeTab;
