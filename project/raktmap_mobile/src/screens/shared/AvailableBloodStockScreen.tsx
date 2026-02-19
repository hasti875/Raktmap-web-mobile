import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
// @ts-ignore - Expo vector icons types
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { api } from '../../config/api';

interface Hospital {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  emergencyContact?: string;
}

interface Stock {
  bloodGroup: string;
  unitsAvailable: number;
}

interface HospitalStock {
  hospital: Hospital;
  stocks: Stock[];
}

const AvailableBloodStockScreen = () => {
  const [hospitals, setHospitals] = useState<HospitalStock[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<HospitalStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAvailableStock();
  }, []);

  useEffect(() => {
    filterHospitals();
  }, [searchQuery, hospitals]);

  const fetchAvailableStock = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blood-stock/all');
      if (response.data.success) {
        setHospitals(response.data.hospitals || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load blood stock');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterHospitals = () => {
    let filtered = [...hospitals];

    if (searchQuery) {
      filtered = filtered.filter(h =>
        h.hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.hospital.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredHospitals(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAvailableStock();
  };

  const handleCallHospital = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading blood availability...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Blood Availability</Text>

          {/* Tabs */}
          <View style={styles.tabs}>
            <View style={[styles.tab, styles.tabActive]}>
              <Text style={styles.tabActiveText}>Hospitals</Text>
            </View>
            <View style={styles.tabDisabled}>
              <Text style={styles.tabDisabledText}>Blood Banks</Text>
            </View>
          </View>

          {/* Search */}
          <TextInput
            placeholder="Search hospitals..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {filteredHospitals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="hospital-building" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Hospitals Found</Text>
              <Text style={styles.emptyText}>
                No hospitals have updated their blood stock yet.
              </Text>
            </View>
          ) : (
            filteredHospitals.map(item => (
              <View key={item.hospital._id} style={styles.card}>
                
                {/* Hospital Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hospitalName}>
                      {item.hospital.name}
                    </Text>
                    {item.hospital.address && (
                      <View style={styles.locationRow}>
                        <MaterialCommunityIcons name="map-marker" size={16} color="#6B7280" />
                        <Text style={styles.location}>
                          {item.hospital.address}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity style={styles.viewInfoBtn}>
                    <Text style={styles.viewInfoText}>View Info</Text>
                  </TouchableOpacity>
                </View>

                {/* Stock Label */}
                <Text style={styles.stockLabel}>Current Stock:</Text>

                {/* Stock Grid */}
                <View style={styles.stockGrid}>
                  {item.stocks.map(stock => (
                    <View key={stock.bloodGroup} style={styles.stockBox}>
                      <Text style={styles.bloodGroup}>
                        {stock.bloodGroup}
                      </Text>
                      <Text style={styles.units}>
                        {stock.unitsAvailable} Units
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Call Button */}
                {(item.hospital.phone || item.hospital.emergencyContact) && (
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() =>
                      handleCallHospital(
                        item.hospital.emergencyContact ||
                          item.hospital.phone ||
                          ''
                      )
                    }
                  >
                    <Ionicons name="call" size={18} color="#FFFFFF" style={styles.callIcon} />
                    <Text style={styles.callText}>Call Hospital</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default AvailableBloodStockScreen;

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#D1D5DB',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },

  tabActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },

  tabActiveText: {
    fontWeight: '600',
    color: '#DC2626',
  },

  tabDisabled: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabDisabledText: {
    color: '#6B7280',
    fontWeight: '600',
  },

  searchInput: {
    backgroundColor: '#D1D5DB',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },

  listContainer: {
    padding: 16,
  },

  emptyContainer: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 18,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
  },

  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  hospitalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },

  location: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },

  viewInfoBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },

  viewInfoText: {
    color: '#DC2626',
    fontWeight: '600',
  },

  stockLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },

  stockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  stockBox: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  bloodGroup: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },

  units: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },

  callBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'center',
  },

  callIcon: {
    marginRight: 8,
  },

  callText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
