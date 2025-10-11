import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
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

import { ChargingPortType } from '../../../types';
import { CHARGING_PORT_TYPES } from '../../../utils/constants';
import { isValidEmail } from '../../../utils/helpers';

interface PortConfiguration {
  type: ChargingPortType;
  count: number;
  maxPower: number;
  pricing: number;
}

interface OperatingHours {
  isOpen: boolean;
  is24Hours: boolean;
  openTime?: string;
  closeTime?: string;
}

export default function EditStationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  
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
  
  // Operating Hours
  const [operatingHours, setOperatingHours] = useState<Record<string, OperatingHours>>({
    monday: { isOpen: true, is24Hours: true },
    tuesday: { isOpen: true, is24Hours: true },
    wednesday: { isOpen: true, is24Hours: true },
    thursday: { isOpen: true, is24Hours: true },
    friday: { isOpen: true, is24Hours: true },
    saturday: { isOpen: true, is24Hours: true },
    sunday: { isOpen: true, is24Hours: true },
  });
  
  // Settings
  const [isActive, setIsActive] = useState(true);
  const [allowReservations, setAllowReservations] = useState(true);
  const [requireMembership, setRequireMembership] = useState(false);
  
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
    loadStationData();
  }, [id]);

  const loadStationData = async () => {
    try {
      // TODO: Load from API
      // Mock data for demo
      const mockStationData = {
        name: 'PowerStation Downtown',
        description: 'Fast charging in the heart of the city with premium amenities.',
        address: '123 Main St, Downtown, City 12345',
        contactEmail: 'contact@powerstation.com',
        contactPhone: '+1234567890',
        latitude: '37.7849',
        longitude: '-122.4094',
        portConfigurations: [
          { type: 'CCS2' as ChargingPortType, count: 4, maxPower: 150, pricing: 0.35 },
          { type: 'Type2' as ChargingPortType, count: 4, maxPower: 22, pricing: 0.25 }
        ],
        baseRate: '0.35',
        peakRate: '0.45',
        offPeakRate: '0.28',
        amenities: ['restroom', 'wifi', 'restaurant', 'parking'],
        isActive: true,
        allowReservations: true,
        requireMembership: false
      };

      setStationName(mockStationData.name);
      setDescription(mockStationData.description);
      setAddress(mockStationData.address);
      setContactEmail(mockStationData.contactEmail);
      setContactPhone(mockStationData.contactPhone);
      setLatitude(mockStationData.latitude);
      setLongitude(mockStationData.longitude);
      setPortConfigurations(mockStationData.portConfigurations);
      setBaseRate(mockStationData.baseRate);
      setPeakRate(mockStationData.peakRate);
      setOffPeakRate(mockStationData.offPeakRate);
      setSelectedAmenities(mockStationData.amenities);
      setIsActive(mockStationData.isActive);
      setAllowReservations(mockStationData.allowReservations);
      setRequireMembership(mockStationData.requireMembership);

    } catch (error) {
      console.error('Error loading station data:', error);
      Alert.alert('Error', 'Failed to load station data');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleOperatingHoursChange = (
    day: string, 
    field: keyof OperatingHours, 
    value: any
  ) => {
    setOperatingHours({
      ...operatingHours,
      [day]: { ...operatingHours[day], [field]: value }
    });
  };

  const handleDeleteStation = () => {
    Alert.alert(
      'Delete Station',
      'Are you sure you want to delete this station? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Delete station via API
            Alert.alert(
              'Station Deleted',
              'The station has been successfully deleted.',
              [{ text: 'OK', onPress: () => router.back() }]
            );
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
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // TODO: Update station via API
      console.log('Updating station:', id);

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
        <Text style={styles.loadingText}>Loading station data...</Text>
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
          <Text style={[styles.saveButton, isSubmitting && styles.disabledButton]}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Text>
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
    gap: 12,
  },
  inputColumn: {
    flex: 1,
  },
  addPortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addPortButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
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
    gap: 8,
  },
  portTypeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
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
    gap: 12,
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
    gap: 6,
  },
  selectedAmenityButton: {
    backgroundColor: '#007AFF',
  },
  amenityButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
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
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
