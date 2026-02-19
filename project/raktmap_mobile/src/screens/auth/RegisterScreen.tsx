import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../config/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bloodGroup: 'A+',
    birthdate: new Date(2000, 0, 1),
  });
  const [isWillingToDonate, setIsWillingToDonate] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showBirthdatePicker, setShowBirthdatePicker] = useState(false);

  const handleRegister = async () => {
    const { name, email, phone, password, confirmPassword, bloodGroup, birthdate } = formData;
    const role = isWillingToDonate ? 'donor' : 'user';

    if (!name || !email || !phone || !password || !confirmPassword || !birthdate || (isWillingToDonate && !bloodGroup)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      // Send role and phone so backend checks against correct collection
      const response = await api.post('/register', { name, email, password, role, phone });

      if (response.data.success) {
        // OTP sent successfully, navigate to verification screen
        Alert.alert(
          'OTP Sent',
          'A verification code has been sent to your email. Please check your inbox.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('VerifyOTP', {
                email,
                password,
                name,
                phone,
                bloodGroup: isWillingToDonate ? bloodGroup : 'NK', // NK if not a donor
                role,
                birthdate: birthdate.toISOString()
              })
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Raktmap Today</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowBirthdatePicker(true)}
                disabled={isLoading}
              >
                <Text style={styles.dateText}>{format(formData.birthdate, 'PPP')}</Text>
                <Text style={styles.dateIcon}>📅</Text>
              </TouchableOpacity>
              {showBirthdatePicker && (
                <DateTimePicker
                  value={formData.birthdate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, date) => {
                    setShowBirthdatePicker(false);
                    if (date) setFormData({ ...formData, birthdate: date });
                  }}
                />
              )}
            </View>

            {/* Donation Toggle Section */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Are you willing to donate blood?</Text>
                <Switch
                  value={isWillingToDonate}
                  onValueChange={setIsWillingToDonate}
                  trackColor={{ false: '#D1D5DB', true: '#FECACA' }}
                  thumbColor={isWillingToDonate ? '#DC2626' : '#9CA3AF'}
                  disabled={isLoading}
                />
              </View>
              <Text style={styles.toggleDescription}>
                Activating this will make you an Active Donor and allow you to receive emergency SMS alerts.
              </Text>
            </View>

            {isWillingToDonate && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Blood Group</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.bloodGroup}
                    onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                    enabled={!isLoading}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'NK'].map((bg) => (
                      <Picker.Item key={bg} label={bg} value={bg} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(text) =>
                  setFormData({ ...formData, confirmPassword: text })
                }
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton,
                isLoading && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { marginTop: 10, textAlign: 'center' }]}>
                Hospitals must register via the web portal.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#DC2626',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  registerButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleContainer: {
    marginBottom: 24,
    backgroundColor: '#FFF1F2', // Light red background for emphasis
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  dateIcon: {
    fontSize: 20,
  },
});

export default RegisterScreen;
