import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiService } from '../../services/api';
import { realTimeService } from '../../services/realTimeService';
import { useAuthStore, useChargingStore, useVehicleStore } from '../../store';
import { ChargingSession, Reservation } from '../../types';
import { calculateEstimatedRange, getBatteryColor } from '../../utils/helpers';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { vehicles, selectedVehicle, setVehicles, setSelectedVehicle } = useVehicleStore();
  const { setActiveSessions } = useChargingStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ChargingSession | null>(null);
  const [upcomingReservations, setLocalUpcomingReservations] = useState<Reservation[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);

  // Fetch all data from APIs
  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch dashboard data
      const dashboardResponse = await apiService.getDashboardData(user.id);
      if (dashboardResponse.success && dashboardResponse.data) {
        const dashboardData = dashboardResponse.data;
        
        // Set vehicles
        if (dashboardData.vehicles) {
          setVehicles(dashboardData.vehicles);
          setSelectedVehicle(dashboardData.selectedVehicle || null);
        }

        // Set active sessions
        if (dashboardData.activeSessions) {
          if (dashboardData.activeSessions.length > 0) {
            setActiveSession(dashboardData.activeSessions[0]);
            setActiveSessions(dashboardData.activeSessions);
          } else {
            setActiveSession(null);
            setActiveSessions([]);
          }
        }

        // Set upcoming reservations
        if (dashboardData.upcomingReservations) {
          setLocalUpcomingReservations(dashboardData.upcomingReservations);
        }

        // Set notifications
        if (dashboardData.notifications) {
          const unreadCount = dashboardData.notifications.filter((n: any) => !n.isRead).length;
          setUnreadNotifications(unreadCount);
        }
      } else {
        // Fallback to individual API calls if dashboard fails
        // Fetch vehicles
        const vehiclesResponse = await apiService.getVehicles();
        if (vehiclesResponse.success && vehiclesResponse.data) {
          setVehicles(vehiclesResponse.data);
          setSelectedVehicle(vehiclesResponse.data.find(v => v.isDefault) || null);
        }

        // Fetch active charging session
        const activeSessionResponse = await apiService.getActiveSession();
        if (activeSessionResponse.success && activeSessionResponse.data) {
          if (activeSessionResponse.data.length > 0) {
            setActiveSession(activeSessionResponse.data[0]);
            setActiveSessions(activeSessionResponse.data);
          } else {
            setActiveSession(null);
            setActiveSessions([]);
          }
        } else {
          setActiveSession(null);
          setActiveSessions([]);
        }

        // Fetch user reservations
        const reservationsResponse = await apiService.getReservationsByUserId(user.id);
        if (reservationsResponse.success && reservationsResponse.data) {
          const confirmedReservations = reservationsResponse.data.filter(
            (r: Reservation) => r.status === 'confirmed' && new Date(r.scheduledStartTime) > new Date()
          );
          setLocalUpcomingReservations(confirmedReservations);
        }
      }

      // Fetch AI recommendations
      try {
        const aiResponse = await apiService.getAIUserRecommendations(user.id);
        if (aiResponse.success && aiResponse.data) {
          setAiRecommendations(aiResponse.data);
        }
      } catch (error) {
        console.error('Error fetching AI recommendations:', error);
      }

    } catch (error) {
      console.error('Error fetching home screen data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, setVehicles, setActiveSessions, setSelectedVehicle]);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Set up real-time updates
  useEffect(() => {
    if (!user?.id) return;

    // Start polling for updates
    realTimeService.startPolling(user.id);

    // Subscribe to charging session updates
    const unsubscribeCharging = realTimeService.subscribe('charging_session', (update) => {
      if (update.action === 'updated' || update.action === 'created') {
        // Refresh data when charging session updates
        fetchData();
      }
    });

    // Subscribe to notification updates
    const unsubscribeNotifications = realTimeService.subscribe('notification', (update) => {
      if (update.action === 'created') {
        // Update unread count
        setUnreadNotifications(prev => prev + 1);
        console.log('New notification:', update.data);
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeCharging();
      unsubscribeNotifications();
      realTimeService.stopPolling();
    };
  }, [user?.id, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getTipColor = (category: string) => {
    switch (category) {
      case 'battery': return '#007AFF';
      case 'charging': return '#FF9800';
      case 'cost': return '#4CAF50';
      case 'efficiency': return '#9C27B0';
      case 'health': return '#2196F3';
      default: return '#666';
    }
  };

  const currentVehicle = selectedVehicle || vehicles.find(v => v.isDefault) || vehicles[0];

  const nextReservation = upcomingReservations
    .sort((a: Reservation, b: Reservation) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.firstName}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#333" />
          {unreadNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        )}
        {/* Current Vehicle Card */}
        {currentVehicle ? (
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <View>
                <Text style={styles.vehicleTitle}>Current Vehicle</Text>
                <Text style={styles.vehicleName}>
                  {currentVehicle.make} {currentVehicle.model}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push(`/vehicle/edit?vehicleId=${currentVehicle.id}`)}>
                <Ionicons name="create-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.batteryContainer}>
              <View style={styles.batteryInfo}>
                <Text style={styles.batteryLevel}>
                  {currentVehicle.currentBatteryLevel || 85}%
                </Text>
                <Text style={styles.batteryLabel}>Battery Level</Text>
              </View>

              <View style={styles.batteryVisual}>
                <View style={styles.batteryOuter}>
                  <View
                    style={[
                      styles.batteryInner,
                      {
                        width: `${currentVehicle.currentBatteryLevel || 85}%`,
                        backgroundColor: getBatteryColor(currentVehicle.currentBatteryLevel || 85)
                      }
                    ]}
                  />
                </View>
                <View style={styles.batteryTip} />
              </View>

              <View style={styles.rangeInfo}>
                <Text style={styles.rangeValue}>
                  {calculateEstimatedRange(
                    currentVehicle.currentBatteryLevel || 85,
                    currentVehicle.estimatedRange
                  ).toFixed(0)} km
                </Text>
                <Text style={styles.rangeLabel}>Estimated Range</Text>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addVehicleCard}
            onPress={() => router.push('/vehicle/add')}
          >
            <Ionicons name="car-outline" size={32} color="#007AFF" />
            <Text style={styles.addVehicleText}>Add Your First Vehicle</Text>
            <Text style={styles.addVehicleSubtext}>
              Add your EV to get personalized recommendations
            </Text>
          </TouchableOpacity>
        )}

        {/* Active Charging Session */}
        {activeSession && (
          <View style={styles.chargingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Active Charging</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {activeSession.status === 'active' ? 'Charging' : 'Connected'}
                </Text>
              </View>
            </View>

            <Text style={styles.stationName}>
              Charging Station
            </Text>
            <Text style={styles.chargingTime}>
              {/* Started at {formatTime(new Date(activeSession.startTime))} */}
            </Text>

            <View style={styles.chargingProgress}>
              <Text style={styles.energyDelivered}>
                {(activeSession.energyDelivered || 0).toFixed(1)} kWh delivered
              </Text>
              <Text style={styles.chargingCost}>
                ${(activeSession.cost || 0).toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewSessionButton}
              onPress={() => router.push('/charging/session')}
            >
              <Text style={styles.viewSessionButtonText}>View Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Next Reservation */}
        {nextReservation && (
          <View style={styles.reservationCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Upcoming Reservation</Text>
              <Ionicons name="time-outline" size={16} color="#666" />
            </View>

            <Text style={styles.reservationTime}>
              {/* {formatTime(new Date(nextReservation.scheduledStartTime))} */}
            </Text>
            <Text style={styles.reservationDate}>
              {new Date(nextReservation.scheduledStartTime).toDateString()}
            </Text>

            <View style={styles.reservationDetails}>
              <Text style={styles.reservationStation}>
                Charging Station
              </Text>
              <Text style={styles.reservationDuration}>
                Duration: {nextReservation.estimatedDuration} minutes
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewReservationButton}
              onPress={() => router.push(`/station/details?id=${nextReservation.stationId}`)}
            >
              <Text style={styles.viewReservationButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/explore')}
            >
              <Ionicons name="search" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Find Stations</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/trip/plan')}
            >
              <Ionicons name="map" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Plan Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/charging')}
            >
              <Ionicons name="flash" size={24} color="#007AFF" />
              <Text style={styles.actionText}>My Charging</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/analytics')}
            >
              <Ionicons name="analytics" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Recommendations Section */}
        {aiRecommendations && (
          <View style={styles.tipsSection}>
            <View style={styles.aiSectionHeader}>
              <Ionicons name="sparkles" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>AI Recommendations for You</Text>
            </View>

            {/* Personalized Tips */}
            {aiRecommendations.tips && aiRecommendations.tips.slice(0, 3).map((tip: any, index: number) => (
              <View key={index} style={[
                styles.tipCard,
                tip.priority === 'high' && styles.highPriorityTip
              ]}>
                <Ionicons 
                  name={tip.icon as any} 
                  size={20} 
                  color={getTipColor(tip.category)} 
                />
                <View style={styles.tipContent}>
                  <View style={styles.tipHeader}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    {tip.priority === 'high' && (
                      <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>!</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tipText}>{tip.description}</Text>
                </View>
              </View>
            ))}

            {/* Charging Routine Insights */}
            {aiRecommendations.chargingRoutine && (
              <View style={styles.routineCard}>
                <View style={styles.routineHeader}>
                  <Ionicons name="time" size={20} color="#9C27B0" />
                  <Text style={styles.routineTitle}>Your Charging Pattern</Text>
                </View>
                <Text style={styles.routinePattern}>{aiRecommendations.chargingRoutine.pattern}</Text>
                <Text style={styles.routineSuggestion}>
                  💡 {aiRecommendations.chargingRoutine.suggestion}
                </Text>
                {aiRecommendations.chargingRoutine.estimatedSavings && (
                  <View style={styles.savingsContainer}>
                    <Ionicons name="wallet" size={16} color="#4CAF50" />
                    <Text style={styles.savingsText}>
                      Potential savings: {aiRecommendations.chargingRoutine.estimatedSavings}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Station Recommendations */}
            {aiRecommendations.stationRecommendations && aiRecommendations.stationRecommendations[0] && (
              <View style={styles.stationRecommendationCard}>
                <View style={styles.routineHeader}>
                  <Ionicons name="flash" size={20} color="#FF9800" />
                  <Text style={styles.routineTitle}>Station Recommendation</Text>
                </View>
                <Text style={styles.recommendationReason}>
                  {aiRecommendations.stationRecommendations[0].reason}
                </Text>
                <View style={styles.featuresContainer}>
                  {aiRecommendations.stationRecommendations[0].features.map((feature: string, idx: number) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity 
                  style={styles.findStationsButton}
                  onPress={() => router.push('/explore')}
                >
                  <Text style={styles.findStationsButtonText}>Find Nearby Stations</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Next Charge Suggestion */}
            {aiRecommendations.nextChargeSuggestion && (
              <View style={styles.nextChargeCard}>
                <View style={styles.nextChargeHeader}>
                  <Ionicons name="battery-charging" size={24} color="#007AFF" />
                  <View style={styles.nextChargeInfo}>
                    <Text style={styles.nextChargeTitle}>Next Charge Suggestion</Text>
                    <Text style={styles.nextChargeWhen}>{aiRecommendations.nextChargeSuggestion.when}</Text>
                  </View>
                </View>
                <Text style={styles.nextChargeWhy}>{aiRecommendations.nextChargeSuggestion.why}</Text>
                <Text style={styles.nextChargeTarget}>
                  Target: {aiRecommendations.nextChargeSuggestion.targetLevel}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Fallback Tips if AI not loaded */}
        {!aiRecommendations && !loading && (
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Tips for You</Text>

            <View style={styles.tipCard}>
              <Ionicons name="leaf" size={20} color="#4CAF50" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Optimize Your Charging</Text>
                <Text style={styles.tipText}>
                  Charge during off-peak hours to save money and reduce grid load.
                </Text>
              </View>
            </View>

            <View style={styles.tipCard}>
              <Ionicons name="battery-charging" size={20} color="#FF9800" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Battery Health</Text>
                <Text style={styles.tipText}>
                  Avoid charging to 100% daily. 80% is optimal for battery longevity.
                </Text>
              </View>
            </View>
          </View>
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
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  vehicleTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batteryInfo: {
    alignItems: 'center',
  },
  batteryLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  batteryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  batteryVisual: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryOuter: {
    width: 60,
    height: 30,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  batteryInner: {
    height: '100%',
    borderRadius: 4,
  },
  batteryTip: {
    width: 4,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginLeft: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  rangeInfo: {
    alignItems: 'center',
  },
  rangeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  rangeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  addVehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    marginVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F4FD',
    borderStyle: 'dashed',
  },
  addVehicleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 12,
    marginBottom: 8,
  },
  addVehicleSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  chargingCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  stationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  chargingTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  chargingProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  energyDelivered: {
    fontSize: 14,
    color: '#333',
  },
  chargingCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  viewSessionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewSessionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reservationCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
  },
  reservationTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reservationDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  viewReservationButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewReservationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (width - 60) / 2,
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
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  tipsSection: {
    marginVertical: 16,
    paddingBottom: 100,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  reservationDetails: {
    marginVertical: 8,
  },
  reservationStation: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  reservationDuration: {
    fontSize: 14,
    color: '#666',
  },
  aiSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  highPriorityTip: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priorityBadge: {
    backgroundColor: '#FF3B30',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routineCard: {
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  routinePattern: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  routineSuggestion: {
    fontSize: 13,
    color: '#9C27B0',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  stationRecommendationCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recommendationReason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
  },
  findStationsButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  findStationsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  nextChargeCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  nextChargeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  nextChargeInfo: {
    flex: 1,
  },
  nextChargeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  nextChargeWhen: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  nextChargeWhy: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  nextChargeTarget: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
});