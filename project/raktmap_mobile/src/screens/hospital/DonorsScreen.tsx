import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { api } from '../../config/api';

const DonorsScreen = () => {
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('all');

  const bloodGroups = ['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const response = await api.get('/donors');
      setDonors(response.data || []);
    } catch (error) {
      console.error('Error fetching donors:', error);
      Alert.alert('Error', 'Failed to load donors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDonors();
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const filteredDonors = donors.filter((donor) =>
    selectedBloodGroup === 'all' ? true : donor.bloodGroup === selectedBloodGroup
  );

  const availableDonors = filteredDonors.filter((donor) => donor.isAvailable);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#DC2626" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Blood Group Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {bloodGroups.map((group) => {
          // Calculate count for this group
          const count = donors.filter((d) =>
            group === 'all' ? true : d.bloodGroup === group
          ).length;

          return (
            <TouchableOpacity
              key={group}
              style={[
                styles.filterChip,
                selectedBloodGroup === group && styles.filterChipActive,
              ]}
              onPress={() => setSelectedBloodGroup(group)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedBloodGroup === group && styles.filterChipTextActive,
                ]}
              >
                {group === 'all' ? 'All' : group} {count > 0 && `(${count})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {availableDonors.length} of {filteredDonors.length} donors available
        </Text>
      </View>

      {/* Donor List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredDonors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👥</Text>
            <Text style={styles.emptyStateText}>No donors found</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedBloodGroup === 'all'

                ? 'No donors registered yet'
                : `No donors with blood group ${selectedBloodGroup}`}
            </Text>
          </View>
        ) : (
          filteredDonors.map((donor) => (
            <View key={donor._id} style={styles.donorCard}>
              <View style={styles.donorHeader}>
                <View>
                  <Text style={styles.donorName}>{donor.name}</Text>
                  <Text style={styles.donorId}>ID: {donor.uniqueId || donor._id}</Text>
                </View>
                <View style={[styles.bloodGroupBadge, { backgroundColor: '#DC2626' }]}>
                  <Text style={styles.bloodGroupText}>{donor.bloodGroup}</Text>
                </View>
              </View>

              <View style={styles.donorBody}>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: (donor.status === 'available' || donor.isAvailable) ? '#D1FAE5' : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: (donor.status === 'available' || donor.isAvailable) ? '#065F46' : '#991B1B',
                        },
                      ]}
                    >
                      {(donor.status === 'available' || donor.isAvailable) ? '✓ Available' : '✗ Unavailable'}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📧</Text>
                  <Text style={styles.infoText}>{donor.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📱</Text>
                  <Text style={styles.infoText}>{donor.phone}</Text>
                </View>
                {donor.address && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📍</Text>
                    <Text style={styles.infoText}>{donor.address}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>🩸</Text>
                  <Text style={styles.infoText}>{donor.totalDonations || 0} donations</Text>
                </View>
                {donor.lastDonationDate && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📅</Text>
                    <Text style={styles.infoText}>
                      Last: {new Date(donor.lastDonationDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.callButton]}
                  onPress={() => handleCall(donor.phone)}
                >
                  <Text style={styles.actionButtonText}>📞 Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.smsButton]}
                  onPress={() => handleSMS(donor.phone)}
                >
                  <Text style={styles.actionButtonText}>💬 SMS</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    backgroundColor: '#F9FAFB',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    // Set a maximum height to prevent it from growing too large
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 10, // Reduced vertical padding
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 4, // Reduced from 8 to make it smaller
    borderRadius: 16, // Adjusted for smaller height
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    height: 32, // Explicit small height
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipCount: {
    fontSize: 12,
    color: '#6B7280',
    opacity: 0.8,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  statsBar: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  statsText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  donorCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  donorHeader: {
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
    fontWeight: 'bold',
    color: '#111827',
  },
  donorId: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  bloodGroupBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bloodGroupText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  donorBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  statusRow: {
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  callButton: {
    backgroundColor: '#DBEAFE',
  },
  smsButton: {
    backgroundColor: '#D1FAE5',
    borderRightWidth: 0,
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

export default DonorsScreen;
