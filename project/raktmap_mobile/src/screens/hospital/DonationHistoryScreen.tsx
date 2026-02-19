import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { api } from '../../config/api';

const DonationHistoryScreen = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'thisMonth' | 'thisYear'>('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/donation-history/donation-history');
      if (response.data.success) {
        setHistory(response.data.donationHistory || []);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Error fetching donation history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const filterHistory = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return history.filter((item) => {
      if (filter === 'all') return true;
      const donationDate = new Date(item.completedAt || item.createdAt);
      if (filter === 'thisMonth') {
        return (
          donationDate.getMonth() === currentMonth &&
          donationDate.getFullYear() === currentYear
        );
      }
      if (filter === 'thisYear') {
        return donationDate.getFullYear() === currentYear;
      }
      return true;
    });
  };

  const filteredHistory = filterHistory();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'thisMonth' && styles.filterButtonActive]}
          onPress={() => setFilter('thisMonth')}
        >
          <Text style={[styles.filterText, filter === 'thisMonth' && styles.filterTextActive]}>
            This Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'thisYear' && styles.filterButtonActive]}
          onPress={() => setFilter('thisYear')}
        >
          <Text style={[styles.filterText, filter === 'thisYear' && styles.filterTextActive]}>
            This Year
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          Total: {filteredHistory.length} donations
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📜</Text>
            <Text style={styles.emptyStateText}>No donation history</Text>
            <Text style={styles.emptyStateSubtext}>
              Donation records will appear here once donors complete their donations
            </Text>
          </View>
        ) : (
          filteredHistory.map((donation) => (
            <View key={donation._id} style={styles.donationCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.bloodGroupBadge, { backgroundColor: '#DC2626' }]}>
                  <Text style={styles.bloodGroupText}>{donation.donorBloodGroup || donation.bloodGroup}</Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(donation.completedAt || donation.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Donor:</Text>
                  <Text style={styles.infoValue}>{donation.donorName || 'N/A'}</Text>
                </View>
                {donation.donorPhone && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{donation.donorPhone}</Text>
                  </View>
                )}
                {donation.address && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Location:</Text>
                    <Text style={styles.infoValue}>{donation.address}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadgeSmall,
                    { backgroundColor: donation.status === 'completed' ? '#D1FAE5' : '#DBEAFE' }
                  ]}>
                    <Text style={[
                      styles.statusTextSmall,
                      { color: donation.status === 'completed' ? '#065F46' : '#1E40AF' }
                    ]}>
                      {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                    </Text>
                  </View>
                </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#DC2626',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  statsBar: {
    backgroundColor: '#DBEAFE',
    padding: 12,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  donationCard: {
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
  bloodGroupBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bloodGroupText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 80,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusTextSmall: {
    fontSize: 12,
    fontWeight: '600',
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

export default DonationHistoryScreen;
