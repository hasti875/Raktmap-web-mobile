import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Header */}
          <View style={[s.hero, { paddingTop: insets.top + 20 }]}>
            <View style={s.hc1} />
            <View style={s.hc2} />
            <TouchableOpacity style={[s.backBtn, { top: insets.top + 12 }]} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={s.heroIcon}>
              <Ionicons name="log-in-outline" size={36} color="#C8102E" />
            </View>
            <Text style={s.heroTitle}>Welcome Back</Text>
            <Text style={s.heroSub}>Sign in to your Raktmap account</Text>
          </View>

          {/* Form Card */}
          <View style={s.card}>
            {/* Email */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Email Address</Text>
              <View style={s.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
                <TextInput
                  style={s.input} placeholder="you@example.com" placeholderTextColor="#9CA3AF"
                  value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none" editable={!isLoading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Password</Text>
              <View style={s.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
                <TextInput
                  style={s.input} placeholder="Enter your password" placeholderTextColor="#9CA3AF"
                  value={password} onChangeText={setPassword}
                  secureTextEntry={!showPassword} editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={s.forgotRow}>
              <Text style={s.forgotTxt}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[s.primaryBtn, isLoading && s.btnDim]}
              onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="log-in-outline" size={20} color="#fff" style={s.btnIcon} />
                    <Text style={s.primaryBtnTxt}>Sign In</Text>
                  </>
              }
            </TouchableOpacity>

            <View style={s.footerRow}>
              <Text style={s.footerTxt}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={s.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={s.noteBanner}>
              <Ionicons name="information-circle-outline" size={15} color="#2563EB" />
              <Text style={s.noteTxt}>Hospitals must log in via the web portal.</Text>
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
  card: {
    margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 4,
  },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    backgroundColor: '#F9F5F5', paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: '#111827' },
  eyeBtn: { padding: 4 },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 22 },
  forgotTxt: { color: '#C8102E', fontSize: 13, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#C8102E', paddingVertical: 15, borderRadius: 14,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    marginBottom: 20, shadowColor: '#C8102E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 6,
  },
  primaryBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnIcon: { marginRight: 8 },
  btnDim: { opacity: 0.6 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  footerTxt: { color: '#6B7280', fontSize: 14 },
  footerLink: { color: '#C8102E', fontSize: 14, fontWeight: '700' },
  noteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  noteTxt: { color: '#2563EB', fontSize: 12, fontWeight: '600', flex: 1 },
});

export default LoginScreen;
