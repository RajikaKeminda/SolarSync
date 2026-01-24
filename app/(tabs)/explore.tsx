import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiService } from '../../services/api';
import { useLocationStore, useVehicleStore } from '../../store';
import { ChargingStation } from '../../types';
import { formatDistance, getStationStatus, isVehicleCompatible } from '../../utils/helpers';

// Mock nearby stations data (fallback)
const mockStations: ChargingStation[] = [
  {
    id: '1',
    ownerId: 'owner1',
    name: 'PowerStation Downtown',
    description: 'Fast charging in the heart of the city',
    address: '123 Main St, Downtown',
    latitude: 37.7849,
    longitude: -122.4094,
    totalPorts: 8,
    availablePorts: 3,
    portTypes: [
      { type: 'CCS2', count: 4, maxPower: 150, available: 2 },
      { type: 'Type2', count: 4, maxPower: 22, available: 1 }
    ],
    pricing: { baseRate: 0.35, currency: 'USD' },
    amenities: ['restroom', 'wifi', 'restaurant'],
    operatingHours: {
      monday: { isOpen: true, is24Hours: true },
      tuesday: { isOpen: true, is24Hours: true },
      wednesday: { isOpen: true, is24Hours: true },
      thursday: { isOpen: true, is24Hours: true },
      friday: { isOpen: true, is24Hours: true },
      saturday: { isOpen: true, is24Hours: true },
      sunday: { isOpen: true, is24Hours: true }
    },
    isActive: true,
    averageRating: 4.5,
    totalReviews: 128,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    ownerId: 'owner2',
    name: 'GreenCharge Mall',
    description: 'Shopping while you charge',
    address: '456 Shopping Ave, Mall District',
    latitude: 37.7749,
    longitude: -122.4194,
    totalPorts: 12,
    availablePorts: 8,
    portTypes: [
      { type: 'CCS1', count: 6, maxPower: 100, available: 4 },
      { type: 'Type1', count: 6, maxPower: 11, available: 4 }
    ],
    pricing: { baseRate: 0.28, currency: 'USD' },
    amenities: ['shopping', 'restaurant', 'parking', 'wifi'],
    operatingHours: {
      monday: { isOpen: true, openTime: '06:00', closeTime: '22:00' },
      tuesday: { isOpen: true, openTime: '06:00', closeTime: '22:00' },
      wednesday: { isOpen: true, openTime: '06:00', closeTime: '22:00' },
      thursday: { isOpen: true, openTime: '06:00', closeTime: '22:00' },
      friday: { isOpen: true, openTime: '06:00', closeTime: '23:00' },
      saturday: { isOpen: true, openTime: '06:00', closeTime: '23:00' },
      sunday: { isOpen: true, openTime: '08:00', closeTime: '21:00' }
    },
    isActive: true,
    averageRating: 4.2,
    totalReviews: 96,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    ownerId: 'owner3',
    name: 'FastCharge Highway',
    description: 'Ultra-fast charging for long trips',
    address: '789 Highway 101, Service Station',
    latitude: 37.7649,
    longitude: -122.4294,
    totalPorts: 6,
    availablePorts: 1,
    portTypes: [
      { type: 'CCS2', count: 4, maxPower: 350, available: 1 },
      { type: 'CHAdeMO', count: 2, maxPower: 200, available: 0 }
    ],
    pricing: { baseRate: 0.45, currency: 'USD' },
    amenities: ['restroom', 'convenience_store', 'car_wash'],
    operatingHours: {
      monday: { isOpen: true, is24Hours: true },
      tuesday: { isOpen: true, is24Hours: true },
      wednesday: { isOpen: true, is24Hours: true },
      thursday: { isOpen: true, is24Hours: true },
      friday: { isOpen: true, is24Hours: true },
      saturday: { isOpen: true, is24Hours: true },
      sunday: { isOpen: true, is24Hours: true }
    },
    isActive: true,
    averageRating: 4.7,
    totalReviews: 203,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLocation } = useLocationStore();
  const { selectedVehicle } = useVehicleStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all stations from API
  const fetchAllStations = useCallback(async () => {
    try {
      const response = await apiService.getAllStations();
      if (response.success && response.data) {
        setStations(response.data);
      } else {
        console.error('Failed to fetch stations:', response.error);
        // Fall back to mock data if API fails
        setStations(mockStations);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      // Fall back to mock data if API fails
      setStations(mockStations);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search stations using API
  const searchStations = useCallback(async (query: string) => {
    if (!query.trim()) {
      await fetchAllStations();
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiService.searchStations(query);
      if (response.success && response.data) {
        setStations(response.data);
      } else {
        console.error('Search failed:', response.error);
        Alert.alert('Search Error', response.error || 'Failed to search stations');
      }
    } catch (error) {
      console.error('Error searching stations:', error);
      Alert.alert('Error', 'Failed to search stations. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [fetchAllStations]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length > 2) {
        searchStations(searchQuery);
      } else if (searchQuery.length === 0) {
        fetchAllStations();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchStations, fetchAllStations]);

  // Initial data load
  useEffect(() => {
    fetchAllStations();
  }, [fetchAllStations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (searchQuery.trim()) {
      await searchStations(searchQuery);
    } else {
      await fetchAllStations();
    }
    setRefreshing(false);
  }, [searchQuery, searchStations, fetchAllStations]);

  const handleStationPress = (station: ChargingStation) => {
    router.push(`/station/details?id=${station.id}`);
  };

  const handleAISearch = () => {
    Alert.alert(
      'AI Trip Planning',
      'Describe your trip and let AI suggest the best charging stations',
      [
        { text: 'Cancel' },
        { 
          text: 'Continue', 
          onPress: () => router.push('/trip/plan')
        }
      ]
    );
  };

  const handleQuickFilter = (filterType: string) => {
    let filteredStations = [...stations];
    
    switch (filterType) {
      case 'nearest':
        // Sort by distance (mock calculation)
        filteredStations.sort((a, b) => {
          const distanceA = Math.abs(a.latitude - 37.7749) + Math.abs(a.longitude + 122.4194);
          const distanceB = Math.abs(b.latitude - 37.7749) + Math.abs(b.longitude + 122.4194);
          return distanceA - distanceB;
        });
        break;
      case 'fast':
        // Filter for fast charging (>50kW)
        filteredStations = stations.filter(station => 
          station.portTypes.some(port => port.maxPower > 50)
        );
        break;
      case 'cheapest':
        // Sort by price
        filteredStations.sort((a, b) => a.pricing.baseRate - b.pricing.baseRate);
        break;
      case 'rated':
        // Sort by rating
        filteredStations.sort((a, b) => b.averageRating - a.averageRating);
        break;
    }
    
    setStations(filteredStations);
  };

  const StationCard = ({ station }: { station: ChargingStation }) => {
    const distance = currentLocation ? 
      formatDistance(Math.abs(station.latitude - currentLocation.latitude) + Math.abs(station.longitude - currentLocation.longitude)) : 
      '2.3km';
    
    const status = getStationStatus(station);
    const isCompatible = selectedVehicle ? isVehicleCompatible(selectedVehicle, station) : true;

    return (
      <TouchableOpacity 
        style={[styles.stationCard, !isCompatible && styles.incompatibleCard]}
        onPress={() => handleStationPress(station)}
      >
        <View style={styles.stationHeader}>
          <View style={styles.stationInfo}>
            <Text style={styles.stationName}>{station.name}</Text>
            <Text style={styles.stationAddress}>{station.address}</Text>
          </View>
          <View style={styles.stationMeta}>
            <Text style={styles.stationDistance}>{distance}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFB800" />
              <Text style={styles.rating}>{station.averageRating}</Text>
            </View>
          </View>
        </View>

        <View style={styles.stationDetails}>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: status.status === 'available' ? '#4CAF50' : 
                                status.status === 'busy' ? '#FF9800' : '#F44336' }
            ]} />
            <Text style={styles.statusText}>{status.message}</Text>
          </View>

          <View style={styles.portTypes}>
            {station.portTypes.slice(0, 2).map((port, index) => (
              <View key={index} style={styles.portType}>
                <Ionicons name="flash" size={12} color="#666" />
                <Text style={styles.portText}>{port.type}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.stationFooter}>
          <View style={styles.pricing}>
            <Text style={styles.priceText}>
              ${station.pricing.baseRate}/kWh
            </Text>
          </View>

          <View style={styles.amenities}>
            {station.amenities.slice(0, 3).map((amenity, index) => (
              <View key={index} style={styles.amenityIcon}>
                <Ionicons 
                  name={getAmenityIcon(amenity)} 
                  size={14} 
                  color="#666" 
                />
              </View>
            ))}
            {station.amenities.length > 3 && (
              <Text style={styles.moreAmenities}>+{station.amenities.length - 3}</Text>
            )}
          </View>
        </View>

        {!isCompatible && (
          <View style={styles.incompatibleBanner}>
            <Ionicons name="warning" size={16} color="#FF9800" />
            <Text style={styles.incompatibleText}>
              Not compatible with your vehicle
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getAmenityIcon = (amenity: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      restroom: 'business',
      wifi: 'wifi',
      restaurant: 'restaurant',
      shopping: 'bag',
      parking: 'car',
      convenience_store: 'storefront',
      car_wash: 'car-sport'
    };
    return iconMap[amenity] || 'ellipse';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Stations</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Ionicons name="options-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stations or locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={!isSearching}
          />
          {isSearching ? (
            <View style={styles.searchLoader}>
              <Text style={styles.searchLoaderText}>Searching...</Text>
            </View>
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.aiButton} onPress={handleAISearch}>
          <Ionicons name="sparkles" size={20} color="#007AFF" />
          <Text style={styles.aiButtonText}>AI</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>Available Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>Fast Charging</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>With Amenities</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>Under $0.30</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => handleQuickFilter('nearest')}
        >
          <Ionicons name="location" size={20} color="#007AFF" />
          <Text style={styles.quickActionText}>Nearest</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => handleQuickFilter('fast')}
        >
          <Ionicons name="flash" size={20} color="#007AFF" />
          <Text style={styles.quickActionText}>Fast Charge</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => handleQuickFilter('cheapest')}
        >
          <Ionicons name="pricetag" size={20} color="#007AFF" />
          <Text style={styles.quickActionText}>Cheapest</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => handleQuickFilter('rated')}
        >
          <Ionicons name="star" size={20} color="#007AFF" />
          <Text style={styles.quickActionText}>Top Rated</Text>
        </TouchableOpacity>
      </View>

      {/* Stations List */}
      <ScrollView
        style={styles.stationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stationsHeader}>
          <Text style={styles.stationsCount}>
            {loading ? 'Loading...' : `${stations.length} stations ${searchQuery ? 'found' : 'nearby'}`}
          </Text>
          <TouchableOpacity>
            <Text style={styles.mapLink}>View on Map</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading stations...</Text>
          </View>
        ) : stations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No stations found' : 'No stations available'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? `Try searching for "${searchQuery}" with different keywords`
                : 'There are no charging stations available at the moment'
              }
            </Text>
            {searchQuery && (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.emptyButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          stations.map((station) => (
            <StationCard key={station.id} station={station} />
          ))
        )}

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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 6,
  },
  aiButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  stationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  stationsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mapLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  stationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  incompatibleCard: {
    opacity: 0.7,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  stationMeta: {
    alignItems: 'flex-end',
  },
  stationDistance: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    color: '#666',
  },
  stationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  portTypes: {
    flexDirection: 'row',
    gap: 12,
  },
  portType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  portText: {
    fontSize: 12,
    color: '#666',
  },
  stationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricing: {},
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  amenities: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amenityIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreAmenities: {
    fontSize: 12,
    color: '#666',
  },
  incompatibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  incompatibleText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  searchLoader: {
    paddingHorizontal: 8,
  },
  searchLoaderText: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
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
    lineHeight: 20,
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