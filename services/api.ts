import {
    AITripSuggestion,
    Analytics,
    ChargingSession,
    ChargingStation,
    Location,
    Reservation,
    Review,
    TripPlan,
    User,
    Vehicle
} from '../types';

// Base API configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication APIs
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: 'ev_owner' | 'station_owner';
    phoneNumber?: string;
    businessName?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  // User Profile APIs
  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.request('/user/profile');
  }

  async updateUserProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async uploadProfileImage(imageUri: string): Promise<ApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    return this.request('/user/profile/image', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Vehicle APIs
  async getVehicles(): Promise<ApiResponse<Vehicle[]>> {
    return this.request('/vehicles');
  }

  async addVehicle(vehicle: Omit<Vehicle, 'id' | 'ownerId' | 'createdAt'>): Promise<ApiResponse<Vehicle>> {
    return this.request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    return this.request(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteVehicle(id: string): Promise<ApiResponse<void>> {
    return this.request(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  // Charging Station APIs
  async getNearbyStations(
    location: Location, 
    radius: number = 50
  ): Promise<ApiResponse<ChargingStation[]>> {
    const params = new URLSearchParams({
      lat: location.latitude.toString(),
      lng: location.longitude.toString(),
      radius: radius.toString(),
    });
    return this.request(`/stations/nearby?${params}`);
  }

  async getStationById(id: string): Promise<ApiResponse<ChargingStation>> {
    return this.request(`/stations/${id}`);
  }

  async searchStations(query: {
    search?: string;
    location?: Location;
    portTypes?: string[];
    amenities?: string[];
    maxDistance?: number;
    priceRange?: { min: number; max: number };
    rating?: number;
  }): Promise<ApiResponse<ChargingStation[]>> {
    return this.request('/stations/search', {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }

  async addStation(station: Omit<ChargingStation, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ChargingStation>> {
    return this.request('/stations', {
      method: 'POST',
      body: JSON.stringify(station),
    });
  }

  async updateStation(id: string, updates: Partial<ChargingStation>): Promise<ApiResponse<ChargingStation>> {
    return this.request(`/stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteStation(id: string): Promise<ApiResponse<void>> {
    return this.request(`/stations/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyStations(): Promise<ApiResponse<ChargingStation[]>> {
    return this.request('/stations/my-stations');
  }

  // Charging Session APIs
  async getChargingSessions(): Promise<ApiResponse<ChargingSession[]>> {
    return this.request('/charging/sessions');
  }

  async startChargingSession(data: {
    stationId: string;
    vehicleId: string;
    reservationId?: string;
  }): Promise<ApiResponse<ChargingSession>> {
    return this.request('/charging/sessions/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async stopChargingSession(sessionId: string): Promise<ApiResponse<ChargingSession>> {
    return this.request(`/charging/sessions/${sessionId}/stop`, {
      method: 'POST',
    });
  }

  async getActiveSession(): Promise<ApiResponse<ChargingSession | null>> {
    return this.request('/charging/sessions/active');
  }

  // Reservation APIs
  async getReservations(): Promise<ApiResponse<Reservation[]>> {
    return this.request('/reservations');
  }

  async createReservation(data: {
    stationId: string;
    vehicleId: string;
    scheduledStartTime: Date;
    estimatedDuration: number;
    specialRequests?: string;
  }): Promise<ApiResponse<Reservation>> {
    return this.request('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelReservation(id: string): Promise<ApiResponse<void>> {
    return this.request(`/reservations/${id}/cancel`, {
      method: 'POST',
    });
  }

  async updateReservation(id: string, updates: Partial<Reservation>): Promise<ApiResponse<Reservation>> {
    return this.request(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Review APIs
  async getStationReviews(stationId: string): Promise<ApiResponse<Review[]>> {
    return this.request(`/stations/${stationId}/reviews`);
  }

  async addReview(review: {
    stationId: string;
    rating: number;
    comment?: string;
    images?: string[];
  }): Promise<ApiResponse<Review>> {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<ApiResponse<Review>> {
    return this.request(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteReview(id: string): Promise<ApiResponse<void>> {
    return this.request(`/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics APIs
  async getAnalytics(): Promise<ApiResponse<Analytics>> {
    return this.request('/analytics');
  }

  async getMonthlyReport(month: string): Promise<ApiResponse<any>> {
    return this.request(`/analytics/monthly/${month}`);
  }

  // AI APIs
  async getAITripSuggestions(data: {
    tripDescription: string;
    startLocation: Location;
    endLocation?: Location;
    vehicleId: string;
    preferences?: any;
  }): Promise<ApiResponse<AITripSuggestion>> {
    return this.request('/ai/trip-suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStationRecommendations(vehicleId: string): Promise<ApiResponse<ChargingStation[]>> {
    return this.request(`/ai/recommendations/${vehicleId}`);
  }

  async optimizeRoute(data: {
    startLocation: Location;
    endLocation: Location;
    vehicleId: string;
    currentBatteryLevel: number;
  }): Promise<ApiResponse<TripPlan>> {
    return this.request('/ai/optimize-route', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notification APIs
  async updateNotificationSettings(settings: any): Promise<ApiResponse<void>> {
    return this.request('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async sendTestNotification(): Promise<ApiResponse<void>> {
    return this.request('/notifications/test', {
      method: 'POST',
    });
  }

  // Payment APIs
  async getPaymentMethods(): Promise<ApiResponse<any[]>> {
    return this.request('/payments/methods');
  }

  async addPaymentMethod(method: any): Promise<ApiResponse<any>> {
    return this.request('/payments/methods', {
      method: 'POST',
      body: JSON.stringify(method),
    });
  }

  async processPayment(data: {
    sessionId: string;
    paymentMethodId: string;
    amount: number;
  }): Promise<ApiResponse<any>> {
    return this.request('/payments/process', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Upload APIs
  async uploadImage(imageUri: string, type: 'station' | 'review' | 'profile'): Promise<ApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `${type}.jpg`,
    } as any);
    formData.append('type', type);

    return this.request('/upload/image', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
