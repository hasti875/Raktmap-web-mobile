import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore - Expo vector icons types
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../config/api';

interface DashboardStats {
  activeRequests: number;
  totalDonors: number;
  completedThisMonth: number;
}

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeRequests: 0,
    totalDonors: 0,
    completedThisMonth: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [requestsRes, donorsRes, historyRes] = await Promise.all([
        api.get('/blood-requests/hospital'),
        api.get('/donors'),
        api.get('/donation-history/donation-history'),
      ]);

      const requests = requestsRes.data.bloodRequests || [];
      const activeRequests = requests.filter(
        (req: any) => req.status === 'active' || req.status === 'pending'
      ).length;

      setStats({
        activeRequests,
        totalDonors: donorsRes.data.length || 0,
        completedThisMonth: historyRes.data.length || 0,
      });

      setRecentRequests(requests.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.hospitalName}>{user?.name}!</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="water" size={32} color="#DC2626" style={styles.statIconTop} />
          <Text style={styles.statNumber}>{stats.activeRequests}</Text>
          <Text style={styles.statLabel}>Active Requests</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
          <Ionicons name="people" size={32} color="#2563EB" style={styles.statIconTop} />
          <Text style={styles.statNumber}>{stats.totalDonors}</Text>
          <Text style={styles.statLabel}>Available Donors</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <MaterialCommunityIcons name="check-circle" size={32} color="#10B981" style={styles.statIconTop} />
          <Text style={styles.statNumber}>{stats.completedThisMonth}</Text>
          <Text style={styles.statLabel}>Donations</Text>
        </View>
      </View>

      {/* Recent Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Blood Requests</Text>
        {recentRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#9CA3AF" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyStateText}>No active requests</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first blood request to get started
            </Text>
          </View>
        ) : (
          recentRequests.map((request) => (
            <View key={request._id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.bloodGroupBadge}>
                  <Text style={styles.bloodGroupText}>{request.bloodGroup}</Text>
                </View>
                <View
                  style={[
                    styles.urgencyBadge,
                    { backgroundColor: getUrgencyColor(request.urgency) + '20' },
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
              <Text style={styles.requestPatient}>
                Request ID: {request._id}
              </Text>
              <Text style={styles.requestUnits}>
                Units Required: {request.quantity}
              </Text>
              <Text style={styles.requestDate}>
                Created: {new Date(request.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#df5f5f' }]}
          onPress={() => navigation.navigate('CreateRequest')}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="add-circle" size={24} color="#fff" />
          </View>
          <Text style={[styles.actionText, { color: '#fff' }]}>Create Blood Request</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#5482e4' }]}
          onPress={() => navigation.navigate('Scanner')}
        >
          <View style={styles.actionIconContainer}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#fff" />
          </View>
          <Text style={[styles.actionText, { color: '#fff' }]}>Scan QR Code</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  welcomeSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  hospitalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconTop: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    fontSize: 16,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  urgencyText: {
    fontWeight: '600',
    fontSize: 12,
  },
  requestPatient: {
    fontSize: 14,
    color: '#111827',
    marginTop: 4,
  },
  requestUnits: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  requestDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  actionIconContainer: {
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});

export default HomeScreen;
