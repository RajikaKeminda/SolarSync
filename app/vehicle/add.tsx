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

import { apiService } from '../../services/api';
import { useAuthStore, useVehicleStore } from '../../store';
import { ChargingPortType, Vehicle } from '../../types';
import { CHARGING_PORT_TYPES, POPULAR_EV_MODELS } from '../../utils/constants';

export default function AddVehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { addVehicle, vehicles } = useVehicleStore();
  
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');
  const [estimatedRange, setEstimatedRange] = useState('');
  const [currentBatteryLevel, setCurrentBatteryLevel] = useState('85');
  const [selectedPortTypes, setSelectedPortTypes] = useState<ChargingPortType[]>([]);
  const [isDefault, setIsDefault] = useState(vehicles.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to add a vehicle');
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
      // Create vehicle data for API (excluding fields that will be set by the API)
      const vehicleData: Omit<Vehicle, 'id' | 'createdAt'> = {
        make: make.trim(),
        model: model.trim(),
        year: yearNum,
        batteryCapacity: capacityNum,
        chargingPortType: selectedPortTypes,
        estimatedRange: rangeNum,
        currentBatteryLevel: batteryLevelNum,
        isDefault,
        ownerId: user.id,
      };

      console.log('Creating new vehicle:', vehicleData);

      // Submit to API
      const response = await apiService.addVehicle(vehicleData);

      if (response.success && response.data) {
        // Add to local store
        addVehicle(response.data);

        Alert.alert(
          'Vehicle Added',
          `${make} ${model} has been successfully added to your profile.`,
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
          response.error || 'Failed to add vehicle. Please try again.'
        );
      }

    } catch (error) {
      console.error('Error adding vehicle:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Vehicle</Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={isSubmitting}
          style={isSubmitting ? styles.disabledSaveButton : undefined}
        >
          <Text style={[styles.saveButton, isSubmitting && styles.disabledSaveButtonText]}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Text>
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
              style={styles.input}
              placeholder="Enter vehicle make"
              value={make}
              onChangeText={setMake}
            />
          </View>
        </View>

        {/* Vehicle Model */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Model</Text>
          
          {make && POPULAR_EV_MODELS[make as keyof typeof POPULAR_EV_MODELS] && (
            <View style={styles.modelGrid}>
              {POPULAR_EV_MODELS[make as keyof typeof POPULAR_EV_MODELS].map((modelName) => (
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
          )}

          <View style={styles.customInput}>
            <Text style={styles.customInputLabel}>
              {make && POPULAR_EV_MODELS[make as keyof typeof POPULAR_EV_MODELS] ? 
                'Or enter custom model:' : 'Enter vehicle model:'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter vehicle model"
              value={model}
              onChangeText={setModel}
            />
          </View>
        </View>

        {/* Vehicle Year */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Year</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter year (e.g., 2023)"
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>

        {/* Battery Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Battery Specifications</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Battery Capacity (kWh)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 75"
                value={batteryCapacity}
                onChangeText={setBatteryCapacity}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Range (km)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 400"
                value={estimatedRange}
                onChangeText={setEstimatedRange}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Current Battery Level (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 85"
              value={currentBatteryLevel}
              onChangeText={setCurrentBatteryLevel}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </View>

        {/* Charging Port Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charging Port Types</Text>
          <Text style={styles.sectionSubtitle}>
            Select all port types your vehicle supports
          </Text>
          
          <View style={styles.portTypesGrid}>
            {Object.entries(CHARGING_PORT_TYPES).map(([portType, config]) => (
              <TouchableOpacity
                key={portType}
                style={[
                  styles.portTypeButton,
                  selectedPortTypes.includes(portType as ChargingPortType) && styles.selectedPortTypeButton
                ]}
                onPress={() => handlePortTypeToggle(portType as ChargingPortType)}
              >
                <View style={styles.portTypeHeader}>
                  <Ionicons 
                    name={config.icon as any} 
                    size={20} 
                    color={selectedPortTypes.includes(portType as ChargingPortType) ? '#fff' : '#007AFF'} 
                  />
                  <Text style={[
                    styles.portTypeName,
                    selectedPortTypes.includes(portType as ChargingPortType) && styles.selectedPortTypeName
                  ]}>
                    {config.name}
                  </Text>
                </View>
                <Text style={[
                  styles.portTypeDescription,
                  selectedPortTypes.includes(portType as ChargingPortType) && styles.selectedPortTypeDescription
                ]}>
                  {config.description}
                </Text>
                <Text style={[
                  styles.portTypePower,
                  selectedPortTypes.includes(portType as ChargingPortType) && styles.selectedPortTypePower
                ]}>
                  Max: {config.maxPower} kW
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Default Vehicle */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.defaultOption}
            onPress={() => setIsDefault(!isDefault)}
          >
            <View style={styles.defaultInfo}>
              <Text style={styles.defaultTitle}>Set as Default Vehicle</Text>
              <Text style={styles.defaultSubtitle}>
                Use this vehicle for trip planning and recommendations
              </Text>
            </View>
            <View style={[styles.checkbox, isDefault && styles.checkedCheckbox]}>
              {isDefault && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
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
    marginBottom: 8,
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
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modelButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
  customInput: {
    marginTop: 8,
  },
  customInputLabel: {
    fontSize: 14,
    color: '#666',
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
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputColumn: {
    flex: 1,
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
  portTypesGrid: {
    gap: 12,
  },
  portTypeButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedPortTypeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  portTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  portTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedPortTypeName: {
    color: '#fff',
  },
  portTypeDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectedPortTypeDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  portTypePower: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  selectedPortTypePower: {
    color: '#fff',
  },
  defaultOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defaultInfo: {
    flex: 1,
  },
  defaultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  defaultSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  disabledSaveButton: {
    opacity: 0.5,
  },
  disabledSaveButtonText: {
    color: '#999',
  },
});
