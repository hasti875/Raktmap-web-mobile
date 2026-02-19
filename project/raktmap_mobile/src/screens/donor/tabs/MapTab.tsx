import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, SafeAreaView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { api } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

const MapTab = () => {
    const { user } = useAuth();
    const [region, setRegion] = useState({
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    });
    const [donors, setDonors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            
            // Get user's current location
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    setRegion({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    });
                }
            } catch (locError) {
                console.log('Location permission denied or error:', locError);
            }

            // Fetch donors with locations
            const response = await api.get('/donors');
            const donorsWithLoc = response.data.filter((d: any) => d.latitude && d.longitude);
            setDonors(donorsWithLoc);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#DC2626" />
                <Text style={styles.loadingText}>Loading donors...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📍 Nearby Donors</Text>
                <View style={styles.donorBadge}>
                    <Text style={styles.donorCount}>{donors.length} donors</Text>
                </View>
            </View>

            {/* Full Screen Map */}
            <MapView
                style={styles.map}
                region={region}
                showsUserLocation
                showsMyLocationButton
            >
                {donors.map((donor) => (
                    <Marker
                        key={`donor-${donor._id}`}
                        coordinate={{
                            latitude: donor.latitude,
                            longitude: donor.longitude
                        }}
                        anchor={{ x: 0.5, y: 1 }}
                        title={donor._id === user?._id ? 'Me (You)' : donor.name}
                        description={`${donor.bloodGroup} • Available for donation`}
                    >
                        <View style={styles.markerContainer}>
                            <View style={styles.bloodDrop}>
                                <Text style={styles.bloodGroupText}>{donor.bloodGroup}</Text>
                            </View>
                        </View>
                    </Marker>
                ))}
            </MapView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    donorBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    donorCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#15803D',
    },
    map: {
        flex: 1,
        width: '100%',
    },
    markerContainer: {
        alignItems: 'center',
    },
    bloodDrop: {
        width: 40,
        height: 40,
        backgroundColor: '#22C55E',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    bloodGroupText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default MapTab;
