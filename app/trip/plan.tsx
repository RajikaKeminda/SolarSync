import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
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

import { useAuthStore, useLocationStore, useVehicleStore } from '../../store';
import { formatDistance, formatPrice, formatTime } from '../../utils/helpers';
import apiService from '../../services/api';
import {
  extractLocationsFromDescription,
  geocodeLocation,
  GeocodedLocation,
  getRouteSegments,
} from '../../services/aiTripService';
import { ChargingStation } from '../../types';

interface TripPlanResult {
  locations: GeocodedLocation[];
  stations: ChargingStation[];
  totalDistance: number;
}

export default function TripPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedVehicle } = useVehicleStore();
  const { currentLocation } = useLocationStore();
  const { user } = useAuthStore();
  
  const [tripDescription, setTripDescription] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [tripPlan, setTripPlan] = useState<TripPlanResult | null>(null);
  const [planningMode, setPlanningMode] = useState<'ai' | 'manual'>('ai');
  const [loadingStage, setLoadingStage] = useState('');

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
    setTripPlan(null);

    try {
      // Step 1: Extract locations using Gemini AI
      setLoadingStage('Analyzing your trip description with AI...');
      const extractedLocations = await extractLocationsFromDescription(tripDescription);

      if (!extractedLocations.start || !extractedLocations.destination) {
        Alert.alert(
          'Incomplete Information',
          'Could not identify start and destination locations. Please be more specific.'
        );
        setIsPlanning(false);
        return;
      }

      // Step 2: Geocode locations
      setLoadingStage('Finding exact locations...');
      const locationsToGeocode = [
        extractedLocations.start,
        ...extractedLocations.stops,
        extractedLocations.destination,
      ].filter(Boolean) as string[];

      const geocodedLocations: GeocodedLocation[] = [];
      for (const locationName of locationsToGeocode) {
        try {
          const geocoded = await geocodeLocation(locationName);
          geocodedLocations.push(geocoded);
        } catch (error) {
          console.error(`Failed to geocode ${locationName}:`, error);
          Alert.alert('Location Error', `Could not find location: ${locationName}`);
          setIsPlanning(false);
          return;
        }
      }

      // Step 3: Find charging stations along the route
      setLoadingStage('Searching for charging stations...');
      const allStations: ChargingStation[] = [];
      
      // Get route segments
      const segments = getRouteSegments(geocodedLocations);
      
      // Search for stations near each segment
      for (const segment of segments) {
        // Search in a radius around the midpoint of each segment
        const midLat = (segment.from.latitude + segment.to.latitude) / 2;
        const midLng = (segment.from.longitude + segment.to.longitude) / 2;
        
        // Adjust search radius based on segment distance (in km)
        const searchRadius = Math.min(Math.max(segment.distance * 0.5, 20), 100);
        
        try {
          const response = await apiService.getNearbyStations(
            { latitude: midLat, longitude: midLng },
            searchRadius
          );
          
          if (response.success && response.data) {
            // Filter out duplicates and inactive stations
            const newStations = response.data.filter(
              (station: ChargingStation) =>
                station.isActive &&
                station.availablePorts > 0 &&
                !allStations.some((s) => s.id === station.id)
            );
            allStations.push(...newStations);
          }
        } catch (error) {
          console.error('Error fetching stations:', error);
        }
      }

      // Step 4: Calculate total distance
      const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);

      setLoadingStage('');
      setTripPlan({
        locations: geocodedLocations,
        stations: allStations,
        totalDistance,
      });

      if (allStations.length === 0) {
        Alert.alert(
          'No Stations Found',
          'No charging stations found along your route. Try a different route or check back later.'
        );
      }
    } catch (error: any) {
      console.error('Error planning trip:', error);
      Alert.alert(
        'Planning Failed',
        error.message || 'Failed to plan your trip. Please try again.'
      );
    } finally {
      setIsPlanning(false);
      setLoadingStage('');
    }
  };

  const handleManualPlan = async () => {
    if (!startLocation.trim() || !endLocation.trim()) {
      Alert.alert('Missing Information', 'Please enter start and end locations');
      return;
    }

    setIsPlanning(true);
    setTripPlan(null);

    try {
      // Step 1: Geocode locations
      setLoadingStage('Finding exact locations...');
      const geocodedLocations: GeocodedLocation[] = [];

      const start = await geocodeLocation(startLocation);
      geocodedLocations.push(start);

      const end = await geocodeLocation(endLocation);
      geocodedLocations.push(end);

      // Step 2: Find charging stations along the route
      setLoadingStage('Searching for charging stations...');
      const segments = getRouteSegments(geocodedLocations);
      const allStations: ChargingStation[] = [];

      for (const segment of segments) {
        const midLat = (segment.from.latitude + segment.to.latitude) / 2;
        const midLng = (segment.from.longitude + segment.to.longitude) / 2;
        const searchRadius = Math.min(Math.max(segment.distance * 0.5, 20), 100);

        try {
          const response = await apiService.getNearbyStations(
            { latitude: midLat, longitude: midLng },
            searchRadius
          );

          if (response.success && response.data) {
            const newStations = response.data.filter(
              (station: ChargingStation) =>
                station.isActive &&
                station.availablePorts > 0 &&
                !allStations.some((s) => s.id === station.id)
            );
            allStations.push(...newStations);
          }
        } catch (error) {
          console.error('Error fetching stations:', error);
        }
      }

      // Step 3: Calculate total distance
      const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);

      setLoadingStage('');
      setTripPlan({
        locations: geocodedLocations,
        stations: allStations,
        totalDistance,
      });

      if (allStations.length === 0) {
        Alert.alert(
          'No Stations Found',
          'No charging stations found along your route. Try a different route or check back later.'
        );
      }
    } catch (error: any) {
      console.error('Error planning trip:', error);
      Alert.alert(
        'Planning Failed',
        error.message || 'Failed to plan your trip. Please try again.'
      );
    } finally {
      setIsPlanning(false);
      setLoadingStage('');
    }
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
          placeholder="e.g., I'm traveling from Colombo to Kandy with a stop at Kurunegala"
          value={tripDescription}
          onChangeText={setTripDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity 
        style={[styles.planButton, isPlanning && styles.planButtonDisabled]}
        onPress={handleAIPlan}
        disabled={isPlanning}
      >
        {isPlanning ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.planButtonText}>
              {loadingStage || 'Planning your route...'}
            </Text>
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
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.planButtonText}>
              {loadingStage || 'Planning route...'}
            </Text>
          </View>
        ) : (
          <Text style={styles.planButtonText}>Plan Route</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderTripPlan = () => {
    if (!tripPlan) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Trip Plan</Text>
        
        {/* Route Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="map" size={20} color="#007AFF" />
            <Text style={styles.summaryTitle}>Route Summary</Text>
          </View>
          
          <View style={styles.routeLocations}>
            {tripPlan.locations.map((location, index) => (
              <View key={index} style={styles.locationItem}>
                <Ionicons 
                  name={index === 0 ? 'location' : index === tripPlan.locations.length - 1 ? 'flag' : 'ellipse'} 
                  size={16} 
                  color={index === 0 ? '#4CAF50' : index === tripPlan.locations.length - 1 ? '#F44336' : '#FF9800'} 
                />
                <Text style={styles.locationName}>{location.name}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDistance(tripPlan.totalDistance)}</Text>
              <Text style={styles.statLabel}>Total Distance</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tripPlan.stations.length}</Text>
              <Text style={styles.statLabel}>Stations Found</Text>
            </View>
          </View>
        </View>

        {/* Charging Stations */}
        <View style={styles.chargingStops}>
          <Text style={styles.stopsTitle}>Available Charging Stations</Text>
          
          {tripPlan.stations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#999" />
              <Text style={styles.emptyStateText}>No charging stations found along this route</Text>
            </View>
          ) : (
            tripPlan.stations.map((station, index) => (
              <View key={station.id} style={styles.stopCard}>
                <View style={styles.stopHeader}>
                  <View style={styles.stopNumber}>
                    <Text style={styles.stopNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopName}>{station.name}</Text>
                    <Text style={styles.stopAddress}>{station.address}</Text>
                    {station.averageRating > 0 && (
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={12} color="#FFB800" />
                        <Text style={styles.ratingText}>
                          {station.averageRating.toFixed(1)} ({station.totalReviews})
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.bookStopButton}
                    onPress={() => handleBookStation(station.id)}
                  >
                    <Text style={styles.bookStopText}>Book</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.stopDetails}>
                  <View style={styles.stopDetail}>
                    <Text style={styles.stopDetailLabel}>Available Ports</Text>
                    <Text style={styles.stopDetailValue}>{station.availablePorts}/{station.totalPorts}</Text>
                  </View>
                  
                  <View style={styles.stopDetail}>
                    <Text style={styles.stopDetailLabel}>Base Rate</Text>
                    <Text style={styles.stopDetailValue}>{formatPrice(station.pricing.baseRate)}/kWh</Text>
                  </View>
                  
                  <View style={styles.stopDetail}>
                    <Text style={styles.stopDetailLabel}>Status</Text>
                    <Text style={[styles.stopDetailValue, { color: station.isActive ? '#4CAF50' : '#F44336' }]}>
                      {station.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Pro Tips</Text>
          
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={16} color="#FF9800" />
            <Text style={styles.tipText}>
              Plan your charging stops during meal breaks or rest stops to save time
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={16} color="#FF9800" />
            <Text style={styles.tipText}>
              Check station availability before starting your journey
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={16} color="#FF9800" />
            <Text style={styles.tipText}>
              Consider weather conditions - they may affect your range by up to 15%
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
  routeLocations: {
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  locationName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
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
