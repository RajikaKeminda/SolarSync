import { ChargingPortType, ChargingStation, Location, Vehicle } from '../types';
import { BATTERY_COLORS, CHARGING_PORT_TYPES, RATING_COLORS } from './constants';

// Distance calculation using Haversine formula
export const calculateDistance = (
  point1: Location,
  point2: Location
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
    Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Format distance for display
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

// Format duration in minutes to human readable format
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

// Format price
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

// Format energy in kWh
export const formatEnergy = (kwh: number): string => {
  if (kwh < 1) {
    return `${Math.round(kwh * 1000)}Wh`;
  }
  return `${kwh.toFixed(1)} kWh`;
};

// Format power in kW
export const formatPower = (kw: number): string => {
  return `${kw.toFixed(1)} kW`;
};

// Get battery level color
export const getBatteryColor = (level: number): string => {
  if (level > 70) return BATTERY_COLORS.high;
  if (level > 30) return BATTERY_COLORS.medium;
  if (level > 10) return BATTERY_COLORS.low;
  return BATTERY_COLORS.critical;
};

// Get rating color
export const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return RATING_COLORS.excellent;
  if (rating >= 3.5) return RATING_COLORS.good;
  if (rating >= 2.5) return RATING_COLORS.average;
  if (rating >= 1.5) return RATING_COLORS.poor;
  return RATING_COLORS.terrible;
};

// Calculate estimated charging time
export const calculateChargingTime = (
  currentLevel: number,
  targetLevel: number,
  batteryCapacity: number,
  chargingPower: number
): number => {
  console.log('currentLevel', currentLevel);
  console.log('targetLevel', targetLevel);
  console.log('batteryCapacity', batteryCapacity);
  console.log('chargingPower', chargingPower);
  const energyNeeded = ((targetLevel - currentLevel) / 100) * batteryCapacity;
  return (energyNeeded / chargingPower) * 60; // Convert to minutes
};

// Calculate estimated cost
export const calculateChargingCost = (
  currentLevel: number,
  targetLevel: number,
  batteryCapacity: number,
  pricePerKwh: number
): number => {
  const energyNeeded = ((targetLevel - currentLevel) / 100) * batteryCapacity;
  return energyNeeded * pricePerKwh;
};

// Check if vehicle is compatible with station
export const isVehicleCompatible = (
  vehicle: Vehicle,
  station: ChargingStation
): boolean => {
  const vehiclePorts = vehicle.chargingPortType;
  const stationPorts = station.portTypes.map(port => port.type);
  
  return vehiclePorts.some(vehiclePort => 
    stationPorts.includes(vehiclePort)
  );
};

// Get compatible charging ports between vehicle and station
export const getCompatiblePorts = (
  vehicle: Vehicle,
  station: ChargingStation
): ChargingPortType[] => {
  const vehiclePorts = vehicle.chargingPortType;
  const stationPorts = station.portTypes.map(port => port.type);
  
  return vehiclePorts.filter(vehiclePort => 
    stationPorts.includes(vehiclePort)
  );
};

// Get maximum charging power for vehicle at station
export const getMaxChargingPower = (
  vehicle: Vehicle,
  station: ChargingStation
): number => {
  const compatiblePorts = getCompatiblePorts(vehicle, station);
  
  if (compatiblePorts.length === 0) return 0;
  
  const maxPowers = compatiblePorts.map(portType => {
    const stationPort = station.portTypes.find(p => p.type === portType);
    return stationPort?.maxPower || 0;
  });
  
  return Math.max(...maxPowers);
};

// Format date and time
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Format date only
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Format time only
export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let lastCallTime = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallTime >= delay) {
      lastCallTime = now;
      func(...args);
    }
  };
};

// Sort stations by distance
export const sortStationsByDistance = (
  stations: ChargingStation[],
  userLocation: Location
): ChargingStation[] => {
  return stations
    .map(station => ({
      ...station,
      distance: calculateDistance(userLocation, {
        latitude: station.latitude,
        longitude: station.longitude
      })
    }))
    .sort((a, b) => a.distance - b.distance);
};

// Filter stations by compatibility
export const filterCompatibleStations = (
  stations: ChargingStation[],
  vehicle: Vehicle
): ChargingStation[] => {
  return stations.filter(station => isVehicleCompatible(vehicle, station));
};

// Get charging port display name
export const getPortDisplayName = (portType: ChargingPortType): string => {
  return CHARGING_PORT_TYPES[portType]?.name || portType;
};

// Get charging port icon
export const getPortIcon = (portType: ChargingPortType): string => {
  return CHARGING_PORT_TYPES[portType]?.icon || 'ev-station';
};

// Calculate estimated range
export const calculateEstimatedRange = (
  batteryLevel: number,
  vehicleRange: number
): number => {
  return (batteryLevel / 100) * vehicleRange;
};

// Check if station is open
export const isStationOpen = (station: ChargingStation): boolean => {
  const now = new Date();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof station.operatingHours;
  const currentTime = now.toTimeString().slice(0, 5); // HH:mm format

  const todayHours = station.operatingHours[dayOfWeek];
  if (!todayHours.isOpen) return false;
  if (todayHours.is24Hours) return true;
  
  const openTime = todayHours.openTime || '00:00';
  const closeTime = todayHours.closeTime || '23:59';
  
  return currentTime >= openTime && currentTime <= closeTime;
};

// Get station status
export const getStationStatus = (station: ChargingStation): {
  status: 'available' | 'busy' | 'full' | 'offline';
  message: string;
} => {
  if (!station.isActive) {
    return { status: 'offline', message: 'Station offline' };
  }
  
  if (!isStationOpen(station)) {
    return { status: 'offline', message: 'Station closed' };
  }
  
  const availabilityRatio = station.availablePorts / station.totalPorts;
  
  if (availabilityRatio === 0) {
    return { status: 'full', message: 'All ports occupied' };
  }
  
  if (availabilityRatio < 0.3) {
    return { status: 'busy', message: `${station.availablePorts} of ${station.totalPorts} available` };
  }
  
  return { status: 'available', message: `${station.availablePorts} ports available` };
};

// Calculate carbon savings
export const calculateCarbonSavings = (
  energyConsumed: number, // kWh
  gridCarbonIntensity: number = 0.5 // kg CO2 per kWh (average)
): number => {
  const evEmissions = energyConsumed * gridCarbonIntensity;
  const gasolineEmissions = energyConsumed * 33.7 * 0.31; // Approximate gasoline equivalent emissions
  return Math.max(0, gasolineEmissions - evEmissions);
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

// Capitalize first letter
export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Convert 24-hour to 12-hour format
export const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Get time until next hour
export const getTimeUntilNextHour = (): number => {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  return nextHour.getTime() - now.getTime();
};
