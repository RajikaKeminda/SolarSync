import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiService } from '../../services/api';
import { useStationStore, useVehicleStore } from '../../store';
import { ChargingStation } from '../../types';
import { STATION_AMENITIES } from '../../utils/constants';
import {
  calculateChargingCost,
  calculateChargingTime,
  formatPrice,
  formatTime12Hour,
  getMaxChargingPower,
  getStationStatus,
  isVehicleCompatible
} from '../../utils/helpers';

const { width, height } = Dimensions.get('window');

// Mock station data (fallback)
const createMockStation = (id: string): ChargingStation => ({
  id: id || '1',
  ownerId: 'owner1',
  name: 'PowerStation Downtown',
  description: 'Fast charging in the heart of the city with premium amenities. Perfect for urban charging needs.',
  address: '123 Main St, Downtown, City 12345',
  latitude: 37.7849,
  longitude: -122.4094,
  totalPorts: 8,
  availablePorts: 3,
  portTypes: [
    { type: 'CCS2', count: 4, maxPower: 150, available: 2 },
    { type: 'Type2', count: 4, maxPower: 22, available: 1 }
  ],
  pricing: {
    baseRate: 0.35,
    peakRate: 0.45,
    offPeakRate: 0.28,
    currency: 'USD'
  },
  amenities: ['restroom', 'wifi', 'restaurant', 'shopping', 'parking', 'security'],
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
  images: [
    'https://via.placeholder.com/400x200/007AFF/FFFFFF?text=Station+1',
    'https://via.placeholder.com/400x200/4CAF50/FFFFFF?text=Station+2',
    'https://via.placeholder.com/400x200/FF9800/FFFFFF?text=Station+3',
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

export default function StationDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addToFavorites, removeFromFavorites, favoriteStations } = useStationStore();
  const { selectedVehicle } = useVehicleStore();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [station, setStation] = useState<ChargingStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch station data from API
  const fetchStationDetails = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setError('Invalid station ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getStationById(id);

      if (response.success && response.data) {
        setStation(response.data);
      } else {
        console.error('Failed to fetch station:', response.error);
        // Fall back to mock data if API fails
        setStation(createMockStation(id));
        setError(response.error || 'Failed to load station details');
      }
    } catch (error) {
      console.error('Error fetching station details:', error);
      // Fall back to mock data if API fails
      setStation(createMockStation(id));
      setError('Failed to load station details. Showing demo data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load station data on mount
  useEffect(() => {
    fetchStationDetails();
  }, [fetchStationDetails]);

  // Early return for loading and error states
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="dark" />
        <TouchableOpacity
          style={styles.loadingBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.loadingText}>Loading station details...</Text>
      </View>
    );
  }

  if (error && !station) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="dark" />
        <TouchableOpacity
          style={styles.loadingBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Ionicons name="warning" size={48} color="#FF9800" />
        <Text style={styles.errorTitle}>Station Not Found</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchStationDetails}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!station) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="dark" />
        <TouchableOpacity
          style={styles.loadingBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.errorText}>Station data not available</Text>
      </View>
    );
  }

  const isFavorite = favoriteStations.some(s => s.id === station.id);
  const status = getStationStatus(station);
  const isCompatible = selectedVehicle ? isVehicleCompatible(selectedVehicle, station) : true;
  const maxPower = selectedVehicle ? getMaxChargingPower(selectedVehicle, station) : 0;

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      removeFromFavorites(station.id);
    } else {
      addToFavorites(station);
    }
  };

  const handleBook = () => {
    if (!selectedVehicle) {
      Alert.alert(
        'Add Vehicle',
        'Please add a vehicle to your profile before booking a charging session.',
        [
          { text: 'Cancel' },
          { text: 'Add Vehicle', onPress: () => router.push('/vehicle/add') }
        ]
      );
      return;
    }

    if (!isCompatible) {
      Alert.alert(
        'Incompatible Vehicle',
        'Your vehicle is not compatible with the available charging ports at this station.',
        [{ text: 'OK' }]
      );
      return;
    }

    router.push(`/station/book?stationId=${station.id}`);
  };

  const handleGetDirections = () => {
    // TODO: Integrate with maps app
    Alert.alert('Directions', 'Opening directions in your maps app...');
  };

  const handleCallStation = () => {
    Alert.alert('Contact Station', 'Calling station support...');
  };

  const getAmenityInfo = (amenityId: string) => {
    return STATION_AMENITIES.find(a => a.id === amenityId) ||
      { id: amenityId, name: amenityId, icon: 'ellipse' };
  };

  const renderStationImages = () => {
    const images = station?.images && station.images.length > 0
      ? station.images
      : ['https://via.placeholder.com/400x200/007AFF/FFFFFF?text=No+Image'];

    return (
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setSelectedImageIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.stationImage}
              defaultSource={require('../../assets/images/icon.png')}
            />
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  selectedImageIndex === index && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoriteToggle}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? "#FF3B30" : "#fff"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {renderStationImages()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Error Banner */}
        {error && station && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={16} color="#FF9800" />
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={fetchStationDetails}>
              <Ionicons name="refresh" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.stationName}>{station.name}</Text>
            <TouchableOpacity onPress={() => router.push(`/station/reviews?id=${station.id}`)}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text style={styles.rating}>{station.averageRating}</Text>
                <Text style={styles.reviewCount}>({station.totalReviews} reviews)</Text>
              </View>
            </TouchableOpacity>

          </View>

          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator,
              {
                backgroundColor: status.status === 'available' ? '#4CAF50' :
                  status.status === 'busy' ? '#FF9800' : '#F44336'
              }
            ]} />
            <Text style={styles.statusText}>{status.message}</Text>
          </View>
        </View>

        <Text style={styles.address}>{station.address}</Text>
        <Text style={styles.description}>{station.description}</Text>

        {!isCompatible && (
          <View style={styles.incompatibleBanner}>
            <Ionicons name="warning" size={20} color="#FF9800" />
            <Text style={styles.incompatibleText}>
              Your vehicle is not compatible with this station&apos;s charging ports
            </Text>
          </View>
        )}

        {/* Charging Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charging Information</Text>

          <View style={styles.chargingInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Available Ports</Text>
              <Text style={styles.infoValue}>
                {station.availablePorts} of {station.totalPorts}
              </Text>
            </View>

            {selectedVehicle && isCompatible && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Max Power for Your Vehicle</Text>
                  <Text style={styles.infoValue}>{maxPower} kW</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Est. Charging Time (20-80%)</Text>
                  <Text style={styles.infoValue}>
                    {Math.round(calculateChargingTime(20, 80, selectedVehicle.batteryCapacity, maxPower))} min
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Est. Cost (20-80%)</Text>
                  <Text style={styles.infoValue}>
                    {formatPrice(calculateChargingCost(20, 80, selectedVehicle.batteryCapacity, station.pricing.baseRate))}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Port Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charging Ports</Text>

          {station.portTypes.map((port, index) => (
            <View key={index} style={styles.portCard}>
              <View style={styles.portHeader}>
                <View style={styles.portInfo}>
                  <Ionicons name="flash" size={20} color="#007AFF" />
                  <Text style={styles.portType}>{port.type}</Text>
                </View>
                <Text style={styles.portPower}>{port.maxPower} kW</Text>
              </View>
              <Text style={styles.portAvailability}>
                {port.available} of {port.count} available
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <View style={styles.pricingCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Standard Rate</Text>
              <Text style={styles.priceValue}>
                {formatPrice(station.pricing.baseRate)}/kWh
              </Text>
            </View>

            {station.pricing.peakRate && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Peak Hours (6 PM - 10 PM)</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(station.pricing.peakRate)}/kWh
                </Text>
              </View>
            )}

            {station.pricing.offPeakRate && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Off-Peak (11 PM - 6 AM)</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(station.pricing.offPeakRate)}/kWh
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>

          <View style={styles.hoursCard}>
            {Object.entries(station.operatingHours).map(([day, hours]) => (
              <View key={day} style={styles.hourRow}>
                <Text style={styles.dayText}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>
                <Text style={styles.hoursText}>
                  {hours.isOpen ?
                    (hours.is24Hours ? '24 Hours' :
                      `${formatTime12Hour(hours.openTime || '00:00')} - ${formatTime12Hour(hours.closeTime || '23:59')}`) :
                    'Closed'
                  }
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>

          <View style={styles.amenitiesGrid}>
            {station.amenities.map((amenityId, index) => {
              const amenity = getAmenityInfo(amenityId);
              return (
                <View key={index} style={styles.amenityCard}>
                  <Ionicons name={amenity.icon as any} size={20} color="#007AFF" />
                  <Text style={styles.amenityText}>{amenity.name}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGetDirections}
          >
            <Ionicons name="navigate" size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCallStation}
          >
            <Ionicons name="call" size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Call</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.bookButton,
            (!isCompatible || status.status === 'full') && styles.disabledButton
          ]}
          onPress={handleBook}
          disabled={!isCompatible || status.status === 'full'}
        >
          <Text style={styles.bookButtonText}>
            {status.status === 'full' ? 'Station Full' : 'Book Charging Session'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    height: height * 0.3,
    position: 'relative',
  },
  stationImage: {
    width: width,
    height: height * 0.3,
    backgroundColor: '#E0E0E0',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  stationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  incompatibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  incompatibleText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chargingInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  portCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  portHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  portInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  portPower: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  portAvailability: {
    fontSize: 12,
    color: '#666',
  },
  pricingCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  hoursCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  amenityText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingBackButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
});
