import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
// @ts-ignore
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

const CustomDrawerContent = (props: any) => {
  const { logout, user } = useAuth();
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} // ✅ FIXED: was { flex: 1 }
      showsVerticalScrollIndicator={false}
    >
      {/* Crimson header */}
      <View style={s.header}>
        <View style={s.hc1} />
        <View style={s.hc2} />
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>🏥</Text>
        </View>
        <Text style={s.name}>{user?.name ?? 'Hospital'}</Text>
        <Text style={s.sub}>Blood Donation System</Text>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>● Active</Text>
        </View>
      </View>

      {/* Nav items */}
      <View style={s.items}>
        <DrawerItemList {...props} />
      </View>

      {/* Sign Out — scrolls with list, no longer stuck */}
      <TouchableOpacity
        style={s.logout}
        onPress={logout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color="#C8102E" />
        <Text style={s.logoutTxt}>Sign Out</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
};

const HospitalDashboard = () => {
  const { logout } = useAuth();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#C8102E' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18, letterSpacing: 0.2 },
        headerLeftContainerStyle: { paddingLeft: 10 },
        headerRightContainerStyle: { paddingRight: 10 },
        drawerActiveTintColor: '#C8102E',
        drawerInactiveTintColor: '#6B7280',
        drawerStyle: { backgroundColor: '#fff', width: 292 },
        drawerLabelStyle: { fontSize: 15, fontWeight: '600', marginLeft: -6 },
        drawerItemStyle: { borderRadius: 12, marginHorizontal: 8, marginVertical: 1 },
        drawerActiveBackgroundColor: '#FFF1F2',
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          headerRight: () => (
            <TouchableOpacity onPress={logout} style={{ marginRight: 5, padding: 8 }}>
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
          drawerIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="MyRequests"
        component={MyRequestsScreen}
        options={{
          title: 'My Requests',
          drawerIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="BloodStock"
        component={BloodStockScreen}
        options={{
          title: 'Blood Stock',
          drawerIcon: ({ color, size }) => <Ionicons name="water" size={size} color={color} />,
        }}
      />
      {/* <Drawer.Screen
        name="Donors"
        component={DonorsScreen}
        options={{
          title: 'Browse Donors',
          drawerIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      /> */}
      <Drawer.Screen
        name="SearchDonors"
        component={SearchDonorsScreen}
        options={{
          title: 'Search Donors',
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="account-search" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="AvailableDonors"
        component={AvailableDonorsScreen}
        options={{
          title: 'Available Donors',
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="account-check" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="LiveMap"
        component={LiveMapScreen}
        options={{
          title: 'Live Map',
          drawerIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="DonationHistory"
        component={DonationHistoryScreen}
        options={{
          title: 'Donation History',
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="history" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{
          title: 'Notifications',
          drawerIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          title: 'Scan QR Code',
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="qrcode-scan" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="HospitalSettings"
        component={HospitalSettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          drawerIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
};

const s = StyleSheet.create({
  header: { backgroundColor: '#C8102E', paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center', overflow: 'hidden' },
  hc1: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(255,255,255,0.06)', top: -65, right: -55 },
  hc2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: -35 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarTxt: { fontSize: 36 },
  name: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 3 },
  sub: { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '500' },
  badge: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  badgeTxt: { color: '#4ADE80', fontSize: 12, fontWeight: '700' },
  items: { paddingTop: 6 }, // ✅ FIXED: removed flex: 1
  logout: { flexDirection: 'row', alignItems: 'center', margin: 14, padding: 14, borderRadius: 14, backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECACA' },
  logoutTxt: { color: '#C8102E', fontSize: 15, fontWeight: '700', marginLeft: 10 },
});

export default HospitalDashboard;
