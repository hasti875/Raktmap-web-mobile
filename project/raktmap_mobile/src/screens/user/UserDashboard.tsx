import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import UserHomeTab from './tabs/UserHomeTab';
import UserSettingsTab from './tabs/UserSettingsTab';
// Import donor tabs that are safe for users
import DirectoryTab from '../donor/tabs/DirectoryTab';
import StockTab from '../donor/tabs/StockTab';
import MapTab from '../donor/tabs/MapTab';

const Tab = createBottomTabNavigator();

const UserDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#2563EB',
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
            <Text style={{ fontSize: size, color: focused ? '#2563EB' : '#9CA3AF' }}>
              {icon}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={UserHomeTab} />
      <Tab.Screen name="Live Map" component={MapTab} />
      <Tab.Screen name="Donors" component={DirectoryTab} />
      <Tab.Screen name="Stock" component={StockTab} />
      <Tab.Screen name="Settings" component={UserSettingsTab} />
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

export default UserDashboard;
