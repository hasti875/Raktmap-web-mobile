import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import HomeTab from './tabs/HomeTab';
import MapTab from './tabs/MapTab';
import DirectoryTab from './tabs/DirectoryTab';
import StockTab from './tabs/StockTab';
import SettingsTab from './tabs/SettingsTab';

const Tab = createBottomTabNavigator();

const DonorDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          if (route.name === 'Home') icon = '🏠';
          else if (route.name === 'Live Map') icon = '📍';
          else if (route.name === 'Donors') icon = '👥';
          else if (route.name === 'Stock') icon = '📊';
          else if (route.name === 'Settings') icon = '⚙️';

          return (
            <Text style={{ fontSize: size, color: focused ? '#DC2626' : '#9CA3AF' }}>
              {icon}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Live Map" component={MapTab} />
      <Tab.Screen name="Donors" component={DirectoryTab} />
      <Tab.Screen name="Stock" component={StockTab} />
      <Tab.Screen name="Settings" component={SettingsTab} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DonorDashboard;
