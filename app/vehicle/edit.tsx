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
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiService } from '../../services/api';
import { useAuthStore, useVehicleStore } from '../../store';
import { ChargingPortType, Vehicle } from '../../types';
import { CHARGING_PORT_TYPES, POPULAR_EV_MODELS } from '../../utils/constants';

export default function EditVehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { vehicleId } = useLocalSearchParams();
  const { user, token } = useAuthStore();
  const { vehicles, updateVehicle, setSelectedVehicle } = useVehicleStore();
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');
  const [estimatedRange, setEstimatedRange] = useState('');
  const [currentBatteryLevel, setCurrentBatteryLevel] = useState('85');
  const [selectedPortTypes, setSelectedPortTypes] = useState<ChargingPortType[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find vehicle from store or fetch from API
  useEffect(() => {
    const findVehicle = async () => {
      if (!vehicleId || !token) return;
      
      try {
        setLoading(true);
        
        // First try to find in local store
        const localVehicle = vehicles.find(v => v.id === vehicleId);
        if (localVehicle) {
          setVehicle(localVehicle);
          populateForm(localVehicle);
        } else {
          // If not found locally, we could fetch from API
          // For now, show error since we don't have a getVehicleById API
          Alert.alert('Error', 'Vehicle not found');
          router.back();
        }
      } catch (error) {
        console.error('Error loading vehicle:', error);
        Alert.alert('Error', 'Failed to load vehicle details');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    findVehicle();
  }, [vehicleId, token, vehicles, router]);

  const populateForm = (vehicleData: Vehicle) => {
    setMake(vehicleData.make);
    setModel(vehicleData.model);
    setYear(vehicleData.year.toString());
    setBatteryCapacity(vehicleData.batteryCapacity.toString());
    setEstimatedRange(vehicleData.estimatedRange.toString());
    setCurrentBatteryLevel(vehicleData.currentBatteryLevel?.toString() || '85');
    setSelectedPortTypes(vehicleData.chargingPortType);
    setIsDefault(vehicleData.isDefault);
  };

  const handlePortTypeToggle = (portType: ChargingPortType) => {
    if (selectedPortTypes.includes(portType)) {
      setSelectedPortTypes(selectedPortTypes.filter(p => p !== portType));
    } else {
      setSelectedPortTypes([...selectedPortTypes, portType]);
    }
  };

  const handleMakeSelect = (selectedMake: string) => {
    setMake(selectedMake);
    setModel(''); // Reset model when make changes
  };

  const handleSave = async () => {
    if (!user || !vehicle) {
      Alert.alert('Error', 'User or vehicle information is missing');
      return;
    }

    // Validation
    if (!make.trim() || !model.trim() || !year.trim()) {
      Alert.alert('Missing Information', 'Please fill in make, model, and year');
      return;
    }

    if (!batteryCapacity.trim() || !estimatedRange.trim()) {
      Alert.alert('Missing Information', 'Please enter battery capacity and range');
      return;
    }

    if (selectedPortTypes.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one charging port type');
      return;
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2010 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Invalid Year', 'Please enter a valid year');
      return;
    }

    const capacityNum = parseFloat(batteryCapacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      Alert.alert('Invalid Battery Capacity', 'Please enter a valid battery capacity');
      return;
    }

    const rangeNum = parseInt(estimatedRange);
    if (isNaN(rangeNum) || rangeNum <= 0) {
      Alert.alert('Invalid Range', 'Please enter a valid range');
      return;
    }

    const batteryLevelNum = parseFloat(currentBatteryLevel);
    if (isNaN(batteryLevelNum) || batteryLevelNum < 0 || batteryLevelNum > 100) {
      Alert.alert('Invalid Battery Level', 'Please enter a valid battery level (0-100)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create vehicle data for API update
      const vehicleData: Partial<Vehicle> = {
        make: make.trim(),
        model: model.trim(),
        year: yearNum,
        batteryCapacity: capacityNum,
        chargingPortType: selectedPortTypes,
        estimatedRange: rangeNum,
        currentBatteryLevel: batteryLevelNum,
        isDefault,
      };

      console.log('Updating vehicle:', vehicleData);

      // Submit to API
      const response = await apiService.updateVehicle(vehicle.id, vehicleData);

      if (response.success && response.data) {
        // Update local store
        updateVehicle(vehicle.id, response.data);
        
        // Update selected vehicle if it's the one being edited
        if (vehicle.isDefault) {
          setSelectedVehicle(response.data);
        }
        
        Alert.alert(
          'Vehicle Updated',
          `${make} ${model} has been successfully updated.`,
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          response.error || 'Failed to update vehicle. Please try again.'
        );
      }

    } catch (error) {
      console.error('Error updating vehicle:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Vehicle</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading vehicle details...</Text>
        </View>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Vehicle</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loadingContent}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Vehicle not found</Text>
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
        <Text style={styles.headerTitle}>Edit Vehicle</Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={isSubmitting}
          style={isSubmitting ? styles.disabledSaveButton : undefined}
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
        {/* Vehicle Make */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Make</Text>
          
          <View style={styles.makeGrid}>
            {Object.keys(POPULAR_EV_MODELS).map((makeName) => (
              <TouchableOpacity
                key={makeName}
                style={[
                  styles.makeButton,
                  make === makeName && styles.selectedMakeButton
                ]}
                onPress={() => handleMakeSelect(makeName)}
              >
                <Text style={[
                  styles.makeButtonText,
                  make === makeName && styles.selectedMakeButtonText
                ]}>
                  {makeName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Make Input */}
          <View style={styles.customInput}>
            <Text style={styles.customInputLabel}>Or enter custom make:</Text>
            <TextInput
              style={styles.textInput}
              value={make}
              onChangeText={setMake}
              placeholder="Enter vehicle make"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Vehicle Model */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Model</Text>
          
          {make && POPULAR_EV_MODELS[make] ? (
            <View style={styles.modelGrid}>
              {POPULAR_EV_MODELS[make].map((modelName) => (
                <TouchableOpacity
                  key={modelName}
                  style={[
                    styles.modelButton,
                    model === modelName && styles.selectedModelButton
                  ]}
                  onPress={() => setModel(modelName)}
                >
                  <Text style={[
                    styles.modelButtonText,
                    model === modelName && styles.selectedModelButtonText
                  ]}>
                    {modelName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <TextInput
            style={styles.textInput}
            value={model}
            onChangeText={setModel}
            placeholder="Enter vehicle model"
            placeholderTextColor="#999"
          />
        </View>

        {/* Year and Battery Capacity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Year & Battery</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>Year</Text>
              <TextInput
                style={styles.textInput}
                value={year}
                onChangeText={setYear}
                placeholder="2024"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
            
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>Battery Capacity (kWh)</Text>
              <TextInput
                style={styles.textInput}
                value={batteryCapacity}
                onChangeText={setBatteryCapacity}
                placeholder="75"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Range and Current Battery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Range & Current Level</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>Estimated Range (km)</Text>
              <TextInput
                style={styles.textInput}
                value={estimatedRange}
                onChangeText={setEstimatedRange}
                placeholder="400"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>Current Battery Level (%)</Text>
              <TextInput
                style={styles.textInput}
                value={currentBatteryLevel}
                onChangeText={setCurrentBatteryLevel}
                placeholder="85"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>
        </View>

        {/* Charging Port Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charging Port Types</Text>
          <Text style={styles.sectionSubtitle}>Select all compatible port types</Text>
          
          <View style={styles.portGrid}>
            {Object.keys(CHARGING_PORT_TYPES).map((portType) => (
              <TouchableOpacity
                key={portType}
                style={[
                  styles.portButton,
                  selectedPortTypes.includes(portType as ChargingPortType) && styles.selectedPortButton
                ]}
                onPress={() => handlePortTypeToggle(portType as ChargingPortType)}
              >
                <Text style={[
                  styles.portButtonText,
                  selectedPortTypes.includes(portType as ChargingPortType) && styles.selectedPortButtonText
                ]}>
                  {portType}
                </Text>
                <Text style={[
                  styles.portButtonSubtext,
                  selectedPortTypes.includes(portType as ChargingPortType) && styles.selectedPortButtonSubtext
                ]}>
                  {CHARGING_PORT_TYPES[portType as ChargingPortType].description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Default Vehicle */}
        <View style={styles.section}>
          <View style={styles.defaultSection}>
            <View style={styles.defaultInfo}>
              <Text style={styles.defaultTitle}>Set as Default Vehicle</Text>
              <Text style={styles.defaultSubtitle}>
                This vehicle will be pre-selected for charging sessions
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isDefault && styles.toggleButtonActive
              ]}
              onPress={() => setIsDefault(!isDefault)}
            >
              <View style={[
                styles.toggleCircle,
                isDefault && styles.toggleCircleActive
              ]} />
            </TouchableOpacity>
          </View>
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
  disabledSaveButton: {
    opacity: 0.5,
  },
  disabledSaveButtonText: {
    color: '#999',
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingButtonText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  makeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  makeButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedMakeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  makeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedMakeButtonText: {
    color: '#fff',
  },
  customInput: {
    marginTop: 8,
  },
  customInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modelButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedModelButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modelButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  selectedModelButtonText: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  portGrid: {
    gap: 12,
  },
  portButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  selectedPortButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  portButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedPortButtonText: {
    color: '#fff',
  },
  portButtonSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  selectedPortButtonSubtext: {
    color: '#E0E0E0',
  },
  defaultSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  defaultInfo: {
    flex: 1,
    marginRight: 16,
  },
  defaultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  defaultSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
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
