import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_BASE_URL = __DEV__
//   ? 'https://jule-uneroding-tremulously.ngrok-free.dev'
//   : 'https://jule-uneroding-tremulously.ngrok-free.dev';
  const API_BASE_URL = __DEV__
  ? 'http://192.168.1.73:5000' // Local IP for Android emulator
  : 'http://192.168.1.73:5000'; // Local IP for Android emulator

console.log('Mobile API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',  // ✅ Required for ngrok
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (__DEV__) {
        console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
        console.log('📦 Data:', config.data);
      }
    } catch (error) {
      console.error('Error reading auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('✅ API Response:', response.config.url, response.status);
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      console.log('❌ API Error:', error.config?.url);
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);

      if (error.code === 'ECONNABORTED') {
        console.log('⏱️ Request timeout - check backend is running');
      } else if (error.message === 'Network Error') {
        console.log('🌐 Network Error - check:');
        console.log('  1. Backend is running on port 5000');
        console.log('  2. ngrok is running: ngrok http 5000');
        console.log('  3. API_BASE_URL:', API_BASE_URL);
      }
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Session Expired - Clearing Auth State');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export { api, API_BASE_URL };
