import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { api } from '../../config/api';

interface BloodRequest {
  _id: string;
  bloodGroup: string;
  quantity: number;
  urgency: string;
  status: string;
  createdAt: string;
}

interface Donor {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: string;
  status: string;
  hasLocationData: boolean;
  distance?: number;
  address?: string;
  rollNo?: string;
  totalDonations?: number;
  responseTime?: string;
}

const AvailableDonorsScreen = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setLoading(true);
    await Promise.all([fetchDonors(), fetchBloodRequests()]);
    setLoading(false);
  };

  const fetchBloodRequests = async () => {
    try {
      const response = await api.get('/blood-requests/hospital');
      if (response.data.success) {
        setBloodRequests(response.data.bloodRequests || []);
      }
    } catch (error) {
      console.error('Error fetching blood requests:', error);
    }
  };

  const fetchDonors = async () => {
    try {
      setError(null);
      const response = await api.get('/donor-response/available-donors');

      if (response.data.success) {
        setDonors(response.data.donors || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch donors');
      }
    } catch (error: any) {
      console.error('Error fetching donors:', error);
      Alert.alert('Error', error.message || 'Failed to load available donors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDonors();
  };

  const [error, setError] = useState<string | null>(null);

  const getCompatibleBloodGroups = (group: string): string[] => {
    const compatibility: { [key: string]: string[] } = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['A-', 'B-', 'AB-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-']
    };
    return compatibility[group] || [];
  };

  const getFilteredDonors = () => {
    let filtered = donors;

    // Blood group filter
    if (selectedBloodGroup) {
      filtered = filtered.filter((d) => d.bloodGroup === selectedBloodGroup);
    }

    // Blood request filter logic (same as website)
    if (selectedRequest !== 'all') {
      const activeRequest = bloodRequests.find(r => r._id === selectedRequest);
      if (activeRequest) {
        const compatibleGroups = getCompatibleBloodGroups(activeRequest.bloodGroup);
        filtered = filtered.filter(d =>
          d.hasLocationData && compatibleGroups.includes(d.bloodGroup.replace(/\s+/g, ''))
        );
      }
    }

    return filtered;
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const filteredDonors = getFilteredDonors();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Blood Request Filter (Horizontal List) */}
      {bloodRequests.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filter by Request</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ _id: 'all', bloodGroup: 'All Donors' }, ...bloodRequests]}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedRequest === item._id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedRequest(item._id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedRequest === item._id && styles.filterChipTextActive,
                  ]}
                >
                  {item._id === 'all' ? 'All Donors' : `${item.bloodGroup} (${new Date((item as BloodRequest).createdAt).toLocaleDateString()})`}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.filterList}
            style={styles.filterContainer}
          />
        </View>
      )}

      {/* Blood Group Filter */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Available Donors ({filteredDonors.length})
        </Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ label: 'All', value: '' }, ...bloodGroups.map((g) => ({ label: g, value: g }))]}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => {
            const count = item.value
              ? donors.filter((d) => d.bloodGroup === item.value).length
              : donors.length;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedBloodGroup === item.value && styles.filterChipActive,
                ]}
                onPress={() => setSelectedBloodGroup(item.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedBloodGroup === item.value && styles.filterChipTextActive,
                  ]}
                >
                  {item.label} {count > 0 && `(${count})`}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.filterList}
          style={styles.filterContainer}
        />
      </View>

      {/* Donor List */}
      <FlatList
        data={filteredDonors}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <View style={styles.donorCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.donorName}>{item.name}</Text>
                <View style={[styles.bloodGroupBadge, { backgroundColor: '#DC2626' }]}>
                  <Text style={styles.bloodGroupText}>{item.bloodGroup}</Text>
                </View>
              </View>
              <View style={[
                styles.availableBadge,
                { backgroundColor: item.hasLocationData ? '#D1FAE5' : '#F3F4F6' }
              ]}>
                <Text style={[
                  styles.availableText,
                  { color: item.hasLocationData ? '#065F46' : '#6B7280' }
                ]}>
                  {item.hasLocationData ? '✓ Responded' : 'Not Contacted'}
                </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              {item.distance !== undefined && item.distance !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📍</Text>
                  <Text style={styles.infoText}>
                    {item.distance.toFixed(1)} km away
                  </Text>
                </View>
              )}
              {item.rollNo && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>🆔</Text>
                  <Text style={styles.infoText}>{item.rollNo}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📱</Text>
                <Text style={styles.infoText}>{item.phone}</Text>
              </View>
              {item.address && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>🏠</Text>
                  <Text style={styles.infoText}>{item.address}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.callButton]}
                onPress={() => handleCall(item.phone)}
              >
                <Text style={styles.actionButtonText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.smsButton]}
                onPress={() => handleSMS(item.phone)}
              >
                <Text style={styles.actionButtonText}>💬 SMS</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateText}>No available donors</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedBloodGroup
                ? `No available donors with blood group ${selectedBloodGroup}`
                : 'There are no available donors at the moment'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterList: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#DC2626',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  donorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  donorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  bloodGroupBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  bloodGroupText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  availableBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  availableText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButton: {
    backgroundColor: '#DBEAFE',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  smsButton: {
    backgroundColor: '#D1FAE5',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    marginTop: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default AvailableDonorsScreen;
