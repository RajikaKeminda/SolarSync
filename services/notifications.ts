import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
}

export interface ScheduledNotificationData extends NotificationData {
  trigger: Notifications.NotificationTriggerInput;
}

class NotificationService {
  private hasPermission = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'SolarSync Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('charging', {
          name: 'Charging Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4CAF50',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('reservations', {
          name: 'Reservation Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF9800',
          sound: 'default',
        });
      }

      this.hasPermission = true;
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async getExpoPushToken(): Promise<string | null> {
    try {
      if (!this.hasPermission) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || 'your-project-id'
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async sendLocalNotification(data: NotificationData): Promise<string | null> {
    try {
      if (!this.hasPermission) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data || {},
          sound: data.sound !== false ? 'default' : undefined,
          badge: data.badge,
        },
        trigger: null, // Show immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      return null;
    }
  }

  async scheduleNotification(data: ScheduledNotificationData): Promise<string | null> {
    try {
      if (!this.hasPermission) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data || {},
          sound: data.sound !== false ? 'default' : undefined,
          badge: data.badge,
        },
        trigger: data.trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Specific notification types for SolarSync

  async notifyChargingComplete(stationName: string, energyDelivered: number, cost: number): Promise<void> {
    await this.sendLocalNotification({
      title: 'Charging Complete! ⚡',
      body: `Your vehicle is fully charged at ${stationName}. ${energyDelivered.toFixed(1)} kWh delivered for $${cost.toFixed(2)}.`,
      data: {
        type: 'charging_complete',
        stationName,
        energyDelivered,
        cost,
      },
    });
  }

  async notifyLowBattery(batteryLevel: number, nearestStationName?: string): Promise<void> {
    const body = nearestStationName 
      ? `Your battery is at ${batteryLevel}%. ${nearestStationName} is nearby.`
      : `Your battery is at ${batteryLevel}%. Consider finding a charging station.`;

    await this.sendLocalNotification({
      title: 'Low Battery Warning 🔋',
      body,
      data: {
        type: 'low_battery',
        batteryLevel,
        nearestStationName,
      },
    });
  }

  async notifyReservationReminder(stationName: string, startTime: Date): Promise<void> {
    await this.sendLocalNotification({
      title: 'Charging Reservation Reminder 📅',
      body: `Your charging session at ${stationName} starts in 15 minutes.`,
      data: {
        type: 'reservation_reminder',
        stationName,
        startTime: startTime.toISOString(),
      },
    });
  }

  async scheduleReservationReminder(
    stationName: string, 
    startTime: Date, 
    reminderMinutes: number = 15
  ): Promise<string | null> {
    const reminderTime = new Date(startTime.getTime() - reminderMinutes * 60 * 1000);
    
    if (reminderTime <= new Date()) {
      // If reminder time is in the past, don't schedule
      return null;
    }

    return await this.scheduleNotification({
      title: 'Charging Reservation Reminder 📅',
      body: `Your charging session at ${stationName} starts in ${reminderMinutes} minutes.`,
      data: {
        type: 'reservation_reminder',
        stationName,
        startTime: startTime.toISOString(),
      },
      trigger: {
        date: reminderTime,
      },
    });
  }

  async notifyStationAvailable(stationName: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Charging Station Available! 🎉',
      body: `${stationName} now has available charging ports.`,
      data: {
        type: 'station_available',
        stationName,
      },
    });
  }

  async notifyChargingError(stationName: string, errorMessage: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Charging Issue ⚠️',
      body: `There's an issue with your charging session at ${stationName}. ${errorMessage}`,
      data: {
        type: 'charging_error',
        stationName,
        errorMessage,
      },
    });
  }

  async notifyPromotion(title: string, description: string, stationName?: string): Promise<void> {
    await this.sendLocalNotification({
      title: `${title} 🎁`,
      body: description,
      data: {
        type: 'promotion',
        stationName,
      },
    });
  }

  async notifyWeatherAlert(message: string, impact: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Weather Alert 🌦️',
      body: `${message} ${impact}`,
      data: {
        type: 'weather_alert',
        message,
        impact,
      },
    });
  }

  async notifyMaintenanceAlert(stationName: string, startTime: Date, endTime: Date): Promise<void> {
    await this.sendLocalNotification({
      title: 'Maintenance Alert 🔧',
      body: `${stationName} will be under maintenance from ${startTime.toLocaleTimeString()} to ${endTime.toLocaleTimeString()}.`,
      data: {
        type: 'maintenance_alert',
        stationName,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    });
  }

  // Utility methods

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  // Notification listener setup
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ) {
    if (onNotificationReceived) {
      Notifications.addNotificationReceivedListener(onNotificationReceived);
    }

    if (onNotificationResponse) {
      Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
    }
  }
}

// Create and export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
