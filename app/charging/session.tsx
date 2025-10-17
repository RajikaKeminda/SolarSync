import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiService } from '../../services/api';
import { useAuthStore, useChargingStore, useVehicleStore } from '../../store';
import { ChargingSession } from '../../types';
import { formatEnergy, formatPrice, formatTime, getBatteryColor } from '../../utils/helpers';

export default function ChargingSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams();
  const { token } = useAuthStore();
  const { updateChargingSession } = useChargingStore();
  const { selectedVehicle } = useVehicleStore();
  
  const [session, setSession] = useState<ChargingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const [, setSessionTimer] = useState(0);
  const [currentBattery, setCurrentBattery] = useState(25);
  const [currentPower, setCurrentPower] = useState(0);
  const [energyDelivered, setEnergyDelivered] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);

  const vehicle = selectedVehicle;

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        apiService.setToken(token);
        
        let sessionData: ChargingSession | null = null;
        
        if (sessionId) {
          // Fetch specific session by ID
          const response = await apiService.getChargingSessionById(sessionId as string);
          if (response.success && response.data) {
            sessionData = response.data;
          }
        } else {
          // Fetch active sessions
          const response = await apiService.getActiveSession();
          if (response.success && response.data && response.data.length > 0) {
            sessionData = response.data[0];
          }
        }
        
        if (sessionData) {
          setSession(sessionData);
          setCurrentBattery(sessionData.energyDelivered > 0 ? 
            Math.min(100, 25 + (sessionData.energyDelivered / (vehicle?.batteryCapacity || 75)) * 100) : 25);
          setCurrentPower(150); // Mock current power - would come from real-time data
          setEnergyDelivered(sessionData.energyDelivered);
          setCurrentCost(sessionData.cost);
        } else {
          Alert.alert('No Active Session', 'No active charging session found.');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        Alert.alert('Error', 'Failed to load charging session');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, token, vehicle?.batteryCapacity, router]);

  // Real-time updates
  useEffect(() => {
    if (!session) return;

    // Animate charging progress
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Session timer
    const timer = setInterval(() => {
      setSessionTimer(prev => prev + 1);
    }, 1000);

    // Poll for session updates every 30 seconds
    const updateInterval = setInterval(async () => {
      if (session.id && token) {
        try {
          const response = await apiService.getChargingSessionById(session.id);
          if (response.success && response.data) {
            const updatedSession = response.data;
            setSession(updatedSession);
            setCurrentBattery(updatedSession.energyDelivered > 0 ? 
              Math.min(100, 25 + (updatedSession.energyDelivered / (vehicle?.batteryCapacity || 75)) * 100) : 25);
            setEnergyDelivered(updatedSession.energyDelivered);
            setCurrentCost(updatedSession.cost);
            
            // Update local store
            updateChargingSession(updatedSession.id, updatedSession);
          }
        } catch (error) {
          console.error('Error updating session:', error);
        }
      }
    }, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(updateInterval);
      animatedValue.stopAnimation();
    };
  }, [session, token, vehicle?.batteryCapacity, updateChargingSession, animatedValue]);

  const handleStopCharging = async () => {
    if (!session) return;
    
    Alert.alert(
      'Stop Charging',
      'Are you sure you want to stop the charging session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Charging',
          style: 'destructive',
          onPress: async () => {
            try {
              setStopping(true);
              //calculate energy delivered and cost
              // Calculate random energy delivered based on session start time
              // Seed random using some function of startTime
              const sessionStart = new Date(session.startTime).getTime();
              const now = Date.now();
              const elapsedMinutes = Math.floor((now - sessionStart) / 1000 / 60);
              const minKwh = Math.max(1, Math.floor(elapsedMinutes * 1.2)); // at least 1kWh, assume ~1.2kW/min
              // Generate a seeded random value so it's deterministic per session, but still "random enough"
              function seededRandom(seed: number) {
                const x = Math.sin(seed) * 10000;
                return x - Math.floor(x);
              }
              const randomFactor = 0.8 + seededRandom(sessionStart) * 0.4; // between 0.8 and 1.2
              const batteryCapacity = vehicle?.batteryCapacity || 75;
              const maxEnergy = Math.max(1, Math.min(batteryCapacity, Math.floor(batteryCapacity * 0.8)));
              const energyDelivered = Math.min(maxEnergy, Math.floor(minKwh * randomFactor));
              const baseRate = typeof session.stationId === 'object' && session.stationId && session.stationId.pricing ? session.stationId.pricing.baseRate : 0.35;
              const cost = Number((energyDelivered * baseRate).toFixed(2));
              const response = await apiService.stopChargingSession(session.id, energyDelivered, cost);
              
              if (response.success && response.data) {
                // Update local store
                updateChargingSession(session.id, {
                  status: 'completed',
                  endTime: new Date(),
                  energyDelivered: response.data.energyDelivered,
                  cost: response.data.cost
                });
                
                Alert.alert(
                  'Charging Stopped',
                  `Session completed. Total cost: ${formatPrice(response.data.cost)}`,
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else {
                Alert.alert('Error', response.error || 'Failed to stop charging session');
              }
            } catch (error) {
              console.error('Error stopping session:', error);
              Alert.alert('Error', 'Failed to stop charging session');
            } finally {
              setStopping(false);
            }
          },
        },
      ]
    );
  };


  const sessionDuration = session ? Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000 / 60) : 0;
  const batteryProgress = session ? ((currentBattery - 25) / (80 - 25)) * 100 : 0;
  const estimatedTimeRemaining = session && currentPower > 0 ? 
    Math.round(((80 - currentBattery) / 100 * (vehicle?.batteryCapacity || 75)) / (currentPower / 60)) : 0;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Charging Session</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Charging Session</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContent}>
          <Ionicons name="alert-circle" size={48} color="#fff" />
          <Text style={styles.errorText}>No active session found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Charging Session</Text>
        <TouchableOpacity onPress={() => router.push(`/station/details?id=${typeof session.stationId === 'object' && session.stationId ? session.stationId.id : session.stationId}`)}>
          <Ionicons name="information-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Station Info */}
        <View style={styles.stationCard}>
          <Text style={styles.stationName}>
            {typeof session.stationId === 'object' && session.stationId ? session.stationId.name : 'Charging Station'}
          </Text>
          <Text style={styles.stationAddress}>
            {typeof session.stationId === 'object' && session.stationId ? session.stationId.address : 'Station Address'}
          </Text>
          <View style={styles.stationDetails}>
            <View style={styles.stationDetail}>
              <Text style={styles.detailLabel}>Port Type</Text>
              <Text style={styles.detailValue}>CCS2</Text>
            </View>
            <View style={styles.stationDetail}>
              <Text style={styles.detailLabel}>Max Power</Text>
              <Text style={styles.detailValue}>150 kW</Text>
            </View>
          </View>
        </View>

        {/* Battery Status */}
        <View style={styles.batterySection}>
          <Text style={styles.sectionTitle}>Battery Status</Text>
          
          <View style={styles.batteryContainer}>
            <View style={styles.batteryVisual}>
              <View style={styles.batteryOuter}>
                <Animated.View 
                  style={[
                    styles.batteryInner,
                    { 
                      height: `${currentBattery}%`,
                      backgroundColor: getBatteryColor(currentBattery)
                    }
                  ]}
                />
                
                {/* Charging Animation */}
                <Animated.View
                  style={[
                    styles.chargingIndicator,
                    {
                      opacity: animatedValue,
                    }
                  ]}
                >
                  <Ionicons name="flash" size={20} color="#FFD700" />
                </Animated.View>
              </View>
              <View style={styles.batteryTip} />
            </View>
            
            <View style={styles.batteryInfo}>
              <Text style={styles.batteryLevel}>{Math.round(currentBattery)}%</Text>
              <Text style={styles.batteryLabel}>Current Level</Text>
              
              <View style={styles.batteryProgress}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, Math.max(0, batteryProgress))}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  25% → 80%
                </Text>
              </View>
              
              {vehicle && (
                <Text style={styles.rangeInfo}>
                  Est. Range: {Math.round((currentBattery / 100) * vehicle.estimatedRange)} km
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Charging Status */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Charging Details</Text>
          
          <View style={styles.statusGrid}>
            <View style={styles.statusCard}>
              <Ionicons name="flash" size={24} color="#007AFF" />
              <Text style={styles.statusValue}>{currentPower} kW</Text>
              <Text style={styles.statusLabel}>Current Power</Text>
            </View>
            
            <View style={styles.statusCard}>
              <Ionicons name="time" size={24} color="#007AFF" />
              <Text style={styles.statusValue}>{estimatedTimeRemaining}m</Text>
              <Text style={styles.statusLabel}>Time Remaining</Text>
            </View>
            
            <View style={styles.statusCard}>
              <Ionicons name="battery-charging" size={24} color="#007AFF" />
              <Text style={styles.statusValue}>{formatEnergy(energyDelivered)}</Text>
              <Text style={styles.statusLabel}>Energy Delivered</Text>
            </View>
            
            <View style={styles.statusCard}>
              <Ionicons name="wallet" size={24} color="#007AFF" />
              <Text style={styles.statusValue}>{formatPrice(currentCost)}</Text>
              <Text style={styles.statusLabel}>Current Cost</Text>
            </View>
          </View>
        </View>

        {/* Session Info */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sectionTitle}>Session Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Started at</Text>
              <Text style={styles.infoValue}>{formatTime(new Date(session.startTime))}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{sessionDuration} minutes</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rate</Text>
              <Text style={styles.infoValue}>
                {typeof session.stationId === 'object' && session.stationId && session.stationId.pricing ? 
                  `$${session.stationId.pricing.baseRate}/kWh` : '$0.35/kWh'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Session ID</Text>
              <Text style={styles.infoValue}>{session.id.slice(-8)}</Text>
            </View>
          </View>
        </View>

        {/* Real-time Updates */}
        <View style={styles.updatesSection}>
          <Text style={styles.sectionTitle}>Live Updates</Text>
          
          <View style={styles.updateCard}>
            <View style={styles.updateItem}>
              <View style={styles.updateTime}>
                <Text style={styles.updateTimeText}>Just now</Text>
              </View>
              <Text style={styles.updateText}>Charging at optimal rate (145 kW)</Text>
            </View>
            
            <View style={styles.updateItem}>
              <View style={styles.updateTime}>
                <Text style={styles.updateTimeText}>2 min ago</Text>
              </View>
              <Text style={styles.updateText}>Battery temperature normal</Text>
            </View>
            
            <View style={styles.updateItem}>
              <View style={styles.updateTime}>
                <Text style={styles.updateTimeText}>5 min ago</Text>
              </View>
              <Text style={styles.updateText}>Charging session stabilized</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.stopButton, stopping && styles.stopButtonDisabled]}
            onPress={handleStopCharging}
            disabled={stopping}
          >
            {stopping ? (
              <View style={styles.loadingButtonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.stopButtonText}>Stopping...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="stop" size={20} color="#fff" />
                <Text style={styles.stopButtonText}>Stop Charging</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  stationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stationDetail: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  batterySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  batteryContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
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
  batteryVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  batteryOuter: {
    width: 60,
    height: 120,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  batteryInner: {
    width: '100%',
    borderRadius: 8,
  },
  chargingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  batteryTip: {
    width: 8,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  batteryInfo: {
    flex: 1,
  },
  batteryLevel: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  batteryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  batteryProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  rangeInfo: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  statusSection: {
    marginBottom: 20,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sessionInfo: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  updatesSection: {
    marginBottom: 20,
  },
  updateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  updateTime: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  updateTimeText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
  updateText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    marginBottom: 20,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  stopButtonDisabled: {
    opacity: 0.7,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
