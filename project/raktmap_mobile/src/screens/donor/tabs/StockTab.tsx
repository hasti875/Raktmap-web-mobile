import React from 'react';
import { View, StyleSheet } from 'react-native';
import AvailableBloodStockScreen from '../../shared/AvailableBloodStockScreen';

const StockTab = () => {
  return (
    <AvailableBloodStockScreen bottomOffset={30} />
      
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default StockTab;

