import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const WelcomeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={s.root}>
      {/* Hero */}
      <View style={[s.hero, { paddingTop: insets.top + 40 }]}>
        <View style={s.hc1} />
        <View style={s.hc2} />
        <View style={s.logoCircle}>
          <MaterialCommunityIcons name="blood-bag" size={52} color="#C8102E" />
        </View>
        <Text style={s.appName}>Raktmap</Text>
        <Text style={s.tagline}>Save Lives Through Blood Donation</Text>
      </View>

      {/* Body */}
      <View style={[s.body, { paddingBottom: insets.bottom + 20 }]}>
        {/* Feature pills */}
        <View style={s.pillsRow}>
          {[
            { icon: 'map-marker-radius', label: 'Live Donor Map' },
            { icon: 'hospital-box', label: 'Hospital Connect' },
            { icon: 'bell-ring', label: 'Emergency Alerts' },
          ].map(({ icon, label }) => (
            <View key={label} style={s.pill}>
              <MaterialCommunityIcons name={icon} size={18} color="#C8102E" />
              <Text style={s.pillTxt}>{label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.desc}>
          Connect blood donors with those in need. Join thousands of heroes making a difference in emergency situations.
        </Text>

        {/* Buttons */}
        <View style={s.btnGroup}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
            <Ionicons name="log-in-outline" size={20} color="#fff" style={s.btnIcon} />
            <Text style={s.primaryBtnTxt}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
            <Ionicons name="person-add-outline" size={20} color="#C8102E" style={s.btnIcon} />
            <Text style={s.secondaryBtnTxt}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.testBtn} onPress={() => navigation.navigate('ConnectionTest')} activeOpacity={0.8}>
            <Ionicons name="wifi-outline" size={16} color="#6B7280" style={s.btnIcon} />
            <Text style={s.testBtnTxt}>Test Connection</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9F5F5' },
  hero: {
    backgroundColor: '#C8102E', paddingBottom: 36,
    alignItems: 'center', overflow: 'hidden',
  },
  hc1: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -60,
  },
  hc2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, left: -40,
  },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  appName: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  tagline: { color: 'rgba(255,255,255,0.72)', fontSize: 14, fontWeight: '500' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24, justifyContent: 'space-between' },
  pillsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  pill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 8,
    borderRadius: 12, borderWidth: 1, borderColor: '#FECACA',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  pillTxt: { fontSize: 10, fontWeight: '700', color: '#C8102E', flexShrink: 1 },
  desc: { fontSize: 15, color: '#4B5563', textAlign: 'center', lineHeight: 23, marginBottom: 24 },
  btnGroup: { gap: 12 },
  primaryBtn: {
    backgroundColor: '#C8102E', paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    shadowColor: '#C8102E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  primaryBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    borderWidth: 2, borderColor: '#C8102E',
  },
  secondaryBtnTxt: { color: '#C8102E', fontSize: 17, fontWeight: '800' },
  testBtn: {
    backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  testBtnTxt: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  btnIcon: { marginRight: 8 },
  footer: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 16, lineHeight: 16 },
});

export default WelcomeScreen;
