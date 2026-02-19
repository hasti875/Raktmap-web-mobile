import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../../config/api';

const MyRequestsScreen = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'fulfilled' | 'cancelled'>('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/blood-requests/hospital');
      // Filter to show only this hospital's requests
      setRequests(response.data.bloodRequests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load blood requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return '#EF4444';
      case 'urgent':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#3B82F6';
      case 'fulfilled':
        return '#10B981';
      case 'cancelled':
        return '#6B7280';
      case 'expired':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const filteredRequests = requests.filter((req) =>
    filter === 'all' ? true : req.status === filter
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({requests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Active ({requests.filter(r => r.status === 'active').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'fulfilled' && styles.filterTabActive]}
          onPress={() => setFilter('fulfilled')}
        >
          <Text style={[styles.filterText, filter === 'fulfilled' && styles.filterTextActive]}>
            Fulfilled ({requests.filter(r => r.status === 'fulfilled').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateText}>No requests found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'all'
                ? 'Create your first blood request to get started'
                : `No ${filter} requests at the moment`}
            </Text>
          </View>
        ) : (
          filteredRequests.map((request) => (
            <View key={request._id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.bloodGroupBadge}>
                  <Text style={styles.bloodGroupText}>{request.bloodGroup}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(request.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(request.status) },
                    ]}
                  >
                    {request.status?.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.requestBody}>
                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>Request ID:</Text>
                  <Text style={styles.requestValue}>{request._id}</Text>
                </View>
                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>Age:</Text>
                  <Text style={styles.requestValue}>{request.patientAge || 'N/A'}</Text>
                </View>
                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>Units:</Text>
                  <Text style={styles.requestValue}>
                    {request.quantity}
                  </Text>
                </View>
                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>Urgency:</Text>
                  <View
                    style={[
                      styles.urgencyBadge,
                      {
                        backgroundColor:
                          getUrgencyColor(request.urgency) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.urgencyText,
                        { color: getUrgencyColor(request.urgency) },
                      ]}
                    >
                      {request.urgency?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>Contact:</Text>
                  <Text style={styles.requestValue}>{request.contactNumber || 'N/A'}</Text>
                </View>
                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>Required By:</Text>
                  <Text style={styles.requestValue}>
                    {request.requiredBy
                      ? new Date(request.requiredBy).toLocaleDateString()
                      : 'N/A'}
                  </Text>
                </View>
                {request.additionalNotes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.requestLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{request.additionalNotes}</Text>
                  </View>
                )}
              </View>

              <View style={styles.requestFooter}>
                <Text style={styles.requestDate}>
                  Created: {new Date(request.createdAt).toLocaleString()}
                </Text>
                {request.notifiedDonors && (
                  <Text style={styles.notifiedCount}>
                    📬 {request.notifiedDonors.length} donors notified
                  </Text>
                )}
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#DC2626',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#DC2626',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  requestCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
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
    fontSize: 18,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 12,
  },
  requestBody: {
    padding: 16,
  },
  requestRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  requestLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 100,
    fontWeight: '500',
  },
  requestValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgencyText: {
    fontWeight: '600',
    fontSize: 11,
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
    lineHeight: 20,
  },
  requestFooter: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  requestDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  notifiedCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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

export default MyRequestsScreen;
