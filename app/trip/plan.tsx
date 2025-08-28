import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocationStore, useVehicleStore } from '../../store';
import { formatDistance, formatPrice, formatTime } from '../../utils/helpers';

export default function TripPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedVehicle } = useVehicleStore();
  const { currentLocation } = useLocationStore();
  
  const [tripDescription, setTripDescription] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [tripPlan, setTripPlan] = useState<any>(null);
  const [planningMode, setPlanningMode] = useState<'ai' | 'manual'>('ai');

  // Mock AI response
  const mockTripPlan = {
    route: {
      distance: 450,
      duration: 280, // minutes
      totalCost: 65.40,
      carbonSaved: 42.5
    },
    chargingStops: [
      {
        station: {
          id: '1',
          name: 'Highway Rest Stop Charger',
          address: 'Highway 101, Mile 150',
          distance: 180,
          pricing: { baseRate: 0.32 }
        },
        arrivalBattery: 35,
        chargeTo: 85,
        chargingTime: 35,
        cost: 28.50
      },
      {
        station: {
          id: '2',
          name: 'Downtown FastCharge',
          address: 'City Center Plaza',
          distance: 420,
          pricing: { baseRate: 0.38 }
        },
        arrivalBattery: 25,
        chargeTo: 80,
        chargingTime: 45,
        cost: 36.90
      }
    ],
    tips: [
      'Pre-condition your battery during the last 30 minutes before each charging stop',
      'Consider charging to 85% instead of 100% to save time',
      'Weather conditions may affect your range by up to 15%'
    ]
  };

  const handleAIPlan = async () => {
    if (!tripDescription.trim()) {
      Alert.alert('Missing Information', 'Please describe your trip');
      return;
    }

    if (!selectedVehicle) {
      Alert.alert('Vehicle Required', 'Please add a vehicle to plan your trip');
      return;
    }

    setIsPlanning(true);

    // Simulate AI processing
    setTimeout(() => {
      setTripPlan(mockTripPlan);
      setIsPlanning(false);
    }, 3000);
  };

  const handleManualPlan = async () => {
    if (!startLocation.trim() || !endLocation.trim()) {
      Alert.alert('Missing Information', 'Please enter start and end locations');
      return;
    }

    setIsPlanning(true);

    // Simulate manual planning
    setTimeout(() => {
      setTripPlan(mockTripPlan);
      setIsPlanning(false);
    }, 2000);
  };

  const handleBookStation = (stationId: string) => {
    router.push(`/station/book?stationId=${stationId}`);
  };

  const renderAIMode = () => (
    <View style={styles.section}>
      <View style={styles.modeHeader}>
        <Ionicons name="sparkles" size={24} color="#007AFF" />
        <Text style={styles.modeTitle}>AI Trip Planning</Text>
      </View>
      
      <Text style={styles.modeDescription}>
        Describe your trip in natural language and let AI plan the optimal route with charging stops.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Describe your trip</Text>
        <TextInput
          style={styles.tripInput}
          placeholder="e.g., I'm driving from San Francisco to Los Angeles tomorrow morning with my Tesla Model 3. I want to stop for lunch and need to arrive by 6 PM."
          value={tripDescription}
          onChangeText={setTripDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity 
        style={[styles.planButton, isPlanning && styles.planButtonDisabled]}
        onPress={handleAIPlan}
        disabled={isPlanning}
      >
        {isPlanning ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="sync" size={20} color="#fff" />
            <Text style={styles.planButtonText}>AI is planning your route...</Text>
          </View>
        ) : (
          <Text style={styles.planButtonText}>Plan with AI</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderManualMode = () => (
    <View style={styles.section}>
      <View style={styles.modeHeader}>
        <Ionicons name="map" size={24} color="#007AFF" />
        <Text style={styles.modeTitle}>Manual Planning</Text>
      </View>
      
      <Text style={styles.modeDescription}>
        Enter specific start and end locations for route planning.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Start Location</Text>
        <View style={styles.locationInputContainer}>
          <Ionicons name="location" size={20} color="#007AFF" />
          <TextInput
            style={styles.locationInput}
            placeholder="Enter starting point"
            value={startLocation}
            onChangeText={setStartLocation}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>End Location</Text>
        <View style={styles.locationInputContainer}>
          <Ionicons name="flag" size={20} color="#007AFF" />
          <TextInput
            style={styles.locationInput}
            placeholder="Enter destination"
            value={endLocation}
            onChangeText={setEndLocation}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.planButton, isPlanning && styles.planButtonDisabled]}
        onPress={handleManualPlan}
        disabled={isPlanning}
      >
        {isPlanning ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="sync" size={20} color="#fff" />
            <Text style={styles.planButtonText}>Planning route...</Text>
          </View>
        ) : (
          <Text style={styles.planButtonText}>Plan Route</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderTripPlan = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Trip Plan</Text>
      
      {/* Route Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="map" size={20} color="#007AFF" />
          <Text style={styles.summaryTitle}>Route Summary</Text>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDistance(tripPlan.route.distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(tripPlan.route.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatPrice(tripPlan.route.totalCost)}</Text>
            <Text style={styles.statLabel}>Charging Cost</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tripPlan.route.carbonSaved.toFixed(1)} kg</Text>
            <Text style={styles.statLabel}>CO₂ Saved</Text>
          </View>
        </View>
      </View>

      {/* Charging Stops */}
      <View style={styles.chargingStops}>
        <Text style={styles.stopsTitle}>Charging Stops</Text>
        
        {tripPlan.chargingStops.map((stop: any, index: number) => (
          <View key={index} style={styles.stopCard}>
            <View style={styles.stopHeader}>
              <View style={styles.stopNumber}>
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{stop.station.name}</Text>
                <Text style={styles.stopAddress}>{stop.station.address}</Text>
              </View>
              <TouchableOpacity 
                style={styles.bookStopButton}
                onPress={() => handleBookStation(stop.station.id)}
              >
                <Text style={styles.bookStopText}>Book</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.stopDetails}>
              <View style={styles.stopDetail}>
                <Text style={styles.stopDetailLabel}>Arrival Battery</Text>
                <Text style={styles.stopDetailValue}>{stop.arrivalBattery}%</Text>
              </View>
              
              <View style={styles.stopDetail}>
                <Text style={styles.stopDetailLabel}>Charge To</Text>
                <Text style={styles.stopDetailValue}>{stop.chargeTo}%</Text>
              </View>
              
              <View style={styles.stopDetail}>
                <Text style={styles.stopDetailLabel}>Charging Time</Text>
                <Text style={styles.stopDetailValue}>{stop.chargingTime} min</Text>
              </View>
              
              <View style={styles.stopDetail}>
                <Text style={styles.stopDetailLabel}>Cost</Text>
                <Text style={styles.stopDetailValue}>{formatPrice(stop.cost)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Pro Tips</Text>
        
        {tripPlan.tips.map((tip: string, index: number) => (
          <View key={index} style={styles.tipItem}>
            <Ionicons name="bulb" size={16} color="#FF9800" />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.saveButton}>
          <Ionicons name="bookmark" size={20} color="#007AFF" />
          <Text style={styles.saveButtonText}>Save Trip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share" size={20} color="#007AFF" />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Trip Planning</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Info */}
        {selectedVehicle && (
          <View style={styles.vehicleCard}>
            <Ionicons name="car" size={20} color="#007AFF" />
            <Text style={styles.vehicleText}>
              {selectedVehicle.make} {selectedVehicle.model} • {selectedVehicle.currentBatteryLevel || 85}% charged
            </Text>
          </View>
        )}

        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              planningMode === 'ai' && styles.activeModeButton
            ]}
            onPress={() => setPlanningMode('ai')}
          >
            <Ionicons 
              name="sparkles" 
              size={20} 
              color={planningMode === 'ai' ? '#fff' : '#007AFF'} 
            />
            <Text style={[
              styles.modeButtonText,
              planningMode === 'ai' && styles.activeModeButtonText
            ]}>
              AI Planning
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              planningMode === 'manual' && styles.activeModeButton
            ]}
            onPress={() => setPlanningMode('manual')}
          >
            <Ionicons 
              name="map" 
              size={20} 
              color={planningMode === 'manual' ? '#fff' : '#007AFF'} 
            />
            <Text style={[
              styles.modeButtonText,
              planningMode === 'manual' && styles.activeModeButtonText
            ]}>
              Manual
            </Text>
          </TouchableOpacity>
        </View>

        {/* Planning Interface */}
        {planningMode === 'ai' ? renderAIMode() : renderManualMode()}

        {/* Trip Plan Results */}
        {tripPlan && renderTripPlan()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 16,
    gap: 8,
  },
  vehicleText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeModeButton: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  activeModeButtonText: {
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  tripInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 100,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 14,
    color: '#333',
  },
  planButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  planButtonDisabled: {
    opacity: 0.6,
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  chargingStops: {
    marginBottom: 20,
  },
  stopsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  stopCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  stopAddress: {
    fontSize: 12,
    color: '#666',
  },
  bookStopButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookStopText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  stopDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stopDetail: {
    alignItems: 'center',
  },
  stopDetailLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  stopDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#FF9800',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 6,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
});
