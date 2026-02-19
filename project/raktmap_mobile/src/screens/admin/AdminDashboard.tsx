import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../config/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalHospitals: 0,
    activeRequests: 0,
    totalDonations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [donorsRes, hospitalsRes, requestsRes, historyRes] = await Promise.all([
        api.get('/donors'),
        api.get('/hospitals'),
        api.get('/blood-requests'),
        api.get('/donation-history'),
      ]);

      setStats({
        totalDonors: donorsRes.data.length || 0,
        totalHospitals: hospitalsRes.data.length || 0,
        activeRequests:
          requestsRes.data.filter((r: any) => r.status === 'active').length || 0,
        totalDonations: historyRes.data.length || 0,
      });
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Admin Dashboard</Text>
          <Text style={styles.adminName}>{user?.name}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.statNumber}>{stats.totalDonors}</Text>
            <Text style={styles.statLabel}>Total Donors</Text>
            <Text style={styles.statIcon}>👥</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.statNumber}>{stats.totalHospitals}</Text>
            <Text style={styles.statLabel}>Hospitals</Text>
            <Text style={styles.statIcon}>🏥</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.statNumber}>{stats.activeRequests}</Text>
            <Text style={styles.statLabel}>Active Requests</Text>
            <Text style={styles.statIcon}>📋</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={styles.statNumber}>{stats.totalDonations}</Text>
            <Text style={styles.statLabel}>Total Donations</Text>
            <Text style={styles.statIcon}>✅</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>👤</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Donors</Text>
              <Text style={styles.actionSubtitle}>Add, edit, or remove donors</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🏥</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Hospitals</Text>
              <Text style={styles.actionSubtitle}>View and verify hospitals</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📊</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Analytics</Text>
              <Text style={styles.actionSubtitle}>System statistics and reports</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>System Settings</Text>
              <Text style={styles.actionSubtitle}>Configure app settings</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* System Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Database:</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>✓ Connected</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>SMS Service:</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>✓ Active</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Email Service:</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>✓ Active</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Last Updated:</Text>
              <Text style={styles.statusValue}>{new Date().toLocaleTimeString()}</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#DC2626',
    padding: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  adminName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  statsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginTop: 8,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 28,
    color: '#9CA3AF',
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    color: '#111827',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminDashboard;
