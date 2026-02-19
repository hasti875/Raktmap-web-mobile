import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { api, API_BASE_URL } from '../../config/api';

const ConnectionTestScreen = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (test: string, status: 'success' | 'fail' | 'info', message: string) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date() }]);
  };

  const runTests = async () => {
    setTestResults([]);
    setIsTesting(true);

    // Test 1: Check API URL
    addResult('Configuration', 'info', `API Base URL: ${API_BASE_URL}`);

    // Test 2: Try to reach backend
    try {
      const response = await api.get('/donors', { timeout: 5000 });
      addResult('Backend Connection', 'success', 'Successfully connected to backend');
    } catch (error: any) {
      if (error.message === 'Network Error') {
        addResult('Backend Connection', 'fail', 'Cannot reach backend. Check IP and WiFi connection.');
      } else if (error.response?.status === 401) {
        addResult('Backend Connection', 'success', 'Backend is accessible (authentication required)');
      } else {
        addResult('Backend Connection', 'fail', error.message);
      }
    }

    setIsTesting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🔧 Connection Test</Text>
          <Text style={styles.subtitle}>
            Test connectivity between mobile app and backend server
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.testButton, isTesting && styles.testButtonDisabled]}
          onPress={runTests}
          disabled={isTesting}
        >
          {isTesting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.testButtonText}>Run Connection Test</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resultsContainer}>
          {testResults.map((result, index) => (
            <View
              key={index}
              style={[
                styles.resultItem,
                result.status === 'success' && styles.resultSuccess,
                result.status === 'fail' && styles.resultFail,
                result.status === 'info' && styles.resultInfo,
              ]}
            >
              <Text style={styles.resultIcon}>
                {result.status === 'success' && '✅'}
                {result.status === 'fail' && '❌'}
                {result.status === 'info' && 'ℹ️'}
              </Text>
              <View style={styles.resultText}>
                <Text style={styles.resultTitle}>{result.test}</Text>
                <Text style={styles.resultMessage}>{result.message}</Text>
              </View>
            </View>
          ))}
        </View>

        {testResults.length > 0 && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Troubleshooting Tips:</Text>
            <Text style={styles.infoText}>
              • Ensure backend is running: npm run dev{'\n'}
              • Check you're on same WiFi network{'\n'}
              • Verify IP address in api.ts matches your PC{'\n'}
              • Try disabling VPN on phone and PC{'\n'}
              • Check Windows Firewall allows Node.js
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    gap: 12,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderLeftWidth: 4,
  },
  resultSuccess: {
    borderLeftColor: '#10B981',
  },
  resultFail: {
    borderLeftColor: '#EF4444',
  },
  resultInfo: {
    borderLeftColor: '#3B82F6',
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
});

export default ConnectionTestScreen;
