import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Auth screens
import SplashScreen      from './src/screens/auth/SplashScreen';
import WelcomeScreen     from './src/screens/WelcomeScreen';
import LoginScreen       from './src/screens/auth/LoginScreen';
import RegisterScreen    from './src/screens/auth/RegisterScreen';
import VerifyOTPScreen   from './src/screens/auth/VerifyOTPScreen';

// Role dashboards
import HospitalDashboard from './src/screens/hospital/HospitalDashboard';
import DonorDashboard    from './src/screens/donor/DonorDashboard';
import UserDashboard     from './src/screens/user/UserDashboard'; // ✅

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#C8102E' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {user && userRole ? (
        <>
          {userRole === 'hospital' && (
            <Stack.Screen name="HospitalDashboard" component={HospitalDashboard} />
          )}
          {userRole === 'donor' && (
            <Stack.Screen name="DonorDashboard" component={DonorDashboard} /> // ✅ 5 tabs
          )}
          {userRole === 'user' && (
            <Stack.Screen name="UserDashboard" component={UserDashboard} />   // ✅ user view
          )}
        </>
      ) : (
        <>
          <Stack.Screen name="Splash"    component={SplashScreen} />
          <Stack.Screen name="Welcome"   component={WelcomeScreen} />
          <Stack.Screen name="Login"     component={LoginScreen} />
          <Stack.Screen name="Register"  component={RegisterScreen} />
          <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
