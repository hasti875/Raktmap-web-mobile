import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../config/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const VerifyOTPScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { email, password, name, phone, bloodGroup, role, birthdate } = route.params;
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) { Alert.alert('Error', 'Please enter a valid 6-digit OTP'); return; }
    setIsLoading(true);
    try {
      await api.post('/verify-registration', { email, otp, password, name, role, phone, bloodGroup, birthdate });
      Alert.alert('Success 🎉', 'Registration completed! Please log in.', [{
        text: 'Go to Login', onPress: () => navigation.navigate('Login'),
      }]);
    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await api.post('/register', { email, password, name, role });
      Alert.alert('OTP Resent', 'A new code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={[s.hero, { paddingTop: insets.top + 20 }]}>
            <View style={s.hc1} />
            <View style={s.hc2} />
            <TouchableOpacity style={[s.backBtn, { top: insets.top + 12 }]} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={s.heroIcon}>
              <MaterialCommunityIcons name="email-check-outline" size={38} color="#C8102E" />
            </View>
            <Text style={s.heroTitle}>Verify Email</Text>
            <Text style={s.heroSub}>We sent a 6-digit code to</Text>
            <Text style={s.heroEmail}>{email}</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <View style={s.infoBanner}>
              <Ionicons name="information-circle-outline" size={16} color="#2563EB" />
              <Text style={s.infoTxt}>Check your inbox and spam folder. The code expires in 10 minutes.</Text>
            </View>

            {/* OTP Input */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Enter OTP Code</Text>
              <View style={s.otpRow}>
                <MaterialCommunityIcons name="numeric" size={20} color="#9CA3AF" style={s.inputIcon} />
                <TextInput
                  style={s.otpInput}
                  placeholder="• • • • • •"
                  placeholderTextColor="#D1D5DB"
                  value={otp}
                  onChangeText={t => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  editable={!isLoading}
                />
              </View>
              {otp.length > 0 && otp.length < 6 && (
                <Text style={s.helperTxt}>{6 - otp.length} more digit{6 - otp.length !== 1 ? 's' : ''} needed</Text>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[s.primaryBtn, (isLoading || otp.length !== 6) && s.btnDim]}
              onPress={handleVerify} disabled={isLoading || otp.length !== 6} activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={s.btnIcon} />
                    <Text style={s.primaryBtnTxt}>Verify & Complete Registration</Text>
                  </>
              }
            </TouchableOpacity>

            <View style={s.resendRow}>
              <Text style={s.resendTxt}>Didn't receive the code? </Text>
              <TouchableOpacity onPress={handleResendOTP} disabled={isResending}>
                {isResending
                  ? <ActivityIndicator size="small" color="#C8102E" />
                  : <Text style={s.resendLink}>Resend OTP</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9F5F5' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    backgroundColor: '#C8102E', paddingBottom: 32,
    paddingHorizontal: 20, alignItems: 'center', overflow: 'hidden',
  },
  hc1: {
    position: 'absolute', width: 210, height: 210, borderRadius: 105,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -65, right: -55,
  },
  hc2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: -35,
  },
  backBtn: {
    position: 'absolute', left: 20,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, padding: 6,
  },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 4 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
  heroEmail: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 4 },
  card: {
    margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 4,
  },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 22,
  },
  infoTxt: { color: '#2563EB', fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 18 },
  inputGroup: { marginBottom: 22 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  otpRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: '#C8102E', borderRadius: 14,
    backgroundColor: '#FFF1F2', paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 10 },
  otpInput: {
    flex: 1, paddingVertical: 16, fontSize: 28, fontWeight: '800',
    color: '#C8102E', letterSpacing: 12,
  },
  helperTxt: { fontSize: 12, color: '#F59E0B', marginTop: 6, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#C8102E', paddingVertical: 15, borderRadius: 14,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    marginBottom: 20, shadowColor: '#C8102E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 6,
  },
  primaryBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnIcon: { marginRight: 8 },
  btnDim: { opacity: 0.5 },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendTxt: { color: '#6B7280', fontSize: 14 },
  resendLink: { color: '#C8102E', fontSize: 14, fontWeight: '700' },
});

export default VerifyOTPScreen;
