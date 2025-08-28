import { ChargingPortType } from '../types';

// Charging Port Types Configuration
export const CHARGING_PORT_TYPES: Record<ChargingPortType, {
  name: string;
  icon: string;
  maxPower: number;
  description: string;
}> = {
  'Type1': {
    name: 'Type 1 (J1772)',
    icon: 'ev-station',
    maxPower: 22,
    description: 'Standard AC charging for North America'
  },
  'Type2': {
    name: 'Type 2 (Mennekes)',
    icon: 'ev-station',
    maxPower: 43,
    description: 'Standard AC charging for Europe'
  },
  'CCS1': {
    name: 'CCS1 (Combo 1)',
    icon: 'flash',
    maxPower: 350,
    description: 'Fast DC charging for North America'
  },
  'CCS2': {
    name: 'CCS2 (Combo 2)',
    icon: 'flash',
    maxPower: 350,
    description: 'Fast DC charging for Europe'
  },
  'CHAdeMO': {
    name: 'CHAdeMO',
    icon: 'flash',
    maxPower: 200,
    description: 'Fast DC charging (Japanese standard)'
  },
  'Tesla_Supercharger': {
    name: 'Tesla Supercharger',
    icon: 'flash',
    maxPower: 250,
    description: 'Tesla proprietary fast charging'
  },
  'GB/T_AC': {
    name: 'GB/T AC',
    icon: 'ev-station',
    maxPower: 22,
    description: 'Chinese AC charging standard'
  },
  'GB/T_DC': {
    name: 'GB/T DC',
    icon: 'flash',
    maxPower: 200,
    description: 'Chinese DC fast charging standard'
  }
};

// Common amenities at charging stations
export const STATION_AMENITIES = [
  { id: 'restroom', name: 'Restroom', icon: 'wc' },
  { id: 'restaurant', name: 'Restaurant', icon: 'restaurant' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-cart' },
  { id: 'wifi', name: 'Free WiFi', icon: 'wifi' },
  { id: 'parking', name: 'Free Parking', icon: 'local-parking' },
  { id: 'covered', name: 'Covered Parking', icon: 'garage' },
  { id: 'accessible', name: 'Wheelchair Accessible', icon: 'accessible' },
  { id: 'security', name: '24/7 Security', icon: 'security' },
  { id: 'lounge', name: 'Waiting Lounge', icon: 'weekend' },
  { id: 'kids_area', name: 'Kids Play Area', icon: 'child-care' },
  { id: 'car_wash', name: 'Car Wash', icon: 'local-car-wash' },
  { id: 'convenience_store', name: 'Convenience Store', icon: 'store' },
  { id: 'atm', name: 'ATM', icon: 'account-balance' },
  { id: 'hotel', name: 'Hotel Nearby', icon: 'hotel' },
  { id: 'pharmacy', name: 'Pharmacy', icon: 'local-pharmacy' }
];

// Popular EV makes and models
export const POPULAR_EV_MODELS = {
  'Tesla': [
    'Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'
  ],
  'Nissan': [
    'Leaf', 'Ariya'
  ],
  'Chevrolet': [
    'Bolt EV', 'Bolt EUV'
  ],
  'BMW': [
    'i3', 'i4', 'iX', 'i7'
  ],
  'Audi': [
    'e-tron', 'e-tron GT', 'Q4 e-tron'
  ],
  'Mercedes-Benz': [
    'EQS', 'EQE', 'EQC', 'EQB', 'EQA'
  ],
  'Hyundai': [
    'IONIQ 5', 'IONIQ 6', 'Kona Electric'
  ],
  'Kia': [
    'EV6', 'Niro EV', 'Soul EV'
  ],
  'Ford': [
    'Mustang Mach-E', 'F-150 Lightning'
  ],
  'Volkswagen': [
    'ID.4', 'ID.3', 'ID.Buzz'
  ],
  'Porsche': [
    'Taycan', 'Taycan Cross Turismo'
  ],
  'Lucid': [
    'Air Dream', 'Air Touring', 'Air Pure'
  ],
  'Rivian': [
    'R1T', 'R1S'
  ]
};

// Charging speed categories
export const CHARGING_SPEEDS = {
  'Level 1': {
    power: '1.4-1.9 kW',
    description: 'Standard household outlet',
    timeFor100km: '8-12 hours',
    type: 'AC'
  },
  'Level 2': {
    power: '3.7-22 kW',
    description: 'Home/workplace charging',
    timeFor100km: '2-6 hours',
    type: 'AC'
  },
  'DC Fast': {
    power: '25-350 kW',
    description: 'Public fast charging',
    timeFor100km: '15-45 minutes',
    type: 'DC'
  }
};

// Default preferences for new users
export const DEFAULT_PREFERENCES = {
  maxDistance: 50, // km
  preferredAmenities: ['restroom', 'wifi'],
  priceRange: { min: 0, max: 1.5 }, // per kWh
  notificationPreferences: {
    chargingReminders: true,
    lowBatteryAlerts: true,
    chargingCompleted: true,
    stationRecommendations: true,
    promotions: false,
    emailNotifications: true,
    pushNotifications: true
  }
};

// App configuration
export const APP_CONFIG = {
  APP_NAME: 'SolarSync',
  VERSION: '1.0.0',
  MIN_BATTERY_WARNING: 20, // percentage
  LOW_BATTERY_WARNING: 30, // percentage
  DEFAULT_MAP_RADIUS: 25, // km
  MAX_SEARCH_RADIUS: 200, // km
  RESERVATION_ADVANCE_DAYS: 7, // days
  SESSION_TIMEOUT: 30, // minutes
  API_TIMEOUT: 10000, // ms
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in ms
  LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds
  BACKGROUND_LOCATION_INTERVAL: 60000 // 1 minute
};

// Status colors
export const STATUS_COLORS = {
  available: '#4CAF50',
  occupied: '#FF9800',
  offline: '#F44336',
  maintenance: '#9E9E9E',
  reserved: '#2196F3'
};

// Battery level colors
export const BATTERY_COLORS = {
  high: '#4CAF50', // >70%
  medium: '#FF9800', // 30-70%
  low: '#F44336', // <30%
  critical: '#D32F2F' // <10%
};

// Rating colors
export const RATING_COLORS = {
  excellent: '#4CAF50', // 4.5-5
  good: '#8BC34A', // 3.5-4.4
  average: '#FF9800', // 2.5-3.4
  poor: '#FF5722', // 1.5-2.4
  terrible: '#F44336' // 0-1.4
};

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  businessLicense: /^[A-Z0-9]{6,20}$/,
  vehicleVIN: /^[A-HJ-NPR-Z0-9]{17}$/
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  USER_NOT_FOUND: 'User not found.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  LOCATION_PERMISSION_DENIED: 'Location permission is required to find nearby stations.',
  LOCATION_UNAVAILABLE: 'Unable to get your current location.',
  CHARGING_SESSION_FAILED: 'Failed to start charging session.',
  RESERVATION_FAILED: 'Failed to create reservation.',
  PAYMENT_FAILED: 'Payment processing failed.',
  UPLOAD_FAILED: 'File upload failed.',
  INVALID_INPUT: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unknown error occurred.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  REGISTRATION_SUCCESS: 'Registration successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  VEHICLE_ADDED: 'Vehicle added successfully!',
  STATION_ADDED: 'Charging station added successfully!',
  RESERVATION_CREATED: 'Reservation created successfully!',
  REVIEW_SUBMITTED: 'Review submitted successfully!',
  PAYMENT_SUCCESS: 'Payment processed successfully!',
  UPLOAD_SUCCESS: 'File uploaded successfully!'
};

// Notification types
export const NOTIFICATION_TYPES = {
  CHARGING_COMPLETE: 'charging_complete',
  LOW_BATTERY: 'low_battery',
  RESERVATION_REMINDER: 'reservation_reminder',
  STATION_AVAILABLE: 'station_available',
  PROMOTION: 'promotion',
  SYSTEM_UPDATE: 'system_update'
};

// Map configuration
export const MAP_CONFIG = {
  INITIAL_REGION: {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  ANIMATION_DURATION: 500,
  CLUSTER_RADIUS: 50,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18
};
