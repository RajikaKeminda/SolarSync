import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChargingStore, useVehicleStore } from '../../store';
import { ChargingPortType, Reservation } from '../../types';
import {
    calculateChargingCost,
    calculateChargingTime,
    formatPrice,
    generateId
} from '../../utils/helpers';

export default function BookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stationId } = useLocalSearchParams();
  const { vehicles, selectedVehicle, setSelectedVehicle } = useVehicleStore();
  const { addReservation } = useChargingStore();
  
  const [selectedPortType, setSelectedPortType] = useState<ChargingPortType>('CCS2');
  const [targetBatteryLevel, setTargetBatteryLevel] = useState(80);
  const [scheduledTime, setScheduledTime] = useState('now');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('09:00');
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [sendReminder, setSendReminder] = useState(true);

  // Mock station data
  const mockStation = {
    id: stationId as string,
    name: 'PowerStation Downtown',
    address: '123 Main St, Downtown',
    pricing: { baseRate: 0.35, currency: 'USD' },
    portTypes: [
      { type: 'CCS2' as ChargingPortType, maxPower: 150, available: 2 },
      { type: 'Type2' as ChargingPortType, maxPower: 22, available: 1 }
    ]
  };

  const currentVehicle = selectedVehicle || vehicles[0];
  const currentBatteryLevel = currentVehicle?.currentBatteryLevel || 25;
  const selectedPort = mockStation.portTypes.find(p => p.type === selectedPortType);
  
  const estimatedDuration = currentVehicle && selectedPort ? 
    calculateChargingTime(currentBatteryLevel, targetBatteryLevel, currentVehicle.batteryCapacity, selectedPort.maxPower) : 0;
  
  const estimatedCost = currentVehicle ? 
    calculateChargingCost(currentBatteryLevel, targetBatteryLevel, currentVehicle.batteryCapacity, mockStation.pricing.baseRate) : 0;

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  const batteryLevels = [50, 60, 70, 80, 90, 100];

  const handleBooking = () => {
    if (!currentVehicle) {
      Alert.alert('Error', 'Please select a vehicle');
      return;
    }

    const reservation: Reservation = {
      id: generateId(),
      userId: 'current-user',
      stationId: mockStation.id,
      vehicleId: currentVehicle.id,
      scheduledStartTime: scheduledTime === 'now' ? new Date() : 
        new Date(`${selectedDate.toDateString()} ${selectedTimeSlot}`),
      estimatedDuration: Math.round(estimatedDuration),
      status: 'confirmed',
      specialRequests: undefined,
      createdAt: new Date()
    };

    addReservation(reservation);

    Alert.alert(
      'Booking Confirmed!',
      `Your charging session has been ${scheduledTime === 'now' ? 'started' : 'booked'} successfully.`,
      [
        {
          text: 'OK',
          onPress: () => {
            router.back();
            if (scheduledTime === 'now') {
              router.push('/charging');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Charging</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Station Info */}
        <View style={styles.stationCard}>
          <Text style={styles.stationName}>{mockStation.name}</Text>
          <Text style={styles.stationAddress}>{mockStation.address}</Text>
        </View>

        {/* Vehicle Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Vehicle</Text>
          
          {vehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                selectedVehicle?.id === vehicle.id && styles.selectedVehicleCard
              ]}
              onPress={() => setSelectedVehicle(vehicle)}
            >
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>
                  {vehicle.make} {vehicle.model}
                </Text>
                <Text style={styles.vehicleDetails}>
                  {vehicle.batteryCapacity} kWh • {vehicle.currentBatteryLevel || 25}% charged
                </Text>
              </View>
              
              {selectedVehicle?.id === vehicle.id && (
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Port Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charging Port</Text>
          
          {mockStation.portTypes.map((port) => (
            <TouchableOpacity
              key={port.type}
              style={[
                styles.portCard,
                selectedPortType === port.type && styles.selectedPortCard
              ]}
              onPress={() => setSelectedPortType(port.type)}
            >
              <View style={styles.portInfo}>
                <View style={styles.portHeader}>
                  <Text style={styles.portType}>{port.type}</Text>
                  <Text style={styles.portPower}>{port.maxPower} kW</Text>
                </View>
                <Text style={styles.portAvailability}>
                  {port.available} available
                </Text>
              </View>
              
              {selectedPortType === port.type && (
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Target Battery Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Battery Level</Text>
          
          <View style={styles.batteryGrid}>
            {batteryLevels.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.batteryButton,
                  targetBatteryLevel === level && styles.selectedBatteryButton
                ]}
                onPress={() => setTargetBatteryLevel(level)}
              >
                <Text style={[
                  styles.batteryButtonText,
                  targetBatteryLevel === level && styles.selectedBatteryButtonText
                ]}>
                  {level}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.batteryInfo}>
            <Text style={styles.batteryInfoText}>
              Current: {currentBatteryLevel}% → Target: {targetBatteryLevel}%
            </Text>
            <Text style={styles.batteryInfoText}>
              Energy needed: {((targetBatteryLevel - currentBatteryLevel) / 100 * (currentVehicle?.batteryCapacity || 0)).toFixed(1)} kWh
            </Text>
          </View>
        </View>

        {/* Timing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When to Charge</Text>
          
          <View style={styles.timingOptions}>
            <TouchableOpacity
              style={[
                styles.timingButton,
                scheduledTime === 'now' && styles.selectedTimingButton
              ]}
              onPress={() => setScheduledTime('now')}
            >
              <Ionicons 
                name="flash" 
                size={20} 
                color={scheduledTime === 'now' ? '#fff' : '#007AFF'} 
              />
              <Text style={[
                styles.timingButtonText,
                scheduledTime === 'now' && styles.selectedTimingButtonText
              ]}>
                Start Now
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timingButton,
                scheduledTime === 'later' && styles.selectedTimingButton
              ]}
              onPress={() => setScheduledTime('later')}
            >
              <Ionicons 
                name="calendar" 
                size={20} 
                color={scheduledTime === 'later' ? '#fff' : '#007AFF'} 
              />
              <Text style={[
                styles.timingButtonText,
                scheduledTime === 'later' && styles.selectedTimingButtonText
              ]}>
                Schedule Later
              </Text>
            </TouchableOpacity>
          </View>

          {scheduledTime === 'later' && (
            <View style={styles.schedulingOptions}>
              <Text style={styles.scheduleLabel}>Select Time Slot</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.timeSlotScroll}
              >
                {timeSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      selectedTimeSlot === time && styles.selectedTimeSlot
                    ]}
                    onPress={() => setSelectedTimeSlot(time)}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      selectedTimeSlot === time && styles.selectedTimeSlotText
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Add to Calendar</Text>
                <Text style={styles.preferenceSubtitle}>
                  Get a calendar reminder for your charging session
                </Text>
              </View>
              <Switch
                value={addToCalendar}
                onValueChange={setAddToCalendar}
                trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Send Reminder</Text>
                <Text style={styles.preferenceSubtitle}>
                  Get notified 15 minutes before your session
                </Text>
              </View>
              <Switch
                value={sendReminder}
                onValueChange={setSendReminder}
                trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Duration</Text>
              <Text style={styles.summaryValue}>
                {Math.round(estimatedDuration)} minutes
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Cost</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(estimatedCost)}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(mockStation.pricing.baseRate)}/kWh
              </Text>
            </View>
            
            {scheduledTime === 'later' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Scheduled Time</Text>
                <Text style={styles.summaryValue}>
                  {selectedDate.toDateString()} at {selectedTimeSlot}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
          <Text style={styles.bookButtonText}>
            {scheduledTime === 'now' ? 'Start Charging Now' : 'Confirm Booking'}
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
  stationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedVehicleCard: {
    borderColor: '#007AFF',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#666',
  },
  portCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPortCard: {
    borderColor: '#007AFF',
  },
  portInfo: {
    flex: 1,
  },
  portHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  batteryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  batteryButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    minWidth: 60,
    alignItems: 'center',
  },
  selectedBatteryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  batteryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedBatteryButtonText: {
    color: '#fff',
  },
  batteryInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  batteryInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  timingOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    gap: 8,
  },
  selectedTimingButton: {
    backgroundColor: '#007AFF',
  },
  timingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  selectedTimingButtonText: {
    color: '#fff',
  },
  schedulingOptions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  scheduleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  timeSlotScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  timeSlot: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedTimeSlot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  preferenceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  preferenceSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
