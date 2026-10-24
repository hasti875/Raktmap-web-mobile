import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../config/api';


interface Donor {
  _id: string;
  name: string;
  bloodGroup: string;
  phone: string;
  location?: {
    coordinates: [number, number];
  };
  isAvailable: boolean;
}


interface DonorResponse {
  _id: string;
  requestId?: string;
  name: string;
  phone: string;
  donorId: string;
  bloodGroup?: string;
  location: {
    lat: number;
    lng: number;
  };
  status: string;
  responseTime: string;
  address?: string;
}


interface BloodRequest {
  _id: string;
  bloodGroup: string;
  urgency: string;
  patientName: string;
  status: string;
  createdAt: string;
  location?: {
    coordinates: [number, number];
  };
}


const LiveMapScreen = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [respondedDonors, setRespondedDonors] = useState<DonorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('all-locations');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 22.602556127219323,
    longitude: 72.82048814218332,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [showDonors, setShowDonors] = useState(true);
  const [showRequests, setShowRequests] = useState(true);
  const [showResponses, setShowResponses] = useState(true);


  const formatDate = (date: any) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };


  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1); // Return distance with 1 decimal place
  };


  // Hospital coordinates (Charusat Hospital, Gujarat)
  const hospitalLocation = {
    latitude: 22.602556127219323,
    longitude: 72.82048814218332,
  };


  useEffect(() => {
    requestLocationPermission();
    fetchInitialData();
  }, []);


  // Fetch responded donors based on selection
  const fetchRespondedDonors = useCallback(async (requestId: string) => {
    try {
      console.log('Fetching responded donors for:', requestId);
      let response;
      if (requestId === 'all-locations') {
        response = await api.get('/donor-response/locations');
      } else {
        response = await api.get(`/donor-response/responses/${requestId}?timeFilter=after-request`);
      }


      if (response.data && response.data.success) {
        const responses = response.data.responses || [];
        setRespondedDonors(responses);
        console.log('Responded donors loaded:', responses.length);


        // Auto-center on the first responder if found and not all-locations
        if (responses.length > 0 && requestId !== 'all-locations') {
          const firstDonor = responses[0];
          const lat = firstDonor.location?.lat || firstDonor.latitude;
          const lng = firstDonor.location?.lng || firstDonor.longitude;


          if (lat && lng) {
            setMapRegion(prev => ({
              ...prev,
              latitude: Number(lat),
              longitude: Number(lng),
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching donor responses:', error);
    }
  }, []);


  // Auto-refresh responded donors every 10 seconds
  useEffect(() => {
    if (selectedRequestId) {
      fetchRespondedDonors(selectedRequestId);
      const interval = setInterval(() => {
        fetchRespondedDonors(selectedRequestId);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedRequestId, fetchRespondedDonors]);


  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        setMapRegion((prev) => ({
          ...prev,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };


  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [donorsRes, requestsRes] = await Promise.all([
        api.get('/donors'),
        api.get('/blood-requests/hospital'),
      ]);


      setDonors(donorsRes.data.filter((d: Donor) => d.location?.coordinates) || []);


      const bloodRequests = requestsRes.data.bloodRequests || [];
      setRequests(bloodRequests);


      await fetchRespondedDonors(selectedRequestId);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      Alert.alert('Error', 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  };


  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };


  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return '#DC2626';
      case 'urgent':
        return '#F59E0B';
      case 'normal':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };


  const onValueChange = (itemValue: string) => {
    setSelectedRequestId(itemValue);
  };


  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      {/* Selector Container */}
      <View style={styles.selectorContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.selectorLabel}>View context:</Text>
          <Text style={[styles.selectorLabel, { color: '#DC2626' }]}>
            {respondedDonors.length} responders found
          </Text>
        </View>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedRequestId}
            onValueChange={onValueChange}
            style={styles.picker}
            dropdownIconColor="#DC2626"
          >
            <Picker.Item label="All User Locations" value="all-locations" />
            {requests.map((req) => (
              <Picker.Item
                key={req._id}
                label={`(${req.bloodGroup}) ${formatDate(req.createdAt)}${req.patientName ? ` - ${req.patientName}` : ''}`}
                value={req._id}
              />
            ))}
          </Picker>
        </View>
      </View>


      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Hospital Marker */}
        <Marker
          coordinate={{
            latitude: 22.602556127219323,
            longitude: 72.82048814218332
          }}
          title="Charusat Hospital"
          description="Blood Donation Center - Gujarat"
        >
          <View style={styles.hospitalMarker}>
            <Text style={{ fontSize: 20 }}>🏥</Text>
          </View>
        </Marker>

        {/* Responded Donor Markers - Simple approach with standard callout */}
        {showResponses &&
          respondedDonors
            .filter((donor) => {
              if (selectedRequestId === 'all-locations') return true;
              return donor.requestId === selectedRequestId;
            })
            .map((donor) => {
              const lat = donor.location?.lat || (donor as any).latitude;
              const lng = donor.location?.lng || (donor as any).longitude;

              if (lat === undefined || lng === undefined) return null;

              const distanceKm = calculateDistance(
                hospitalLocation.latitude,
                hospitalLocation.longitude,
                Number(lat),
                Number(lng)
              );
              const distance = parseFloat(distanceKm);
              const proximityStatus = distance <= 5 ? 'Near (≤5km)' : distance <= 20 ? 'Moderate (≤20km)' : 'Far (>20km)';
              const proximityColor = distance <= 5 ? '#10B981' : distance <= 20 ? '#F59E0B' : '#EF4444';

              return (
                <Marker
                  key={`response-${donor._id}`}
                  coordinate={{
                    latitude: Number(lat),
                    longitude: Number(lng)
                  }}
                  pinColor="#3B82F6"
                >
                  <Callout>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>
                        {donor.name || 'Unknown User'}
                      </Text>

                      {donor.bloodGroup && (
                        <View style={styles.calloutRow}>
                          <Text style={styles.calloutLabel}>Blood Group:</Text>
                          <Text style={styles.calloutValue}>{donor.bloodGroup}</Text>
                        </View>
                      )}

                      {donor.phone && (
                        <View style={styles.calloutRow}>
                          <Text style={styles.calloutLabel}>Phone:</Text>
                          <Text style={styles.calloutValue}>{donor.phone}</Text>
                        </View>
                      )}

                      {donor.address && (
                        <Text style={styles.calloutAddress}>
                          📍 {donor.address}
                        </Text>
                      )}

                      <View style={styles.calloutDivider} />

                      <View style={styles.calloutRow}>
                        <Text style={styles.calloutLabel}>Distance:</Text>
                        <Text style={[styles.calloutValue, { color: '#DC2626', fontWeight: '700' }]}>
                          {distanceKm} km
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: proximityColor }]}>
                        <Text style={styles.statusText}>{proximityStatus}</Text>
                      </View>
                    </View>
                  </Callout>
                </Marker>
              );
            })}

        {/* Static Donor Markers */}
        {showDonors &&
          donors.map((donor) => {
            if (!donor.location?.coordinates) return null;
            const [longitude, latitude] = donor.location.coordinates;
            return (
              <Marker
                key={`donor-${donor._id}`}
                coordinate={{ latitude, longitude }}
                pinColor={donor.isAvailable ? '#10B981' : '#9CA3AF'}
              >
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{donor.name}</Text>
                    <Text style={styles.calloutSubtitle}>
                      Blood Group: {donor.bloodGroup}
                    </Text>
                    <Text style={styles.calloutSubtitle}>Phone: {donor.phone}</Text>
                    <Text
                      style={[
                        styles.calloutStatus,
                        { color: donor.isAvailable ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {donor.isAvailable ? '✓ Available' : '✗ Not Available'}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}

        {/* Blood Request Markers */}
        {showRequests &&
          requests.map((request) => {
            if (!request.location?.coordinates) return null;
            const [longitude, latitude] = request.location.coordinates;
            return (
              <Marker
                key={`request-${request._id}`}
                coordinate={{ latitude, longitude }}
                pinColor={getUrgencyColor(request.urgency)}
              >
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>Blood Request</Text>
                    <Text style={styles.calloutSubtitle}>
                      Patient: {request.patientName}
                    </Text>
                    <Text style={styles.calloutSubtitle}>
                      Blood Group: {request.bloodGroup}
                    </Text>
                    <Text
                      style={[
                        styles.calloutUrgency,
                        { color: getUrgencyColor(request.urgency) },
                      ]}
                    >
                      {request.urgency.toUpperCase()}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.legendItem}
            onPress={() => setShowResponses(!showResponses)}
          >
            <View
              style={[
                styles.legendDot,
                { backgroundColor: '#3B82F6', opacity: showResponses ? 1 : 0.3 },
              ]}
            />
            <Text style={styles.legendText}>Responded ({respondedDonors.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legendItem}
            onPress={() => setShowDonors(!showDonors)}
          >
            <View
              style={[
                styles.legendDot,
                { backgroundColor: '#10B981', opacity: showDonors ? 1 : 0.3 },
              ]}
            />
            <Text style={styles.legendText}>Donors ({donors.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legendItem}
            onPress={() => setShowRequests(!showRequests)}
          >
            <View
              style={[
                styles.legendDot,
                { backgroundColor: '#DC2626', opacity: showRequests ? 1 : 0.3 },
              ]}
            />
            <Text style={styles.legendText}>Requests ({requests.length})</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={handleManualRefresh}
        disabled={refreshing}
      >
        <Text style={styles.refreshButtonText}>
          {refreshing ? 'REFRESHING...' : '🔄 Refresh Data'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  selectorContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
  },
  map: {
    flex: 1,
  },
  hospitalMarker: {
    backgroundColor: 'white',
    padding: 2,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DC2626',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  // Callout styles for responded donors
  calloutContainer: {
    width: 250,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  calloutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calloutLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  calloutValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  calloutAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 8,
  },
  calloutDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  // Standard callout styles
  callout: {
    minWidth: 200,
    padding: 8,
  },
  calloutSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  calloutStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  calloutUrgency: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});


export default LiveMapScreen;
