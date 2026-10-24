import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../config/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    bloodGroup: 'A+', birthdate: new Date(2000, 0, 1),
  });
  const [isWillingToDonate, setIsWillingToDonate] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showBirthdatePicker, setShowBirthdatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    const { name, email, phone, password, confirmPassword, bloodGroup, birthdate } = formData;
    const role = isWillingToDonate ? 'donor' : 'user';
    if (!name || !email || !phone || !password || !confirmPassword || !birthdate || (isWillingToDonate && !bloodGroup)) {
      Alert.alert('Error', 'Please fill in all fields'); return;
    }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      const response = await api.post('/register', { name, email, password, role, phone });
      if (response.data.success) {
        Alert.alert('OTP Sent', 'A verification code has been sent to your email.', [{
          text: 'OK',
          onPress: () => navigation.navigate('VerifyOTP', {
            email, password, name, phone,
            bloodGroup: isWillingToDonate ? bloodGroup : 'NK',
            role, birthdate: birthdate.toISOString(),
          }),
        }]);
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Please try again');
    } finally {
      setIsLoading(false);
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
          {/* Hero Header */}
          <View style={[s.hero, { paddingTop: insets.top + 20 }]}>
            <View style={s.hc1} />
            <View style={s.hc2} />
            <TouchableOpacity style={[s.backBtn, { top: insets.top + 12 }]} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={s.heroIcon}>
              <Ionicons name="person-add-outline" size={36} color="#C8102E" />
            </View>
            <Text style={s.heroTitle}>Create Account</Text>
            <Text style={s.heroSub}>Join Raktmap Today</Text>
          </View>

          {/* Form Card */}
          <View style={s.card}>
            {/* Name */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Full Name</Text>
              <View style={s.inputRow}>
                <Ionicons name="person-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
                <TextInput style={s.input} placeholder="John Doe" placeholderTextColor="#9CA3AF"
                  value={formData.name} onChangeText={t => setFormData({ ...formData, name: t })} editable={!isLoading} />
              </View>
            </View>

            {/* Email */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Email Address</Text>
              <View style={s.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
                <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor="#9CA3AF"
                  value={formData.email} onChangeText={t => setFormData({ ...formData, email: t })}
                  keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
              </View>
            </View>

            {/* Phone */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Phone Number</Text>
              <View style={s.inputRow}>
                <Ionicons name="call-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
                <TextInput style={s.input} placeholder="+91 98765 43210" placeholderTextColor="#9CA3AF"
                  value={formData.phone} onChangeText={t => setFormData({ ...formData, phone: t })}
                  keyboardType="phone-pad" editable={!isLoading} />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Date of Birth</Text>
              <TouchableOpacity style={s.dateBtn} onPress={() => setShowBirthdatePicker(true)} disabled={isLoading}>
                <Ionicons name="calendar-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
                <Text style={s.dateTxt}>{format(formData.birthdate, 'PPP')}</Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              {showBirthdatePicker && (
                <DateTimePicker value={formData.birthdate} mode="date" maximumDate={new Date()}
                  onChange={(_, date) => { setShowBirthdatePicker(false); if (date) setFormData({ ...formData, birthdate: date }); }} />
              )}
            </View>

            {/* Donor Toggle */}
            <View style={s.toggleCard}>
              <View style={s.toggleTop}>
                <MaterialCommunityIcons name="blood-bag" size={22} color="#C8102E" />
                <Text style={s.toggleTitle}>Willing to Donate Blood?</Text>
                <Switch value={isWillingToDonate} onValueChange={setIsWillingToDonate}
                  trackColor={{ false: '#E5E7EB', true: '#FECACA' }}
                  thumbColor={isWillingToDonate ? '#C8102E' : '#9CA3AF'} disabled={isLoading} />
              </View>
              <Text style={s.toggleDesc}>
                Activating this makes you an Active Donor and allows you to receive emergency SMS alerts.
              </Text>
            </View>

            {/* Blood Group */}
            {isWillingToDonate && (
              <View style={s.inputGroup}>
                <Text style={s.label}>Blood Group</Text>
                <View style={s.pickerWrap}>
                  <MaterialCommunityIcons name="water" size={18} color="#9CA3AF" style={s.inputIcon} />
                  <Picker selectedValue={formData.bloodGroup}
                    onValueChange={v => setFormData({ ...formData, bloodGroup: v })}
                    enabled={!isLoading} style={s.picker}>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'NK'].map(bg => (
                      <Picker.Item key={bg} label={bg} value={bg} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Password */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Password</Text>
              <View style={s.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
                <TextInput style={s.input} placeholder="Min. 6 characters" placeholderTextColor="#9CA3AF"
                  value={formData.password} onChangeText={t => setFormData({ ...formData, password: t })}
                  secureTextEntry={!showPassword} editable={!isLoading} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Confirm Password</Text>
              <View style={s.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
                <TextInput style={s.input} placeholder="Re-enter password" placeholderTextColor="#9CA3AF"
                  value={formData.confirmPassword} onChangeText={t => setFormData({ ...formData, confirmPassword: t })}
                  secureTextEntry={!showConfirmPassword} editable={!isLoading} />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={s.eyeBtn}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[s.primaryBtn, isLoading && s.btnDim]}
              onPress={handleRegister} disabled={isLoading} activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={s.btnIcon} />
                    <Text style={s.primaryBtnTxt}>Create Account</Text>
                  </>
              }
            </TouchableOpacity>

            <View style={s.footerRow}>
              <Text style={s.footerTxt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={s.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <View style={s.noteBanner}>
              <Ionicons name="information-circle-outline" size={15} color="#2563EB" />
              <Text style={s.noteTxt}>Hospitals must register via the web portal.</Text>
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
  dateBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    backgroundColor: '#F9F5F5', paddingHorizontal: 12, paddingVertical: 13,
  },
  dateTxt: { flex: 1, fontSize: 15, color: '#111827' },
  toggleCard: {
    backgroundColor: '#FFF1F2', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#FECACA', marginBottom: 18,
  },
  toggleTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  toggleTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A0A0F' },
  toggleDesc: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  pickerWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    backgroundColor: '#F9F5F5', paddingLeft: 12,
  },
  picker: { flex: 1, color: '#111827' },
  primaryBtn: {
    backgroundColor: '#C8102E', paddingVertical: 15, borderRadius: 14,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    marginTop: 4, marginBottom: 20, shadowColor: '#C8102E',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28,
    shadowRadius: 10, elevation: 6,
  },
  primaryBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnIcon: { marginRight: 8 },
  btnDim: { opacity: 0.6 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 14 },
  footerTxt: { color: '#6B7280', fontSize: 14 },
  footerLink: { color: '#C8102E', fontSize: 14, fontWeight: '700' },
  noteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  noteTxt: { color: '#2563EB', fontSize: 12, fontWeight: '600', flex: 1 },
});

export default RegisterScreen;
