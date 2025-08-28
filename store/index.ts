import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  Analytics,
  ChargingSession,
  ChargingStation,
  Location,
  Reservation,
  SearchFilters,
  User,
  Vehicle
} from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

interface LocationState {
  currentLocation: Location | null;
  setCurrentLocation: (location: Location) => void;
}

interface VehicleState {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  setVehicles: (vehicles: Vehicle[]) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
}

interface StationState {
  nearbyStations: ChargingStation[];
  favoriteStations: ChargingStation[];
  searchFilters: SearchFilters;
  setNearbyStations: (stations: ChargingStation[]) => void;
  addToFavorites: (station: ChargingStation) => void;
  removeFromFavorites: (stationId: string) => void;
  updateSearchFilters: (filters: Partial<SearchFilters>) => void;
  resetSearchFilters: () => void;
}

interface ChargingState {
  activeSessions: ChargingSession[];
  chargingHistory: ChargingSession[];
  upcomingReservations: Reservation[];
  setActiveSessions: (sessions: ChargingSession[]) => void;
  addChargingSession: (session: ChargingSession) => void;
  updateChargingSession: (id: string, updates: Partial<ChargingSession>) => void;
  setChargingHistory: (history: ChargingSession[]) => void;
  addReservation: (reservation: Reservation) => void;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  cancelReservation: (id: string) => void;
}

interface AnalyticsState {
  analytics: Analytics | null;
  setAnalytics: (analytics: Analytics) => void;
  updateAnalytics: (updates: Partial<Analytics>) => void;
}

// Default search filters
const defaultSearchFilters: SearchFilters = {
  portTypes: [],
  maxDistance: 50,
  amenities: [],
  priceRange: { min: 0, max: 100 },
  rating: 0,
  availability: 'available'
};

// Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      setAuth: (user, token) => set({ isAuthenticated: true, user, token, isLoading: false }),
      clearAuth: () => set({ isAuthenticated: false, user: null, token: null, isLoading: false }),
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
      setLoading: (loading) => set({ isLoading: loading }),
      logout: async () => {
        // Clear all persisted data
        await AsyncStorage.removeItem('auth-storage');
        await AsyncStorage.removeItem('vehicle-storage');
        await AsyncStorage.removeItem('charging-storage');
        await AsyncStorage.removeItem('analytics-storage');
        set({ isAuthenticated: false, user: null, token: null, isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Location Store
export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  setCurrentLocation: (location) => set({ currentLocation: location }),
}));

// Vehicle Store
export const useVehicleStore = create<VehicleState>()(
  persist(
    (set, get) => ({
      vehicles: [],
      selectedVehicle: null,
      setVehicles: (vehicles) => set({ vehicles }),
      addVehicle: (vehicle) => {
        const vehicles = get().vehicles;
        set({ vehicles: [...vehicles, vehicle] });
      },
      updateVehicle: (id, updates) => {
        const vehicles = get().vehicles.map(v => 
          v.id === id ? { ...v, ...updates } : v
        );
        set({ vehicles });
        
        // Update selected vehicle if it's the one being updated
        const selectedVehicle = get().selectedVehicle;
        if (selectedVehicle?.id === id) {
          set({ selectedVehicle: { ...selectedVehicle, ...updates } });
        }
      },
      deleteVehicle: (id) => {
        const vehicles = get().vehicles.filter(v => v.id !== id);
        set({ vehicles });
        
        // Clear selected vehicle if it's the one being deleted
        const selectedVehicle = get().selectedVehicle;
        if (selectedVehicle?.id === id) {
          set({ selectedVehicle: null });
        }
      },
      setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
    }),
    {
      name: 'vehicle-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Station Store
export const useStationStore = create<StationState>()(
  persist(
    (set, get) => ({
      nearbyStations: [],
      favoriteStations: [],
      searchFilters: defaultSearchFilters,
      setNearbyStations: (stations) => set({ nearbyStations: stations }),
      addToFavorites: (station) => {
        const favorites = get().favoriteStations;
        if (!favorites.find(s => s.id === station.id)) {
          set({ favoriteStations: [...favorites, station] });
        }
      },
      removeFromFavorites: (stationId) => {
        const favorites = get().favoriteStations.filter(s => s.id !== stationId);
        set({ favoriteStations: favorites });
      },
      updateSearchFilters: (filters) => {
        const currentFilters = get().searchFilters;
        set({ searchFilters: { ...currentFilters, ...filters } });
      },
      resetSearchFilters: () => set({ searchFilters: defaultSearchFilters }),
    }),
    {
      name: 'station-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        favoriteStations: state.favoriteStations,
        searchFilters: state.searchFilters 
      }),
    }
  )
);

// Charging Store
export const useChargingStore = create<ChargingState>()(
  persist(
    (set, get) => ({
      activeSessions: [],
      chargingHistory: [],
      upcomingReservations: [],
      setActiveSessions: (sessions) => set({ activeSessions: sessions }),
      addChargingSession: (session) => {
        const activeSessions = get().activeSessions;
        set({ activeSessions: [...activeSessions, session] });
      },
      updateChargingSession: (id, updates) => {
        const activeSessions = get().activeSessions.map(s => 
          s.id === id ? { ...s, ...updates } : s
        );
        set({ activeSessions });
        
        // If session is completed, move to history
        const updatedSession = activeSessions.find(s => s.id === id);
        if (updatedSession?.status === 'completed') {
          const history = get().chargingHistory;
          set({ 
            chargingHistory: [...history, updatedSession],
            activeSessions: activeSessions.filter(s => s.id !== id)
          });
        }
      },
      setChargingHistory: (history) => set({ chargingHistory: history }),
      addReservation: (reservation) => {
        const reservations = get().upcomingReservations;
        set({ upcomingReservations: [...reservations, reservation] });
      },
      updateReservation: (id, updates) => {
        const reservations = get().upcomingReservations.map(r => 
          r.id === id ? { ...r, ...updates } : r
        );
        set({ upcomingReservations: reservations });
      },
      cancelReservation: (id) => {
        const reservations = get().upcomingReservations.map(r => 
          r.id === id ? { ...r, status: 'cancelled' as const } : r
        );
        set({ upcomingReservations: reservations });
      },
    }),
    {
      name: 'charging-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Analytics Store
export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      analytics: null,
      setAnalytics: (analytics) => set({ analytics }),
      updateAnalytics: (updates) => {
        const currentAnalytics = get().analytics;
        if (currentAnalytics) {
          set({ analytics: { ...currentAnalytics, ...updates } });
        }
      },
    }),
    {
      name: 'analytics-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
