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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VerifyOTPScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { email, password, name, phone, bloodGroup, role, birthdate } = route.params;

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/verify-registration', {
        email,
        otp,
        password,
        name,
        role,
        phone,
        bloodGroup,
        birthdate
      });

      Alert.alert('Success', 'Registration completed successfully! Please login.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login')
        }
      ]);
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
      Alert.alert('Success', 'OTP has been resent to your email');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
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
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{'\n'}
              <Text style={styles.email}>{email}</Text>
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Enter OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
              onPress={handleVerify}
              disabled={isLoading}
            >
              <Text style={styles.verifyButtonText}>
                {isLoading ? 'Verifying...' : 'Verify & Complete Registration'}
              </Text>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={isResending}
              >
                <Text style={[styles.resendLink, isResending && styles.resendLinkDisabled]}>
                  {isResending ? 'Sending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
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
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  email: {
    color: '#DC2626',
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
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
    padding: 16,
    fontSize: 24,
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  resendText: {
    color: '#6B7280',
    fontSize: 14,
  },
  resendLink: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
});

export default VerifyOTPScreen;
