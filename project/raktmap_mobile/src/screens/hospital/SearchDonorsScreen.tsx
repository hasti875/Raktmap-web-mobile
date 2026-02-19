import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { api } from '../../config/api';

interface Donor {
  id?: string;
  _id: string; // From /donors endpoint
  name: string;
  email: string;
  phone: string;
  bloodGroup: string;
  status?: string;
  isAvailable: boolean;
  totalDonations: number;
  uniqueId?: string;
  location?: {
    coordinates: [number, number];
  };
}

const SearchDonorsScreen = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchDonors();
  }, []);

  useEffect(() => {
    filterDonors();
  }, [searchQuery, selectedBloodGroup, donors]);

  const fetchDonors = async () => {
    try {
      const response = await api.get('/donors');
      setDonors(response.data || []);
    } catch (error) {
      console.error('Error fetching donors:', error);
      Alert.alert('Error', 'Failed to load donors');
    } finally {
      setLoading(false);
    }
  };

  const filterDonors = () => {
    let filtered = donors;

    // Filter by blood group
    if (selectedBloodGroup) {
      filtered = filtered.filter((d) => d.bloodGroup === selectedBloodGroup);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.email.toLowerCase().includes(query) ||
          d.phone.includes(query) ||
          d.bloodGroup.toLowerCase().includes(query)
      );
    }

    setFilteredDonors(filtered);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Blood Group Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            !selectedBloodGroup && styles.filterChipActive,
          ]}
          onPress={() => setSelectedBloodGroup('')}
        >
          <Text
            style={[
              styles.filterChipText,
              !selectedBloodGroup && styles.filterChipTextActive,
            ]}
          >
            All ({donors.length})
          </Text>
        </TouchableOpacity>
        {bloodGroups.map((group) => {
          const count = donors.filter((d) => d.bloodGroup === group).length;
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
                {group} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          Found {filteredDonors.length} donor{filteredDonors.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Donor List */}
      <ScrollView style={styles.scrollView}>
        {filteredDonors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateText}>No donors found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filter criteria
            </Text>
          </View>
        ) : (
          filteredDonors.map((donor) => (
            <View key={donor._id} style={styles.donorCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.donorName}>{donor.name}</Text>
                  <View style={[styles.bloodGroupBadge, { backgroundColor: '#DC2626' }]}>
                    <Text style={styles.bloodGroupText}>{donor.bloodGroup}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.availabilityBadge,
                    (donor.status === 'available' || donor.isAvailable)
                      ? styles.availableBadge
                      : styles.unavailableBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.availabilityText,
                      (donor.status === 'available' || donor.isAvailable)
                        ? styles.availableText
                        : styles.unavailableText,
                    ]}
                  >
                    {(donor.status === 'available' || donor.isAvailable) ? '✓ Available' : '✗ Unavailable'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📧</Text>
                  <Text style={styles.infoText}>{donor.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📱</Text>
                  <Text style={styles.infoText}>{donor.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>🩸</Text>
                  <Text style={styles.infoText}>
                    {donor.totalDonations || 0} donations
                  </Text>
                </View>
              </View>

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
                <TouchableOpacity
                  style={[styles.actionButton, styles.emailButton]}
                  onPress={() => handleEmail(donor.email)}
                >
                  <Text style={styles.actionButtonText}>✉️ Email</Text>
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
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
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
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultsBar: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 6, // Reduced from 12 to bring the list up
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
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
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  availableBadge: {
    backgroundColor: '#D1FAE5',
  },
  unavailableBadge: {
    backgroundColor: '#FEE2E2',
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  availableText: {
    color: '#065F46',
  },
  unavailableText: {
    color: '#991B1B',
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
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  callButton: {
    backgroundColor: '#DBEAFE',
  },
  smsButton: {
    backgroundColor: '#D1FAE5',
  },
  emailButton: {
    backgroundColor: '#F3F4F6',
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

export default SearchDonorsScreen;
