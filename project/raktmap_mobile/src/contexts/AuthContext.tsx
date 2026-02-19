import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config/api';
import { User, UserRole, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const role = await AsyncStorage.getItem('userRole') as UserRole | null;
      const userData = await AsyncStorage.getItem('userData');

      if (token && role && userData) {
        setUser(JSON.parse(userData));
        setUserRole(role);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await api.post('/login', { email, password });
      const { token, role, name, id, isProfileComplete, phone, willingToDonate, bloodGroup, isActive } = response.data;

      console.log('✅ Login successful - Role:', role, 'Name:', name, 'ID:', id, 'WillingToDonate:', willingToDonate);

      // Create user object from login response
      const userData: any = {
        _id: id || '',
        name: name || '',
        email: email,
        phone: phone || '',
        role: role,
        isActive: isActive !== undefined ? isActive : true,
        isProfileComplete: isProfileComplete || false
      };

      // Add donor-specific fields if user is a donor
      if (role === 'donor' || role === 'user') {
        userData.willingToDonate = willingToDonate || false;
        userData.bloodGroup = bloodGroup || null;
      }

      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userRole', role);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      setUser(userData);
      setUserRole(role);

      console.log('💾 User data saved to storage');
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data?.message || error.message);

      if (error.message === 'Network Error') {
        throw new Error('Cannot connect to server. Please check your internet connection and ensure the backend is running.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 503) {
        throw new Error('Server is temporarily unavailable. Please try again.');
      } else {
        throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
      }
    }
  };

  const register = async (userData: any) => {
    try {
      const { name, email, password, phone, role } = userData;

      if (role === 'donor') {
        // For donors, use the /donors endpoint (admin creates donors)
        // For now, we'll create a simplified donor registration
        const donorData = {
          name,
          email,
          phone: phone || '',
          password,
          bloodGroup: userData.bloodGroup || 'O+',
          dateOfBirth: userData.dateOfBirth || new Date('2000-01-01'),
          gender: userData.gender || 'Male',
          address: userData.address || '',
          isAvailable: true
        };

        // Note: This requires updating backend to support direct donor registration
        // For now, throw an error to guide users
        throw new Error('Donor registration requires admin approval. Please contact admin or register as Hospital.');
      } else {
        // Hospital registration - uses OTP verification
        const response = await api.post('/register', { name, email, password });

        if (response.data.success) {
          // Registration initiated - needs OTP verification
          throw new Error('VERIFICATION_REQUIRED:' + email);
        }
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('userData');

      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = async (updatedData: Partial<User>) => {
    try {
      if (!user?._id) throw new Error('User ID not found');

      // Use the generic users endpoint which handles all roles
      const response = await api.put(`/users/${user._id}`, updatedData);
      const updatedUser = response.data.user || response.data.donor || response.data.hospital;

      if (!updatedUser) throw new Error('Updated user data not returned from server');

      const newUser = { ...user, ...updatedUser };
      await AsyncStorage.setItem('userData', JSON.stringify(newUser));
      setUser(newUser);

      // Sync userRole if role changed
      if (updatedUser.role && updatedUser.role !== userRole) {
        console.log(`🔄 Role changed from ${userRole} to ${updatedUser.role}`);
        setUserRole(updatedUser.role);
        await AsyncStorage.setItem('userRole', updatedUser.role);
      }

      console.log('✅ Local user state and storage updated');
      return newUser;
    } catch (error: any) {
      console.error('❌ Update user failed:', error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Update failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
