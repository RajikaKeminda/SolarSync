export interface User {
  id: string;
  email: string;
  phone: string;
  isVerified: boolean;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userType: 'ev_owner' | 'station_owner';
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EVOwner extends User {
  userType: 'ev_owner';
  vehicles: Vehicle[];
  preferences: EVOwnerPreferences;
  chargingHistory: ChargingSession[];
}

export interface StationOwner extends User {
  userType: 'station_owner';
  businessName: string;
  businessLicense?: string;
  stations: ChargingStation[];
}

export interface Vehicle {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  batteryCapacity: number; // kWh
  chargingPortType: ChargingPortType[];
  estimatedRange: number; // km
  currentBatteryLevel?: number; // percentage
  isDefault: boolean;
  createdAt: Date;
}

export interface ChargingStation {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  totalPorts: number;
  availablePorts: number;
  portTypes: ChargingPortInfo[];
  pricing: PricingInfo;
  amenities: string[];
  operatingHours: OperatingHours;
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  images: string[];
  contactEmail?: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChargingPortInfo {
  type: ChargingPortType;
  count: number;
  maxPower: number; // kW
  available: number;
}

export interface PricingInfo {
  baseRate: number; // per kWh
  peakRate?: number;
  offPeakRate?: number;
  membershipDiscount?: number;
  currency: string;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string; // HH:mm format
  closeTime?: string; // HH:mm format
  is24Hours?: boolean;
}

export interface ChargingSession {
  id: string;
  userId: string;
  vehicleId: string;
  stationId: string;
  startTime: Date;
  endTime?: Date;
  energyDelivered: number; // kWh
  cost: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  reservationId?: string;
}

export interface Reservation {
  id: string;
  userId: string;
  stationId: string;
  vehicleId: string;
  scheduledStartTime: Date;
  estimatedDuration: number; // minutes
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  specialRequests?: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  stationId: string;
  rating: number; // 1-5
  comment?: string;
  images?: string[];
  visitDate: Date;
  createdAt: Date;
  isVerified: boolean;
}

export interface EVOwnerPreferences {
  preferredChargingPorts: ChargingPortType[];
  maxDistance: number; // km
  preferredAmenities: string[];
  priceRange: {
    min: number;
    max: number;
  };
  notificationPreferences: NotificationPreferences;
}

export interface NotificationPreferences {
  chargingReminders: boolean;
  lowBatteryAlerts: boolean;
  chargingCompleted: boolean;
  stationRecommendations: boolean;
  promotions: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface TripPlan {
  id: string;
  userId: string;
  startLocation: Location;
  endLocation: Location;
  estimatedDistance: number; // km
  estimatedDuration: number; // minutes
  recommendedStations: ChargingStation[];
  vehicleId: string;
  createdAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

export interface Analytics {
  userId: string;
  totalChargingSessions: number;
  totalEnergyConsumed: number; // kWh
  totalCost: number;
  averageSessionDuration: number; // minutes
  favoriteStations: string[];
  monthlyStats: MonthlyStats[];
  carbonSavings: number; // kg CO2
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  sessionsCount: number;
  energyConsumed: number;
  totalCost: number;
  avgCostPerKwh: number;
}

export interface AITripSuggestion {
  tripDescription: string;
  suggestedRoute: Location[];
  recommendedStations: ChargingStation[];
  estimatedCost: number;
  estimatedTime: number;
  batteryOptimization: BatteryOptimization;
}

export interface BatteryOptimization {
  startingBatteryLevel: number;
  minimumBatteryLevel: number;
  chargingStops: ChargingStop[];
  arrivalBatteryLevel: number;
}

export interface ChargingStop {
  station: ChargingStation;
  arrivalBatteryLevel: number;
  targetBatteryLevel: number;
  chargingDuration: number; // minutes
  cost: number;
}

export type ChargingPortType = 
  | 'Type1' 
  | 'Type2' 
  | 'CCS1' 
  | 'CCS2' 
  | 'CHAdeMO' 
  | 'Tesla_Supercharger' 
  | 'GB/T_AC' 
  | 'GB/T_DC';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface AppState {
  auth: AuthState;
  currentLocation: Location | null;
  selectedVehicle: Vehicle | null;
  searchFilters: SearchFilters;
}

export interface SearchFilters {
  portTypes: ChargingPortType[];
  maxDistance: number;
  amenities: string[];
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  availability: 'available' | 'any';
}
