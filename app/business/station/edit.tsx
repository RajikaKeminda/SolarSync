import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiService } from '../../../services/api';
import { useAuthStore } from '../../../store';
import { ChargingPortType, ChargingStation } from '../../../types';
import { CHARGING_PORT_TYPES } from '../../../utils/constants';
import { isValidEmail } from '../../../utils/helpers';

interface PortConfiguration {
  type: ChargingPortType;
  count: number;
  maxPower: number;
  pricing: number;
}


export default function EditStationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { token } = useAuthStore();
  
  // Basic Information
  const [stationName, setStationName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // Location
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  // Port Configuration
  const [portConfigurations, setPortConfigurations] = useState<PortConfiguration[]>([]);
  
  // Pricing
  const [baseRate, setBaseRate] = useState('0.35');
  const [peakRate, setPeakRate] = useState('0.45');
  const [offPeakRate, setOffPeakRate] = useState('0.28');
  
  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
  // Operating Hours (not used in current implementation)
  // const [operatingHours, setOperatingHours] = useState<Record<string, OperatingHours>>({
  //   monday: { isOpen: true, is24Hours: true },
  //   tuesday: { isOpen: true, is24Hours: true },
  //   wednesday: { isOpen: true, is24Hours: true },
  //   thursday: { isOpen: true, is24Hours: true },
  //   friday: { isOpen: true, is24Hours: true },
  //   saturday: { isOpen: true, is24Hours: true },
  //   sunday: { isOpen: true, is24Hours: true },
  // });
  
  // Settings
  const [isActive, setIsActive] = useState(true);
  const [allowReservations, setAllowReservations] = useState(true);
  const [requireMembership, setRequireMembership] = useState(false);
  
  const [station, setStation] = useState<ChargingStation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableAmenities = [
    { id: 'restroom', name: 'Restroom', icon: 'home' },
    { id: 'wifi', name: 'WiFi', icon: 'wifi' },
    { id: 'restaurant', name: 'Restaurant', icon: 'restaurant' },
    { id: 'shopping', name: 'Shopping', icon: 'bag' },
    { id: 'parking', name: 'Free Parking', icon: 'car' },
    { id: 'security', name: '24/7 Security', icon: 'shield-checkmark' },
    { id: 'lounge', name: 'Waiting Lounge', icon: 'cafe' },
    { id: 'vending', name: 'Vending Machines', icon: 'fast-food' },
  ];

  // Load existing station data
  useEffect(() => {
    const loadData = async () => {
      if (!id || !token) return;
      
      try {
        setIsLoading(true);
        apiService.setToken(token);
        
        const response = await apiService.getStationById(id as string);
        
        if (response.success && response.data) {
          const stationData = response.data;
          setStation(stationData);
          
          // Populate form with station data
          setStationName(stationData.name);
          setDescription(stationData.description || '');
          setAddress(stationData.address);
          setContactEmail(stationData.contactEmail || '');
          setContactPhone(stationData.contactPhone || '');
          setLatitude(stationData.latitude.toString());
          setLongitude(stationData.longitude.toString());
          
          // Convert port types to our format
          const portConfigs = stationData.portTypes.map(port => ({
            type: port.type,
            count: port.count,
            maxPower: port.maxPower,
            pricing: stationData.pricing.baseRate
          }));
          setPortConfigurations(portConfigs);
          
          setBaseRate(stationData.pricing.baseRate.toString());
          setPeakRate(stationData.pricing.peakRate?.toString() || '');
          setOffPeakRate(stationData.pricing.offPeakRate?.toString() || '');
          setSelectedAmenities(stationData.amenities);
          setIsActive(stationData.isActive);
          setAllowReservations(true); // Default value
          setRequireMembership(false); // Default value
        } else {
          Alert.alert('Error', response.error || 'Failed to load station data');
          router.back();
        }
      } catch (error) {
        console.error('Error loading station data:', error);
        Alert.alert('Error', 'Failed to load station data');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, token, router]);


  const handleAddPortConfiguration = () => {
    setPortConfigurations([
      ...portConfigurations,
      { type: 'Type2', count: 1, maxPower: 22, pricing: 0.25 }
    ]);
  };

  const handleRemovePortConfiguration = (index: number) => {
    if (portConfigurations.length > 1) {
      setPortConfigurations(portConfigurations.filter((_, i) => i !== index));
    }
  };

  const handlePortConfigurationChange = (
    index: number, 
    field: keyof PortConfiguration, 
    value: any
  ) => {
    const updated = [...portConfigurations];
    updated[index] = { ...updated[index], [field]: value };
    setPortConfigurations(updated);
  };

  const handleAmenityToggle = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      setSelectedAmenities(selectedAmenities.filter(id => id !== amenityId));
    } else {
      setSelectedAmenities([...selectedAmenities, amenityId]);
    }
  };


  const handleDeleteStation = async () => {
    if (!station || !token) return;
    
    Alert.alert(
      'Delete Station',
      'Are you sure you want to delete this station? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteStation(station.id);
              
              if (response.success) {
                Alert.alert(
                  'Station Deleted',
                  'The station has been successfully deleted.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else {
                Alert.alert('Error', response.error || 'Failed to delete station');
              }
            } catch (error) {
              console.error('Error deleting station:', error);
              Alert.alert('Error', 'Failed to delete station');
            }
          }
        }
      ]
    );
  };

  const validateForm = (): boolean => {
    if (!stationName.trim()) {
      Alert.alert('Validation Error', 'Station name is required');
      return false;
    }

    if (!address.trim()) {
      Alert.alert('Validation Error', 'Address is required');
      return false;
    }

    if (!latitude || !longitude) {
      Alert.alert('Validation Error', 'Location coordinates are required');
      return false;
    }

    if (contactEmail && !isValidEmail(contactEmail)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    if (portConfigurations.length === 0) {
      Alert.alert('Validation Error', 'At least one port configuration is required');
      return false;
    }

    for (const port of portConfigurations) {
      if (port.count <= 0 || port.maxPower <= 0 || port.pricing < 0) {
        Alert.alert('Validation Error', 'Invalid port configuration values');
        return false;
      }
    }

    const baseRateNum = parseFloat(baseRate);
    if (isNaN(baseRateNum) || baseRateNum <= 0) {
      Alert.alert('Validation Error', 'Base rate must be a valid positive number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !station || !token) return;

    setIsSubmitting(true);

    try {
      // Convert port configurations to API format
      const portTypes = portConfigurations.map(config => ({
        type: config.type,
        count: config.count,
        maxPower: config.maxPower,
        available: config.count // Assume all ports are available initially
      }));

      // Prepare station update data
      const updateData = {
        name: stationName.trim(),
        description: description.trim(),
        address: address.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        portTypes,
        pricing: {
          baseRate: parseFloat(baseRate),
          peakRate: peakRate ? parseFloat(peakRate) : undefined,
          offPeakRate: offPeakRate ? parseFloat(offPeakRate) : undefined,
          currency: 'USD'
        },
        amenities: selectedAmenities,
        isActive,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      };

      const response = await apiService.updateStation(station.id, updateData);

      if (response.success && response.data) {
        Alert.alert(
          'Station Updated!',
          `${stationName} has been successfully updated.`,
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to update station');
      }

    } catch (error) {
      console.error('Error updating station:', error);
      Alert.alert('Error', 'Failed to update station. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const PortConfigurationCard = ({ 
    config, 
    index 
  }: { 
    config: PortConfiguration; 
    index: number; 
  }) => (
    <View style={styles.portCard}>
      <View style={styles.portCardHeader}>
        <Text style={styles.portCardTitle}>Port Configuration {index + 1}</Text>
        {portConfigurations.length > 1 && (
          <TouchableOpacity 
            onPress={() => handleRemovePortConfiguration(index)}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle" size={20} color="#F44336" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.portConfigRow}>
        <View style={styles.portConfigItem}>
          <Text style={styles.portConfigLabel}>Port Type</Text>
          <View style={styles.portTypeSelector}>
            {Object.keys(CHARGING_PORT_TYPES).map((portType) => (
              <TouchableOpacity
                key={portType}
                style={[
                  styles.portTypeButton,
                  config.type === portType && styles.selectedPortTypeButton
                ]}
                onPress={() => handlePortConfigurationChange(index, 'type', portType)}
              >
                <Text style={[
                  styles.portTypeButtonText,
                  config.type === portType && styles.selectedPortTypeButtonText
                ]}>
                  {portType}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.portConfigRow}>
        <View style={styles.portConfigItem}>
          <Text style={styles.portConfigLabel}>Number of Ports</Text>
          <TextInput
            style={styles.portConfigInput}
            value={config.count.toString()}
            onChangeText={(text) => handlePortConfigurationChange(index, 'count', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="2"
          />
        </View>

        <View style={styles.portConfigItem}>
          <Text style={styles.portConfigLabel}>Max Power (kW)</Text>
          <TextInput
            style={styles.portConfigInput}
            value={config.maxPower.toString()}
            onChangeText={(text) => handlePortConfigurationChange(index, 'maxPower', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="150"
          />
        </View>
      </View>

      <View style={styles.portConfigRow}>
        <View style={styles.portConfigItem}>
          <Text style={styles.portConfigLabel}>Rate ($/kWh)</Text>
          <TextInput
            style={styles.portConfigInput}
            value={config.pricing.toString()}
            onChangeText={(text) => handlePortConfigurationChange(index, 'pricing', parseFloat(text) || 0)}
            keyboardType="decimal-pad"
            placeholder="0.35"
          />
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Station</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading station data...</Text>
        </View>
      </View>
    );
  }

  if (!station) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Station</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loadingContent}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Station not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Station</Text>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.loadingButtonContent}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={[styles.saveButton, styles.loadingButtonText]}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Station Name *</Text>
            <TextInput
              style={styles.input}
              value={stationName}
              onChangeText={setStationName}
              placeholder="e.g., PowerStation Downtown"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of your charging station..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address *</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main St, City, State 12345"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Contact Email</Text>
              <TextInput
                style={styles.input}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="contact@station.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="+1234567890"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Coordinates *</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={latitude}
                onChangeText={setLatitude}
                placeholder="37.7749"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={longitude}
                onChangeText={setLongitude}
                placeholder="-122.4194"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Port Configurations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Charging Ports *</Text>
            <TouchableOpacity 
              style={styles.addPortButton}
              onPress={handleAddPortConfiguration}
            >
              <Ionicons name="add" size={16} color="#007AFF" />
              <Text style={styles.addPortButtonText}>Add Port Type</Text>
            </TouchableOpacity>
          </View>

          {portConfigurations.map((config, index) => (
            <PortConfigurationCard 
              key={index} 
              config={config} 
              index={index} 
            />
          ))}
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Structure</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Base Rate ($/kWh) *</Text>
            <TextInput
              style={styles.input}
              value={baseRate}
              onChangeText={setBaseRate}
              placeholder="0.35"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Peak Rate ($/kWh)</Text>
              <TextInput
                style={styles.input}
                value={peakRate}
                onChangeText={setPeakRate}
                placeholder="0.45"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Off-Peak Rate ($/kWh)</Text>
              <TextInput
                style={styles.input}
                value={offPeakRate}
                onChangeText={setOffPeakRate}
                placeholder="0.28"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Amenities</Text>
          
          <View style={styles.amenitiesGrid}>
            {availableAmenities.map((amenity) => (
              <TouchableOpacity
                key={amenity.id}
                style={[
                  styles.amenityButton,
                  selectedAmenities.includes(amenity.id) && styles.selectedAmenityButton
                ]}
                onPress={() => handleAmenityToggle(amenity.id)}
              >
                <Ionicons 
                  name={amenity.icon as any} 
                  size={20} 
                  color={selectedAmenities.includes(amenity.id) ? '#fff' : '#007AFF'} 
                />
                <Text style={[
                  styles.amenityButtonText,
                  selectedAmenities.includes(amenity.id) && styles.selectedAmenityButtonText
                ]}>
                  {amenity.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Station Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Station Active</Text>
              <Text style={styles.settingSubtitle}>Make station available for charging</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Allow Reservations</Text>
              <Text style={styles.settingSubtitle}>Let users book charging slots in advance</Text>
            </View>
            <Switch
              value={allowReservations}
              onValueChange={setAllowReservations}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Require Membership</Text>
              <Text style={styles.settingSubtitle}>Only allow registered members to charge</Text>
            </View>
            <Switch
              value={requireMembership}
              onValueChange={setRequireMembership}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeleteStation}
          >
            <Ionicons name="trash" size={20} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Delete Station</Text>
          </TouchableOpacity>
        </View>

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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputColumn: {
    flex: 1,
    marginRight: 12,
  },
  addPortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addPortButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  portCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  portCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  portCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    padding: 4,
  },
  portConfigRow: {
    marginBottom: 12,
  },
  portConfigItem: {
    marginBottom: 8,
  },
  portConfigLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  portConfigInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  portTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  portTypeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPortTypeButton: {
    backgroundColor: '#007AFF',
  },
  portTypeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  selectedPortTypeButtonText: {
    color: '#fff',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 12,
    marginBottom: 12,
  },
  selectedAmenityButton: {
    backgroundColor: '#007AFF',
  },
  amenityButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 6,
  },
  selectedAmenityButtonText: {
    color: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingButtonText: {
    color: '#007AFF',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
