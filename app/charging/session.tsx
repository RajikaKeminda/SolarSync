import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChargingStore, useVehicleStore } from '../../store';
import { formatEnergy, formatPrice, formatTime, getBatteryColor } from '../../utils/helpers';

export default function ChargingSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeSessions, updateChargingSession } = useChargingStore();
  const { selectedVehicle } = useVehicleStore();
  
  const [animatedValue] = useState(new Animated.Value(0));
  const [sessionTimer, setSessionTimer] = useState(0);

  // Mock active session - in real app this would come from the store
  const mockSession = {
    id: 'session-1',
    stationName: 'PowerStation Downtown',
    stationAddress: '123 Main St, Downtown',
    portType: 'CCS2',
    maxPower: 150,
    currentPower: 145,
    startTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    energyDelivered: 32.5,
    cost: 11.38,
    startBattery: 25,
    currentBattery: 68,
    targetBattery: 80,
    estimatedTimeRemaining: 12,
    status: 'charging' as const
  };

  const session = activeSessions[0] || mockSession;
  const vehicle = selectedVehicle;

  useEffect(() => {
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

    return () => {
      clearInterval(timer);
      animatedValue.stopAnimation();
    };
  }, []);

  const handleStopCharging = () => {
    Alert.alert(
      'Stop Charging',
      'Are you sure you want to stop the charging session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Charging',
          style: 'destructive',
          onPress: () => {
            updateChargingSession(session.id, {
              status: 'completed',
              endTime: new Date()
            });
            router.back();
          },
        },
      ]
    );
  };

  const handlePauseCharging = () => {
    Alert.alert(
      'Pause Charging',
      'Charging will be paused. You can resume it anytime.',
      [
        { text: 'Cancel' },
        { text: 'Pause', onPress: () => console.log('Pause charging') },
      ]
    );
  };

  const sessionDuration = Math.floor((Date.now() - session.startTime.getTime()) / 1000 / 60);
  const batteryProgress = (session.currentBattery - session.startBattery) / (session.targetBattery - session.startBattery);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Charging Session</Text>
        <TouchableOpacity onPress={() => router.push('/station/details')}>
          <Ionicons name="information-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Station Info */}
        <View style={styles.stationCard}>
          <Text style={styles.stationName}>{session.stationName}</Text>
          <Text style={styles.stationAddress}>{session.stationAddress}</Text>
          <View style={styles.stationDetails}>
            <View style={styles.stationDetail}>
              <Text style={styles.detailLabel}>Port Type</Text>
              <Text style={styles.detailValue}>{session.portType}</Text>
            </View>
            <View style={styles.stationDetail}>
              <Text style={styles.detailLabel}>Max Power</Text>
              <Text style={styles.detailValue}>{session.maxPower} kW</Text>
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
                      height: `${session.currentBattery}%`,
                      backgroundColor: getBatteryColor(session.currentBattery)
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
              <Text style={styles.batteryLevel}>{session.currentBattery}%</Text>
              <Text style={styles.batteryLabel}>Current Level</Text>
              
              <View style={styles.batteryProgress}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${batteryProgress * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {session.startBattery}% → {session.targetBattery}%
                </Text>
              </View>
              
              {vehicle && (
                <Text style={styles.rangeInfo}>
                  Est. Range: {Math.round((session.currentBattery / 100) * vehicle.estimatedRange)} km
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
              <Text style={styles.statusValue}>{session.currentPower} kW</Text>
              <Text style={styles.statusLabel}>Current Power</Text>
            </View>
            
            <View style={styles.statusCard}>
              <Ionicons name="time" size={24} color="#007AFF" />
              <Text style={styles.statusValue}>{session.estimatedTimeRemaining}m</Text>
              <Text style={styles.statusLabel}>Time Remaining</Text>
            </View>
            
            <View style={styles.statusCard}>
              <Ionicons name="battery-charging" size={24} color="#007AFF" />
              <Text style={styles.statusValue}>{formatEnergy(session.energyDelivered)}</Text>
              <Text style={styles.statusLabel}>Energy Delivered</Text>
            </View>
            
            <View style={styles.statusCard}>
              <Ionicons name="wallet" size={24} color="#007AFF" />
              <Text style={styles.statusValue}>{formatPrice(session.cost)}</Text>
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
              <Text style={styles.infoValue}>{formatTime(session.startTime)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{sessionDuration} minutes</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rate</Text>
              <Text style={styles.infoValue}>$0.35/kWh</Text>
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
            style={styles.pauseButton}
            onPress={handlePauseCharging}
          >
            <Ionicons name="pause" size={20} color="#FF9800" />
            <Text style={styles.pauseButtonText}>Pause</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={handleStopCharging}
          >
            <Ionicons name="stop" size={20} color="#fff" />
            <Text style={styles.stopButtonText}>Stop Charging</Text>
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
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E1',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
    gap: 8,
  },
  pauseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
  stopButton: {
    flex: 1,
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
});
