import { apiService } from './api';

export interface RealTimeUpdate {
  type: 'charging_session' | 'reservation' | 'notification' | 'station_status';
  action: 'created' | 'updated' | 'deleted' | 'status_changed';
  data: any;
  timestamp: Date;
}

class RealTimeService {
  private listeners: Map<string, ((update: RealTimeUpdate) => void)[]> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastUpdateTime: Date = new Date();
  private isPolling: boolean = false;

  // Start polling for updates
  startPolling(userId?: string, ownerId?: string, interval: number = 30000) {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollingInterval = setInterval(async () => {
      await this.checkForUpdates(userId, ownerId);
    }, interval);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
  }

  // Check for updates
  private async checkForUpdates(userId?: string, ownerId?: string) {
    try {
      const now = new Date();
      
      // Check for new notifications
      if (userId) {
        const notificationsResponse = await apiService.getNotifications(userId, 5, 0);
        if (notificationsResponse.success && notificationsResponse.data) {
          const newNotifications = notificationsResponse.data.filter(
            (notification: any) => new Date(notification.createdAt) > this.lastUpdateTime
          );

          newNotifications.forEach((notification: any) => {
            this.notifyListeners('notification', {
              type: 'notification',
              action: 'created',
              data: notification,
              timestamp: new Date(notification.createdAt)
            });
          });
        }
      }

      // Check for charging session updates
      if (userId || ownerId) {
        const activeSessionsResponse = await apiService.getDashboardActiveSessions(userId, ownerId);
        if (activeSessionsResponse.success && activeSessionsResponse.data) {
          activeSessionsResponse.data.forEach((session: any) => {
            if (new Date(session.updatedAt) > this.lastUpdateTime) {
              this.notifyListeners('charging_session', {
                type: 'charging_session',
                action: 'updated',
                data: session,
                timestamp: new Date(session.updatedAt)
              });
            }
          });
        }
      }

      this.lastUpdateTime = now;
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  // Subscribe to updates
  subscribe(type: string, callback: (update: RealTimeUpdate) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Notify listeners
  private notifyListeners(type: string, update: RealTimeUpdate) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(callback => callback(update));
    }

    // Also notify 'all' listeners
    const allCallbacks = this.listeners.get('all');
    if (allCallbacks) {
      allCallbacks.forEach(callback => callback(update));
    }
  }

  // Manual update trigger
  triggerUpdate(type: string, action: string, data: any) {
    this.notifyListeners(type, {
      type: type as any,
      action: action as any,
      data,
      timestamp: new Date()
    });
  }

  // Get current status
  getStatus() {
    return {
      isPolling: this.isPolling,
      lastUpdateTime: this.lastUpdateTime,
      listenerCount: Array.from(this.listeners.values()).reduce((total, callbacks) => total + callbacks.length, 0)
    };
  }
}

// Create and export singleton instance
export const realTimeService = new RealTimeService();
export default realTimeService;

