import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPrice } from '../../utils/helpers';

export default function StationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch latest station data
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  // Mock station data
  const mockStations = [
    {
      id: '1',
      name: 'PowerStation Downtown',
      address: '123 Main St, Downtown',
      totalPorts: 8,
      availablePorts: 3,
      activeSessions: 5,
      status: 'online',
      revenue24h: 156.75,
      totalRevenue: 12456.90,
      portTypes: [
        { type: 'CCS2', count: 4, maxPower: 150 },
        { type: 'Type2', count: 4, maxPower: 22 }
      ]
    },
    {
      id: '2',
      name: 'GreenCharge Mall',
      address: '456 Shopping Center',
      totalPorts: 12,
      availablePorts: 8,
      activeSessions: 4,
      status: 'online',
      revenue24h: 203.40,
      totalRevenue: 8932.15,
      portTypes: [
        { type: 'CCS2', count: 6, maxPower: 150 },
        { type: 'CHAdeMO', count: 2, maxPower: 50 },
        { type: 'Type2', count: 4, maxPower: 22 }
      ]
    },
    {
      id: '3',
      name: 'FastCharge Highway',
      address: 'Highway 101, Exit 45',
      totalPorts: 6,
      availablePorts: 0,
      activeSessions: 0,
      status: 'maintenance',
      revenue24h: 0,
      totalRevenue: 15678.30,
      portTypes: [
        { type: 'CCS2', count: 4, maxPower: 350 },
        { type: 'CHAdeMO', count: 2, maxPower: 90 }
      ]
    }
  ];

  const handleAddStation = () => {
    router.push('/business/station/add');
  };

  const handleStationPress = (stationId: string) => {
    router.push(`/business/station/details?id=${stationId}`);
  };

  const handleToggleStatus = (stationId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    Alert.alert(
      'Change Station Status',
      `Set station ${newStatus}?`,
      [
        { text: 'Cancel' },
        { text: 'Confirm', onPress: () => console.log(`Station ${stationId} set to ${newStatus}`) }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'offline': return '#9E9E9E';
      case 'maintenance': return '#FF9800';
      default: return '#F44336';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'maintenance': return 'Maintenance';
      default: return 'Error';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Stations</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddStation}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{mockStations.length}</Text>
            <Text style={styles.summaryLabel}>Total Stations</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {mockStations.reduce((sum, station) => sum + station.activeSessions, 0)}
            </Text>
            <Text style={styles.summaryLabel}>Active Sessions</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {formatPrice(mockStations.reduce((sum, station) => sum + station.revenue24h, 0))}
            </Text>
            <Text style={styles.summaryLabel}>Today's Revenue</Text>
          </View>
        </View>

        {/* Stations List */}
        <View style={styles.stationsContainer}>
          <Text style={styles.sectionTitle}>Station Management</Text>
          
          {mockStations.map((station) => (
            <TouchableOpacity
              key={station.id}
              style={styles.stationCard}
              onPress={() => handleStationPress(station.id)}
            >
              <View style={styles.stationHeader}>
                <View style={styles.stationInfo}>
                  <Text style={styles.stationName}>{station.name}</Text>
                  <Text style={styles.stationAddress}>{station.address}</Text>
                </View>
                
                <View style={styles.stationStatus}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(station.status) }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(station.status) }
                  ]}>
                    {getStatusText(station.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.stationStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {station.availablePorts}/{station.totalPorts}
                  </Text>
                  <Text style={styles.statLabel}>Available Ports</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{station.activeSessions}</Text>
                  <Text style={styles.statLabel}>Active Sessions</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatPrice(station.revenue24h)}
                  </Text>
                  <Text style={styles.statLabel}>24h Revenue</Text>
                </View>
              </View>

              <View style={styles.stationActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push(`/business/station/edit?id=${station.id}`)}
                >
                  <Ionicons name="settings" size={16} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Settings</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleToggleStatus(station.id, station.status)}
                >
                  <Ionicons 
                    name={station.status === 'online' ? 'pause' : 'play'} 
                    size={16} 
                    color={station.status === 'online' ? '#FF9800' : '#4CAF50'} 
                  />
                  <Text style={[
                    styles.actionButtonText,
                    { color: station.status === 'online' ? '#FF9800' : '#4CAF50' }
                  ]}>
                    {station.status === 'online' ? 'Pause' : 'Resume'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Port Types */}
              <View style={styles.portTypes}>
                {station.portTypes.map((port, index) => (
                  <View key={index} style={styles.portType}>
                    <Text style={styles.portTypeText}>
                      {port.count}x {port.type} ({port.maxPower}kW)
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  stationsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  stationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: '#666',
  },
  stationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  stationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  stationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  portTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  portType: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  portTypeText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
});
