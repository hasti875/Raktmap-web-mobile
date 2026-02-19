import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// @ts-ignore - Expo vector icons types
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import HomeScreen from './HomeScreen';
import CreateRequestScreen from './CreateRequestScreen';
import MyRequestsScreen from './MyRequestsScreen';
import DonorsScreen from './DonorsScreen';
import ProfileScreen from './ProfileScreen';
import DonationHistoryScreen from './DonationHistoryScreen';
import NotificationCenterScreen from './NotificationCenterScreen';
import HospitalSettingsScreen from './HospitalSettingsScreen';
import SearchDonorsScreen from './SearchDonorsScreen';
import LiveMapScreen from './LiveMapScreen';
import AvailableDonorsScreen from './AvailableDonorsScreen';
import ScannerScreen from './ScannerScreen';
import BloodStockScreen from './BloodStockScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Custom Drawer Content
const CustomDrawerContent = (props: any) => {
  return (
    <DrawerContentScrollView {...props}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.drawerHeaderIcon}>
          <MaterialCommunityIcons name="hospital-building" size={40} color="#DC2626" />
        </View>
        <Text style={styles.drawerHeaderTitle}>Raktmap Hospital</Text>
        <Text style={styles.drawerHeaderSubtitle}>Blood Donation System</Text>
      </View>

      {/* Main Navigation Items */}
      <View style={styles.drawerSection}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
};

const HospitalDashboard = () => {
  const { logout } = useAuth();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#DC2626',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeftContainerStyle: {
          paddingLeft: 10,
        },
        headerRightContainerStyle: {
          paddingRight: 10,
        },
        drawerActiveTintColor: '#DC2626',
        drawerInactiveTintColor: '#6B7280',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '500',
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={logout}
              style={{ marginRight: 5, padding: 8 }}
            >
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Drawer.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{
          title: 'New Blood Request',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="MyRequests"
        component={MyRequestsScreen}
        options={{
          title: 'My Requests',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="BloodStock"
        component={BloodStockScreen}
        options={{
          title: 'Blood Stock',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="water" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Donors"
        component={DonorsScreen}
        options={{
          title: 'Browse Donors',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="SearchDonors"
        component={SearchDonorsScreen}
        options={{
          title: 'Search Donors',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-search" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AvailableDonors"
        component={AvailableDonorsScreen}
        options={{
          title: 'Available Donors',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-check" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="LiveMap"
        component={LiveMapScreen}
        options={{
          title: 'Live Map',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="DonationHistory"
        component={DonationHistoryScreen}
        options={{
          title: 'Donation History',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{
          title: 'Notifications',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          title: 'Scan QR Code',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="qr-code-scanner" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="HospitalSettings"
        component={HospitalSettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default HospitalDashboard;

const styles = StyleSheet.create({
  drawerHeader: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
    alignItems: 'center',
  },
  drawerHeaderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  drawerHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  drawerHeaderSubtitle: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
  },
  drawerSection: {
    paddingTop: 8,
  },
});
