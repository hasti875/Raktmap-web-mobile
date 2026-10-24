import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { api } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

const C = { crimson: '#C8102E', white: '#FFFFFF' };
const TAB_BAR_HEIGHT = 68;

const MapTab = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [region, setRegion] = useState({ latitude: 20.5937, longitude: 78.9629, latitudeDelta: 0.1, longitudeDelta: 0.1 });
  const [donors, setDonors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setRegion({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.1, longitudeDelta: 0.1 });
        }
      } catch {}
      const res = await api.get('/donors');
      setDonors(res.data.filter((d: any) => d.latitude && d.longitude));
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  if (isLoading) return (
    <View style={s.loading}>
      <StatusBar barStyle="light-content" backgroundColor={C.crimson} />
      <ActivityIndicator size="large" color={C.crimson} />
      <Text style={s.loadingTxt}>Locating donors…</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.crimson} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <View style={s.hCircle1} /><View style={s.hCircle2} />
        <View style={s.hRow}>
          <View>
            <Text style={s.hSub}>Live</Text>
            <Text style={s.hTitle}>Nearby Donors</Text>
          </View>
          <View style={s.badge}>
            <View style={s.badgeDot} />
            <Text style={s.badgeTxt}>{donors.length} on map</Text>
          </View>
        </View>
      </View>

      {/* Map */}
      <MapView
        style={[s.map, { marginBottom: TAB_BAR_HEIGHT + insets.bottom }]}
        region={region}
        showsUserLocation
        showsMyLocationButton
      >
        {donors.map(donor => (
          <Marker
            key={`donor-${donor._id}`}
            coordinate={{ latitude: donor.latitude, longitude: donor.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            title={donor._id === user?._id ? 'You' : donor.name}
            description={`${donor.bloodGroup} · Available`}
          >
            <View style={s.markerWrap}>
              <View style={[s.markerBubble, donor._id === user?._id && s.markerSelf]}>
                <Text style={s.markerTxt}>{donor.bloodGroup}</Text>
              </View>
              <View style={[s.markerTail, donor._id === user?._id && s.markerTailSelf]} />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F9F5F5' },
  loading:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F5F5' },
  loadingTxt:   { marginTop: 12, fontSize: 14, color: '#6B7280' },
  header:       { backgroundColor: '#C8102E', paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
  hCircle1:     { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40 },
  hCircle2:     { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: -30 },
  hRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hSub:         { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  hTitle:       { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  badge:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  badgeDot:     { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4ADE80', marginRight: 6 },
  badgeTxt:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  map:          { flex: 1 },
  markerWrap:   { alignItems: 'center' },
  markerBubble: { backgroundColor: '#C8102E', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  markerSelf:   { backgroundColor: '#1D4ED8' },
  markerTxt:    { color: '#fff', fontSize: 12, fontWeight: '800' },
  markerTail:   { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#C8102E' },
  markerTailSelf: { borderTopColor: '#1D4ED8' },
});

export default MapTab;