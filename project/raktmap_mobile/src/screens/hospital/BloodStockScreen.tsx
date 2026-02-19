import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { api } from '../../config/api';

interface BloodStock {
  _id?: string;
  bloodGroup: string;
  unitsAvailable: number;
  status: string;
  lastUpdated: string | null;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return '#10B981';
    case 'low':
      return '#F59E0B';
    case 'critical':
      return '#F97316';
    case 'out_of_stock':
      return '#EF4444';
    default:
      return '#6B7280';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'out_of_stock':
      return 'Out of Stock';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const BloodStockScreen = () => {
  const [stocks, setStocks] = useState<BloodStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingIndividual, setSavingIndividual] = useState<{ [key: string]: boolean }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blood-stock/my-stock');

      if (response.data.success) {
        const stockData = response.data.stocks || [];
        
        // Ensure all blood groups are represented
        const fullStockData = BLOOD_GROUPS.map(bg => {
          const existing = stockData.find((s: BloodStock) => s.bloodGroup === bg);
          return existing || {
            bloodGroup: bg,
            unitsAvailable: 0,
            status: 'out_of_stock',
            lastUpdated: null
          };
        });
        
        setStocks(fullStockData);
        
        // Initialize edit values
        const initialValues: { [key: string]: string } = {};
        fullStockData.forEach((stock: BloodStock) => {
          initialValues[stock.bloodGroup] = stock.unitsAvailable.toString();
        });
        setEditValues(initialValues);
      }
    } catch (error: any) {
      console.error('Error fetching stock:', error);
      Alert.alert('Error', 'Failed to load blood stock data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStockData();
  };

  const handleValueChange = (bloodGroup: string, value: string) => {
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setEditValues({ ...editValues, [bloodGroup]: value });
    }
  };

  const handleSaveIndividual = async (bloodGroup: string) => {
    try {
      setSavingIndividual({ ...savingIndividual, [bloodGroup]: true });
      
      const response = await api.post('/blood-stock/update', {
        bloodGroup,
        unitsAvailable: parseInt(editValues[bloodGroup]) || 0
      });

      if (response.data.success) {
        Alert.alert('Success', `${bloodGroup} stock updated successfully`);
        await fetchStockData();
      }
    } catch (error: any) {
      console.error('Error updating stock:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update stock');
    } finally {
      setSavingIndividual({ ...savingIndividual, [bloodGroup]: false });
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      
      const stocksToUpdate = BLOOD_GROUPS.map(bg => ({
        bloodGroup: bg,
        unitsAvailable: parseInt(editValues[bg]) || 0
      }));

      const response = await api.post('/blood-stock/bulk-update', {
        stocks: stocksToUpdate
      });

      if (response.data.success) {
        Alert.alert('Success', 'All blood stocks updated successfully');
        await fetchStockData();
      }
    } catch (error: any) {
      console.error('Error updating stocks:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update stocks');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading stock data...</Text>
      </View>
    );
  }

  const statusCounts = {
    available: stocks.filter(s => s.status === 'available').length,
    low: stocks.filter(s => s.status === 'low').length,
    critical: stocks.filter(s => s.status === 'critical').length,
    out_of_stock: stocks.filter(s => s.status === 'out_of_stock').length,
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Info */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Blood Stock Management</Text>
          <Text style={styles.headerSubtitle}>
            Update your hospital's blood inventory daily
          </Text>
        </View>

        {/* Status Overview */}
        <View style={styles.statusGrid}>
          <View style={[styles.statusCard, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.statusValue, { color: '#10B981' }]}>
              {statusCounts.available}
            </Text>
            <Text style={styles.statusLabel}>Available</Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statusValue, { color: '#F59E0B' }]}>
              {statusCounts.low}
            </Text>
            <Text style={styles.statusLabel}>Low</Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: '#FFEDD5' }]}>
            <Text style={[styles.statusValue, { color: '#F97316' }]}>
              {statusCounts.critical}
            </Text>
            <Text style={styles.statusLabel}>Critical</Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.statusValue, { color: '#EF4444' }]}>
              {statusCounts.out_of_stock}
            </Text>
            <Text style={styles.statusLabel}>Out</Text>
          </View>
        </View>

        {/* Stock List */}
        <View style={styles.stockList}>
          <Text style={styles.sectionTitle}>Blood Group Stock Levels</Text>
          {stocks.map((stock) => (
            <View key={stock.bloodGroup} style={styles.stockCard}>
              <View style={styles.stockHeader}>
                <Text style={styles.bloodGroupText}>{stock.bloodGroup}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(stock.status) + '20' }
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: getStatusColor(stock.status) }
                    ]}
                  >
                    {getStatusText(stock.status)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.stockInputRow}>
                <View style={styles.stockInputContainer}>
                  <Text style={styles.inputLabel}>Units Available:</Text>
                  <TextInput
                    style={styles.stockInput}
                    value={editValues[stock.bloodGroup]}
                    onChangeText={(value) => handleValueChange(stock.bloodGroup, value)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.saveIndividualButton, savingIndividual[stock.bloodGroup] && styles.saveButtonDisabled]}
                  onPress={() => handleSaveIndividual(stock.bloodGroup)}
                  disabled={savingIndividual[stock.bloodGroup]}
                >
                  {savingIndividual[stock.bloodGroup] ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveIndividualButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              {stock.lastUpdated && (
                <Text style={styles.lastUpdatedText}>
                  Last updated: {new Date(stock.lastUpdated).toLocaleDateString()} {new Date(stock.lastUpdated).toLocaleTimeString()}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Info Cards */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📊 Stock Status Guide</Text>
            <Text style={styles.infoText}>• Available: More than 10 units</Text>
            <Text style={styles.infoText}>• Low: 6-10 units</Text>
            <Text style={styles.infoText}>• Critical: 1-5 units</Text>
            <Text style={styles.infoText}>• Out of Stock: 0 units</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Best Practices</Text>
            <Text style={styles.infoText}>• Update stock daily in the morning</Text>
            <Text style={styles.infoText}>• Maintain minimum 10 units</Text>
            <Text style={styles.infoText}>• Notify when critically low</Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveAll}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save All Changes</Text>
          )}
        </TouchableOpacity>
      </View>
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
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusGrid: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  statusCard: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  stockList: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  stockCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bloodGroupText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  stockInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 10,
    flex: 1,
  },
  stockInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    width: 100,
    textAlign: 'center',
  },
  saveIndividualButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveIndividualButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  infoContainer: {
    paddingHorizontal: 15,
    marginBottom: 100,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    marginBottom: 4,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#DC2626',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BloodStockScreen;
