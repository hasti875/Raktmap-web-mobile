import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config/api';
import { User, UserRole, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token    = await AsyncStorage.getItem('authToken');
      const role     = await AsyncStorage.getItem('userRole') as UserRole | null;
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

      const userData: any = {
        _id: id || '',
        name: name || '',
        email: email,
        phone: phone || '',
        role: role,
        isActive: isActive !== undefined ? isActive : true,
        isProfileComplete: isProfileComplete || false,
      };

      if (role === 'donor' || role === 'user') {
        userData.willingToDonate = willingToDonate || false;
        userData.bloodGroup      = bloodGroup || null;
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
        throw new Error('Cannot connect to server. Please check your internet connection.');
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
        throw new Error('Donor registration requires admin approval. Please contact admin.');
      } else {
        const response = await api.post('/register', { name, email, password });
        if (response.data.success) {
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
      const response    = await api.put(`/users/${user._id}`, updatedData);
      const updatedUser = response.data.user || response.data.donor || response.data.hospital;
      if (!updatedUser) throw new Error('Updated user data not returned from server');

      const newUser = { ...user, ...updatedUser };
      await AsyncStorage.setItem('userData', JSON.stringify(newUser));
      setUser(newUser);

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

  // ✅ NEW — toggle between donor ↔ user without full API update
  const updateRole = async (newRole: UserRole) => {
  try {
    console.log(`🔄 Updating role to: ${newRole}`);
    setUserRole(newRole);
    await AsyncStorage.setItem('userRole', newRole);

    // ✅ Also update user object with correct willingToDonate + role
    if (user) {
      const updatedUser = {
        ...user,
        role: newRole,
        willingToDonate: newRole === 'donor', // ✅ true if donor, false if user
        isActive: newRole === 'donor',         // ✅ active only when donor
      };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);  // ✅ this triggers useEffect in HomeTab to sync toggle
    }

    console.log(`✅ Role updated to ${newRole}`);
  } catch (error) {
    console.error('❌ Failed to update role:', error);
  }
};

  return (
    <AuthContext.Provider value={{
      user, userRole, isLoading,
      login, register, logout, updateUser,
      updateRole, // ✅ exposed
    }}>
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
