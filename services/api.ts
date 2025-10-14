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
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://wealthy-doberman-newly.ngrok-free.app';

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
    return this.request(`/users/email/${email}`, {
      method: 'GET',
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
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({...userData, phone: userData.phoneNumber}),
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

  async getStationsByOwnerId(ownerId: string): Promise<ApiResponse<ChargingStation[]>> {
    return this.request(`/stations/owner/${ownerId}`);
  }

  async getStationById(id: string): Promise<ApiResponse<ChargingStation>> {
    return this.request(`/stations/${id}`);
  }


  async getAllStations(): Promise<ApiResponse<ChargingStation[]>> {
    return this.request('/stations');
  }

  async searchStations(query: string): Promise<ApiResponse<ChargingStation[]>> {
    return this.request(`/stations/search?q=${query}`);
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
    return this.request('/charging-sessions');
  }

  async startChargingSession(data: {
    userId: string;
    stationId: string;
    vehicleId: string;
    startTime: Date;
    energyDelivered: number;
    cost: number;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    reservationId?: string;
  }): Promise<ApiResponse<ChargingSession>> {
    return this.request('/charging-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChargingSessionById(sessionId: string): Promise<ApiResponse<ChargingSession>> {
    //response format
  //   {
  //     "success": true,
  //     "data": {
  //         "_id": "68eeb91131c2ce614788eb45",
  //         "userId": {
  //             "_id": "68ceeb088ac13d62d57cb026",
  //             "email": "rkeminda0@gmail.com",
  //             "firstName": "Rajika",
  //             "lastName": "Keminda",
  //             "id": "68ceeb088ac13d62d57cb026"
  //         },
  //         "vehicleId": {
  //             "_id": "68eeaa5073ef228ae22d7105",
  //             "make": "Tesla",
  //             "model": "Model 3",
  //             "year": 2024,
  //             "id": "68eeaa5073ef228ae22d7105"
  //         },
  //         "stationId": {
  //             "_id": "68ea8d6ca158e11a25720f34",
  //             "name": "cvbbh",
  //             "address": "fhh",
  //             "id": "68ea8d6ca158e11a25720f34"
  //         },
  //         "startTime": "2025-10-14T20:56:49.387Z",
  //         "endTime": null,
  //         "energyDelivered": 160,
  //         "cost": 56,
  //         "status": "active",
  //         "paymentStatus": "pending",
  //         "reservationId": {
  //             "_id": "68eeb90f31c2ce614788eb43",
  //             "scheduledStartTime": "2025-10-14T20:56:47.774Z",
  //             "estimatedDuration": 64,
  //             "id": "68eeb90f31c2ce614788eb43",
  //             "estimatedEndTime": "2025-10-14T22:00:47.774Z",
  //             "isActive": false,
  //             "isUpcoming": false
  //         },
  //         "createdAt": "2025-10-14T20:56:49.447Z",
  //         "updatedAt": "2025-10-14T20:56:49.447Z",
  //         "__v": 0,
  //         "id": "68eeb91131c2ce614788eb45",
  //         "duration": null,
  //         "isActive": true,
  //         "isCompleted": false,
  //         "costPerKwh": 0.35
  //     }
  // }
    return this.request(`/charging-sessions/${sessionId}`);
  }

  async stopChargingSession(sessionId: string): Promise<ApiResponse<ChargingSession>> {
    return this.request(`/charging-sessions/${sessionId}/end`, {
      method: 'PATCH',
    });
  }

  async getActiveSession(): Promise<ApiResponse<ChargingSession[] | null>> {
    return this.request('/charging-sessions/active');
  }

  // Reservation APIs
  async getReservations(): Promise<ApiResponse<Reservation[]>> {
    return this.request('/reservations');
  }

  async getReservationsByUserId(userId: string): Promise<ApiResponse<Reservation[]>> {
    return this.request(`/reservations/user/${userId}`);
  }

  async getReservationsByStationId(stationId: string): Promise<ApiResponse<Reservation[]>> {
    return this.request(`/reservations/station/${stationId}`);
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
    return this.request(`/reviews/station/${stationId}`);
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
