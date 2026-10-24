// src/screens/user/UserDashboard.tsx
import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserHomeTab from './tabs/UserHomeTab';
import UserSettingsTab from './tabs/UserSettingsTab';
import DirectoryTab from '../donor/tabs/DirectoryTab';
import StockTab from '../donor/tabs/StockTab';
import MapTab from '../donor/tabs/MapTab';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
  { name: 'Home',     label: 'Home',    icon: '🏠' },
  { name: 'Donors',   label: 'Donors',  icon: '👥' },
  { name: 'Live Map', label: 'Map',     icon: '📍' },
  { name: 'Stock',    label: 'Stock',   icon: '📊' },
  { name: 'Settings', label: 'Account', icon: '⚙️' },
];

const TabIcon = ({ icon, label, focused }: { icon: string; label: string; focused: boolean }) => {
  const scale      = useRef(new Animated.Value(focused ? 1.12 : 1)).current;
  const pillOp     = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pillScaleX = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,      { toValue: focused ? 1.12 : 1, useNativeDriver: false, friction: 5 }),
      Animated.timing(pillOp,     { toValue: focused ? 1 : 0,    useNativeDriver: false, duration: 180 }),
      Animated.spring(pillScaleX, { toValue: focused ? 1 : 0,    useNativeDriver: false, friction: 5 }),
    ]).start();
  }, [focused]);

  return (
    <View style={ti.wrap}>
      <Animated.View style={[ti.pill, { opacity: pillOp, transform: [{ scaleX: pillScaleX }] }]} />
      <Animated.Text style={[ti.icon, { transform: [{ scale }] }]}>{icon}</Animated.Text>
      <Text style={[ti.label, focused ? ti.labelOn : ti.labelOff]}>{label}</Text>
      {focused && <View style={ti.dot} />}
    </View>
  );
};

const ti = StyleSheet.create({
  wrap:     { alignItems: 'center', justifyContent: 'center', paddingTop: 6, width: 60 },
  pill:     { position: 'absolute', top: 2, width: 50, height: 34, borderRadius: 17, backgroundColor: 'rgba(200,16,46,0.10)' },
  icon:     { fontSize: 21, lineHeight: 27, zIndex: 1 },
  label:    { fontSize: 10, fontWeight: '700', marginTop: 3, letterSpacing: 0.3, zIndex: 1 },
  labelOn:  { color: '#C8102E' },
  labelOff: { color: '#B0A0A5' },
  dot:      { position: 'absolute', bottom: -5, width: 4, height: 4, borderRadius: 2, backgroundColor: '#C8102E' },
});

const CustomTabBar = ({ state, navigation }: any) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[tb.container, { paddingBottom: insets.bottom + 6 }]}>
      <View style={tb.bar}>
        <View style={tb.accent} />
        <View style={tb.tabs}>
          {state.routes.map((route: any, index: number) => {
            const cfg       = TAB_CONFIG.find(t => t.name === route.name);
            const isFocused = state.index === index;
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => {
                  const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!isFocused && !e.defaultPrevented) navigation.navigate(route.name);
                }}
                activeOpacity={0.75}
                style={tb.item}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
              >
                <TabIcon icon={cfg?.icon ?? '●'} label={cfg?.label ?? route.name} focused={isFocused} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const tb = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 14, backgroundColor: 'transparent' },
  bar:       { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 26, borderWidth: 1, borderColor: 'rgba(200,16,46,0.10)', shadowColor: '#C8102E', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.10, shadowRadius: 18, elevation: 14 },
  accent:    { height: 2, marginHorizontal: 44, marginTop: 9, borderRadius: 1, backgroundColor: '#C8102E', opacity: 0.2 },
  tabs:      { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4, paddingHorizontal: 4 },
  item:      { alignItems: 'center', flex: 1 },
});

const UserDashboard = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home"     component={UserHomeTab}     />
    <Tab.Screen name="Donors"   component={DirectoryTab}    />
    <Tab.Screen name="Live Map" component={MapTab}          />
    <Tab.Screen name="Stock"    component={StockTab}        />
    <Tab.Screen name="Settings" component={UserSettingsTab} />
  </Tab.Navigator>
);

export default UserDashboard;
