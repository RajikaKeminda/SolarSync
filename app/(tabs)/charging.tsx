import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuthStore, useChargingStore } from '../../store';
import { ChargingSession, Reservation } from '../../types';
import { formatDateTime, formatEnergy, formatPrice, formatTime } from '../../utils/helpers';

export default function ChargingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuthStore();
  const { 
    activeSessions, 
    chargingHistory, 
    upcomingReservations, 
    updateChargingSession,
    setActiveSessions,
    setChargingHistory,
    addReservation,
    cancelReservation
  } = useChargingStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'reservations'>('active');

  // Fetch charging data from API
  const fetchChargingData = useCallback(async () => {
    if (!token || !user) return;
    
    try {
      setLoading(true);
      apiService.setToken(token);
      
      // Fetch active sessions
      const activeResponse = await apiService.getActiveSession();
      if (activeResponse.success && activeResponse.data) {
        setActiveSessions(activeResponse.data);
      }
      
      // Fetch charging history
      const historyResponse = await apiService.getChargingSessions();
      if (historyResponse.success && historyResponse.data) {
        // Filter completed sessions for history
        const completedSessions = historyResponse.data.filter(
          session => session.status === 'completed' || session.status === 'cancelled'
        );
        setChargingHistory(completedSessions);
      }
      
      // Fetch reservations
      const reservationsResponse = await apiService.getReservations();
      if (reservationsResponse.success && reservationsResponse.data) {
        // Filter upcoming reservations
        const upcoming = reservationsResponse.data.filter(
          reservation => reservation.status === 'confirmed' && 
          new Date(reservation.scheduledStartTime) > new Date()
        );
        // Update local store with upcoming reservations
        upcoming.forEach(reservation => addReservation(reservation));
      }
      
    } catch (error) {
      console.error('Error fetching charging data:', error);
      Alert.alert('Error', 'Failed to load charging data');
    } finally {
      setLoading(false);
    }
  }, [token, user, setActiveSessions, setChargingHistory, addReservation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChargingData();
    setRefreshing(false);
  }, [fetchChargingData]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchChargingData();
    }, [fetchChargingData])
  );

  const handleStopCharging = async (sessionId: string) => {
    Alert.alert(
      'Stop Charging',
      'Are you sure you want to stop the current charging session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.stopChargingSession(sessionId);
              
              if (response.success && response.data) {
                // Update local store
                updateChargingSession(sessionId, {
                  status: 'completed',
                  endTime: new Date(),
                  energyDelivered: response.data.energyDelivered,
                  cost: response.data.cost
                });
                
                Alert.alert(
                  'Charging Stopped',
                  `Session completed. Total cost: ${formatPrice(response.data.cost)}`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', response.error || 'Failed to stop charging session');
              }
            } catch (error) {
              console.error('Error stopping session:', error);
              Alert.alert('Error', 'Failed to stop charging session');
            }
          },
        },
      ]
    );
  };

  const handleCancelReservation = async (reservationId: string) => {
    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this reservation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.cancelReservation(reservationId);
              
              if (response.success) {
                // Update local store
                cancelReservation(reservationId);
                Alert.alert('Reservation Cancelled', 'Your reservation has been cancelled.');
              } else {
                Alert.alert('Error', response.error || 'Failed to cancel reservation');
              }
            } catch (error) {
              console.error('Error cancelling reservation:', error);
              Alert.alert('Error', 'Failed to cancel reservation');
            }
          },
        },
      ]
    );
  };

  const renderActiveSession = (session: ChargingSession) => {
    const stationName = typeof session.stationId === 'object' ? session.stationId.name : 'Charging Station';
    const duration = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000 / 60);
    
    return (
      <View key={session.id} style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.statusContainer}>
            <View style={styles.activeStatusDot} />
            <Text style={styles.sessionStatus}>Charging</Text>
          </View>
          <Text style={styles.sessionTime}>
            Started {formatTime(new Date(session.startTime))}
          </Text>
        </View>
        
        <Text style={styles.stationName}>{stationName}</Text>
        <Text style={styles.portInfo}>CCS2 - 150 kW</Text>
        
        <View style={styles.sessionProgress}>
          <View style={styles.progressItem}>
            <Text style={styles.progressValue}>
              {formatEnergy(session.energyDelivered)}
            </Text>
            <Text style={styles.progressLabel}>Energy Delivered</Text>
          </View>
          
          <View style={styles.progressItem}>
            <Text style={styles.progressValue}>
              {formatPrice(session.cost)}
            </Text>
            <Text style={styles.progressLabel}>Cost</Text>
          </View>
          
          <View style={styles.progressItem}>
            <Text style={styles.progressValue}>
              {duration}m
            </Text>
            <Text style={styles.progressLabel}>Duration</Text>
          </View>
        </View>
        
        <View style={styles.sessionActions}>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => router.push(`/charging/session?sessionId=${session.id}`)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.stopChargingButton}
            onPress={() => handleStopCharging(session.id)}
          >
            <Text style={styles.stopChargingText}>Stop Charging</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHistoryItem = (session: ChargingSession) => {
    const stationName = typeof session.stationId === 'object' ? session.stationId.name : 'Charging Station';
    const duration = session.endTime ? 
      Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000) : 0;
    
    return (
      <View key={session.id} style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyDate}>
            {formatDateTime(new Date(session.startTime))}
          </Text>
          <View style={[
            styles.statusBadge,
            session.status === 'completed' ? styles.completedBadge : styles.cancelledBadge
          ]}>
            <Text style={styles.statusBadgeText}>
              {session.status === 'completed' ? 'Completed' : 'Cancelled'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.historyStation}>{stationName}</Text>
        
        <View style={styles.historyStats}>
          <View style={styles.historyStat}>
            <Text style={styles.historyStatValue}>
              {formatEnergy(session.energyDelivered)}
            </Text>
            <Text style={styles.historyStatLabel}>Energy</Text>
          </View>
          
          <View style={styles.historyStat}>
            <Text style={styles.historyStatValue}>
              {formatPrice(session.cost)}
            </Text>
            <Text style={styles.historyStatLabel}>Cost</Text>
          </View>
          
          <View style={styles.historyStat}>
            <Text style={styles.historyStatValue}>
              {duration > 0 ? `${duration}m` : '-'}
            </Text>
            <Text style={styles.historyStatLabel}>Duration</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderReservation = (reservation: Reservation) => (
    <View key={reservation.id} style={styles.reservationCard}>
      <View style={styles.reservationHeader}>
        <Text style={styles.reservationDate}>
          {formatDateTime(new Date(reservation.scheduledStartTime))}
        </Text>
        <View style={[
          styles.statusBadge,
          reservation.status === 'confirmed' ? styles.confirmedBadge : styles.cancelledBadge
        ]}>
          <Text style={styles.statusBadgeText}>
            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.reservationStation}>Charging Station</Text>
      <Text style={styles.reservationDuration}>
        Duration: {reservation.estimatedDuration} minutes
      </Text>
      
      {reservation.status === 'confirmed' && (
        <View style={styles.reservationActions}>
          <TouchableOpacity 
            style={styles.modifyButton}
            onPress={() => router.push('/station/book')}
          >
            <Text style={styles.modifyButtonText}>Modify</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelReservation(reservation.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Charging</Text>
        <TouchableOpacity onPress={() => router.push('/explore')}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active ({activeSessions.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reservations' && styles.activeTab]}
          onPress={() => setActiveTab('reservations')}
        >
          <Text style={[styles.tabText, activeTab === 'reservations' && styles.activeTabText]}>
            Reservations
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading charging data...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'active' && (
              <View style={styles.tabContent}>
                {activeSessions.length > 0 ? (
                  activeSessions.map(renderActiveSession)
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="flash-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>No Active Sessions</Text>
                    <Text style={styles.emptyText}>
                      Find a charging station to start your first session
                    </Text>
                    <TouchableOpacity 
                      style={styles.findStationButton}
                      onPress={() => router.push('/explore')}
                    >
                      <Text style={styles.findStationText}>Find Stations</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'history' && (
              <View style={styles.tabContent}>
                {chargingHistory.length > 0 ? (
                  chargingHistory.map(renderHistoryItem)
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>No Charging History</Text>
                    <Text style={styles.emptyText}>
                      Your completed charging sessions will appear here
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'reservations' && (
              <View style={styles.tabContent}>
                {upcomingReservations.length > 0 ? (
                  upcomingReservations.map(renderReservation)
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>No Reservations</Text>
                    <Text style={styles.emptyText}>
                      Book a charging station to see your reservations here
                    </Text>
                    <TouchableOpacity 
                      style={styles.findStationButton}
                      onPress={() => router.push('/explore')}
                    >
                      <Text style={styles.findStationText}>Find Stations</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        )}
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  sessionCard: {
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
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeStatusDot: {
    width: 8,
    height: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    marginRight: 8,
  },
  sessionStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  sessionTime: {
    fontSize: 12,
    color: '#666',
  },
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  portInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  sessionProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  viewDetailsText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  stopChargingButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopChargingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#E8F5E8',
  },
  cancelledBadge: {
    backgroundColor: '#FFEBEE',
  },
  confirmedBadge: {
    backgroundColor: '#E3F2FD',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyStation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyStat: {
    alignItems: 'center',
  },
  historyStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  historyStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  reservationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reservationDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reservationStation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reservationDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  reservationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modifyButton: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modifyButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  findStationButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  findStationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});
