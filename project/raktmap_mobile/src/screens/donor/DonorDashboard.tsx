import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeTab from './tabs/HomeTab';
import MapTab from './tabs/MapTab';
import DirectoryTab from './tabs/DirectoryTab';
import StockTab from './tabs/StockTab';
import SettingsTab from './tabs/SettingsTab';

const Tab = createBottomTabNavigator();

export const C = {
  crimson:    '#C8102E',
  crimsonPill:'rgba(200,16,46,0.12)',
  white:      '#FFFFFF',
  offWhite:   '#F9F5F5',
  ink:        '#1A0A0F',
  muted:      '#B0A0A5',
  border:     'rgba(200,16,46,0.10)',
  tabBg:      'rgba(255,255,255,0.97)',
};

// Export so tabs can use it for bottom padding
export const TAB_BAR_HEIGHT = 68;

const TAB_CONFIG = [
  { name: 'Home',     label: 'Home',     icon: '🏠' },
  { name: 'Live Map', label: 'Map',      icon: '📍' },
  { name: 'Donors',   label: 'Donors',   icon: '👥' },
  { name: 'Stock',    label: 'Stock',    icon: '📊' },
  { name: 'Settings', label: 'Settings', icon: '⚙️' },
];

const TabIcon = ({ icon, label, focused }: { icon: string; label: string; focused: boolean }) => {
  const scale      = useRef(new Animated.Value(focused ? 1.12 : 1)).current;
  const pillOp     = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pillScaleX = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,      { toValue: focused ? 1.12 : 1, useNativeDriver: false, tension: 180, friction: 10 }),
      Animated.timing(pillOp,     { toValue: focused ? 1 : 0,    useNativeDriver: false, duration: 180 }),
      Animated.spring(pillScaleX, { toValue: focused ? 1 : 0,    useNativeDriver: false, tension: 160, friction: 12 }),
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
  pill:     { position: 'absolute', top: 2, width: 50, height: 34, borderRadius: 17, backgroundColor: C.crimsonPill },
  icon:     { fontSize: 21, lineHeight: 27, zIndex: 1 },
  label:    { fontSize: 10, fontWeight: '700', marginTop: 3, letterSpacing: 0.3, zIndex: 1 },
  labelOn:  { color: C.crimson },
  labelOff: { color: C.muted },
  dot:      { position: 'absolute', bottom: -5, width: 4, height: 4, borderRadius: 2, backgroundColor: C.crimson },
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
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, backgroundColor: 'transparent',
  },
  bar: {
    backgroundColor: C.tabBg, borderRadius: 26,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.crimson, shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.10, shadowRadius: 18, elevation: 14,
  },
  accent: {
    height: 2, marginHorizontal: 44, marginTop: 9,
    borderRadius: 1, backgroundColor: C.crimson, opacity: 0.2,
  },
  tabs: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 4, paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: 'center' },
});

const DonorDashboard = () => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home"     component={HomeTab} />
    <Tab.Screen name="Live Map" component={MapTab} />
    <Tab.Screen name="Donors"   component={DirectoryTab} />
    <Tab.Screen name="Stock"    component={StockTab} />
    <Tab.Screen name="Settings" component={SettingsTab} />
  </Tab.Navigator>
);

export default DonorDashboard;