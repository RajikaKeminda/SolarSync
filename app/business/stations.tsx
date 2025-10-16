import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
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

import { apiService } from '../../services/api';
import { useAuthStore } from '../../store';
import { ChargingStation } from '../../types';
import { formatPrice } from '../../utils/helpers';

export default function StationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<ChargingStation[]>([]);

  const fetchStations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await apiService.getStationsByOwnerId(user.id);
      if (response.success && response.data) {
        setStations(response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch stations');
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      Alert.alert('Error', 'Failed to fetch stations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Refresh stations when screen comes into focus (e.g., after adding a new station)
  useFocusEffect(
    useCallback(() => {
      fetchStations();
    }, [fetchStations])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStations();
    setRefreshing(false);
  }, [fetchStations]);


  const handleAddStation = () => {
    router.push('/station/add');
  };

  const handleStationPress = (stationId: string) => {
    // TODO: Navigate to station details when route is implemented
    Alert.alert('Coming Soon', 'Station details view will be available in the next update');
  };

  const handleToggleStatus = async (stationId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const statusText = newStatus ? 'online' : 'offline';
    
    Alert.alert(
      'Change Station Status',
      `Set station ${statusText}?`,
      [
        { text: 'Cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              const response = await apiService.updateStation(stationId, { isActive: newStatus });
              if (response.success) {
                // Update local state
                setStations(prevStations => 
                  prevStations.map(station => 
                    station.id === stationId 
                      ? { ...station, isActive: newStatus }
                      : station
                  )
                );
                Alert.alert('Success', `Station set ${statusText} successfully`);
              } else {
                Alert.alert('Error', response.error || 'Failed to update station status');
              }
            } catch (error) {
              console.error('Error updating station status:', error);
              Alert.alert('Error', 'Failed to update station status. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#4CAF50' : '#9E9E9E';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Online' : 'Offline';
  };

  // Calculate statistics from real station data
  const calculateStats = () => {
    const totalStations = stations.length;
    const activeSessions = 0; // This would come from sessions API
    const todayRevenue = 0; // This would come from analytics API
    
    return {
      totalStations,
      activeSessions,
      todayRevenue
    };
  };

  const stats = calculateStats();

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
            <Text style={styles.summaryValue}>{stats.totalStations}</Text>
            <Text style={styles.summaryLabel}>Total Stations</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.activeSessions}</Text>
            <Text style={styles.summaryLabel}>Active Sessions</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {formatPrice(stats.todayRevenue)}
            </Text>
            <Text style={styles.summaryLabel}>Today&apos;s Revenue</Text>
          </View>
        </View>

        {/* Stations List */}
        <View style={styles.stationsContainer}>
          <Text style={styles.sectionTitle}>Station Management</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading stations...</Text>
            </View>
          ) : stations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No Stations Yet</Text>
              <Text style={styles.emptyText}>
                Add your first charging station to get started
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={handleAddStation}
              >
                <Text style={styles.emptyButtonText}>Add Station</Text>
              </TouchableOpacity>
            </View>
          ) : (
            stations.map((station) => (
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
                      { backgroundColor: getStatusColor(station.isActive) }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(station.isActive) }
                    ]}>
                      {getStatusText(station.isActive)}
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
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Active Sessions</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {formatPrice(0)}
                    </Text>
                    <Text style={styles.statLabel}>24h Revenue</Text>
                  </View>
                </View>

                <View style={styles.stationActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push(`/station/edit?id=${station.id}`)}
                  >
                    <Ionicons name="settings" size={16} color="#007AFF" />
                    <Text style={styles.actionButtonText}>Settings</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleToggleStatus(station.id, station.isActive)}
                  >
                    <Ionicons 
                      name={station.isActive ? 'pause' : 'play'} 
                      size={16} 
                      color={station.isActive ? '#FF9800' : '#4CAF50'} 
                    />
                    <Text style={[
                      styles.actionButtonText,
                      { color: station.isActive ? '#FF9800' : '#4CAF50' }
                    ]}>
                      {station.isActive ? 'Pause' : 'Resume'}
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
            ))
          )}
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
