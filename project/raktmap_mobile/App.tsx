import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Import screens (we'll create these next)
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import VerifyOTPScreen from './src/screens/auth/VerifyOTPScreen';
import ConnectionTestScreen from './src/screens/shared/ConnectionTestScreen';
import DonorDashboard from './src/screens/donor/DonorDashboard';
import HospitalDashboard from './src/screens/hospital/HospitalDashboard';
import AdminDashboard from './src/screens/admin/AdminDashboard';
import UserDashboard from './src/screens/user/UserDashboard';
import ProfileSetupScreen from './src/screens/donor/ProfileSetupScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={user ? `auth-${userRole}-${user.isProfileComplete}` : 'guest'}
        screenOptions={{ headerShown: false }}
      >
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
            <Stack.Screen name="ConnectionTest" component={ConnectionTestScreen} />
          </>
        ) : (
          // Main App Stack - based on user role
          <>
            {userRole === 'donor' && (
              user.isProfileComplete ? (
                <Stack.Screen name="DonorDashboard" component={DonorDashboard} />
              ) : (
                <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
              )
            )}
            {userRole === 'hospital' && (
              <Stack.Screen name="HospitalDashboard" component={HospitalDashboard} />
            )}
            {userRole === 'user' && (
              <Stack.Screen name="UserDashboard" component={UserDashboard} />
            )}
            {userRole === 'admin' && (
              <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
