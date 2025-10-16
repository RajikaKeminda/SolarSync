import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useCallback, useEffect } from 'react';
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiService } from '../../services/api';
import { useAuthStore } from '../../store';
import { formatEnergy, formatPrice } from '../../utils/helpers';

const { width } = Dimensions.get('window');

export default function BusinessDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const [refreshing, setRefreshing] = useState(false);

  const [businessData, setBusinessData] = useState<any>(null);
  const [stationStatusData, setStationStatusData] = useState<any[]>([]);
  const [stationStatusLoading, setStationStatusLoading] = useState(false);

  const fetchBusinessData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await apiService.getDashboardData(undefined, user.id);
      if (response.success && response.data) {
        setBusinessData(response.data);
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  }, [user?.id]);

  const fetchStationStatus = useCallback(async () => {
    if (!user?.id) return;

    setStationStatusLoading(true);
    try {
      const response = await apiService.getStationStatus(user.id);
      if (response.success && response.data) {
        setStationStatusData(response.data);
      }
    } catch (error) {
      console.error('Error fetching station status:', error);
    } finally {
      setStationStatusLoading(false);
    }
  }, [user?.id]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchBusinessData(), fetchStationStatus()]);
    setRefreshing(false);
  }, [fetchBusinessData, fetchStationStatus]);

  // Load business data and station status
  useEffect(() => {
    fetchBusinessData();
    fetchStationStatus();
  }, [fetchBusinessData, fetchStationStatus]);

  // Mock data for business dashboard (fallback)
  const mockData = {
    totalStations: 3,
    totalSessions: 156,
    totalRevenue: 2847.65,
    monthlyRevenue: 896.23,
    activeChargingSessions: 8,
    averageSessionDuration: 42,
    topPerformingStation: 'PowerStation Downtown',
    recentSessions: [
      { id: '1', stationName: 'PowerStation Downtown', energy: 45.2, revenue: 15.82, duration: 38 },
      { id: '2', stationName: 'GreenCharge Mall', energy: 32.1, revenue: 8.99, duration: 28 },
      { id: '3', stationName: 'FastCharge Highway', energy: 67.8, revenue: 30.51, duration: 52 },
    ],
    monthlyStats: [
      { month: 'Jan', sessions: 42, revenue: 756.40 },
      { month: 'Feb', sessions: 38, revenue: 689.12 },
      { month: 'Mar', sessions: 51, revenue: 896.23 },
    ]
  };

  // Mock data for station status (fallback)
  const mockStationStatus = [
    {
      id: '1',
      name: 'PowerStation Downtown',
      status: 'online',
      availablePorts: 6,
      totalPorts: 8,
      activeSessions: 2,
      location: 'Downtown Area'
    },
    {
      id: '2',
      name: 'GreenCharge Mall',
      status: 'online',
      availablePorts: 10,
      totalPorts: 12,
      activeSessions: 2,
      location: 'Shopping Mall'
    },
    {
      id: '3',
      name: 'FastCharge Highway',
      status: 'maintenance',
      availablePorts: 0,
      totalPorts: 6,
      activeSessions: 0,
      location: 'Highway Exit 15'
    }
  ];

  const currentData = businessData || mockData;
  const currentStationStatus = stationStatusData.length > 0 ? stationStatusData : mockStationStatus;

  const StatCard = ({ icon, title, value, subtitle, color = '#007AFF', onPress }: {
    icon: string;
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'online':
        return { text: 'Online', color: '#4CAF50', dotColor: '#4CAF50' };
      case 'maintenance':
        return { text: 'Maintenance', color: '#FF9800', dotColor: '#FF9800' };
      case 'offline':
        return { text: 'Offline', color: '#F44336', dotColor: '#F44336' };
      default:
        return { text: 'Unknown', color: '#666', dotColor: '#666' };
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.businessName}>{user?.firstName}&apos;s Business</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Overview</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              icon="business"
              title="Total Stations"
              value={currentData.quickStats?.totalStations?.toString() || currentData.totalStations?.toString() || '0'}
              subtitle="Active locations"
              color="#007AFF"
              onPress={() => router.push('/business/stations')}
            />
            
            <StatCard
              icon="flash"
              title="Active Sessions"
              value={currentData.quickStats?.activeSessions?.toString() || currentData.activeChargingSessions?.toString() || '0'}
              subtitle="Currently charging"
              color="#4CAF50"
            />
            
            <StatCard
              icon="wallet"
              title="Monthly Revenue"
              value={formatPrice(currentData.quickStats?.totalRevenue || currentData.monthlyRevenue || 0)}
              subtitle="This month"
              color="#FF9800"
            />
            
            <StatCard
              icon="time"
              title="Avg. Duration"
              value={`${currentData.quickStats?.averageDuration || currentData.averageSessionDuration || 0}m`}
              subtitle="Per session"
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Revenue Summary */}
        <View style={styles.section}>
          <View style={styles.revenueCard}>
            <View style={styles.revenueHeader}>
              <View>
                <Text style={styles.revenueTitle}>Total Revenue</Text>
                <Text style={styles.revenueAmount}>
                  {formatPrice(currentData.quickStats?.totalRevenue || currentData.totalRevenue || 0)}
                </Text>
              </View>
              <View style={styles.revenueGrowth}>
                <Ionicons name="trending-up" size={20} color="#4CAF50" />
                <Text style={styles.growthText}>+12.5%</Text>
              </View>
            </View>
            
            <Text style={styles.revenueSubtitle}>
              From {currentData.quickStats?.totalSessions || currentData.totalSessions || 0} charging sessions
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/station/add')}
            >
              <Ionicons name="add-circle" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Add Station</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/business/analytics')}
            >
              <Ionicons name="analytics" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/business/sessions')}
            >
              <Ionicons name="list" size={24} color="#007AFF" />
              <Text style={styles.actionText}>All Sessions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/business/profile')}
            >
              <Ionicons name="settings" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            <TouchableOpacity onPress={() => router.push('/business/sessions')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {(currentData.recentSessions || mockData.recentSessions).map((session: any) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionStation}>{session.stationName}</Text>
                <Text style={styles.sessionRevenue}>
                  {formatPrice(session.revenue)}
                </Text>
              </View>
              
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionDetail}>
                  {formatEnergy(session.energy)} • {session.duration}min
                </Text>
                <View style={styles.sessionStatus}>
                  <View style={styles.completedDot} />
                  <Text style={styles.sessionStatusText}>Completed</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Performance Chart Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Trends</Text>
          <View style={styles.chartContainer}>
            <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
            <Text style={styles.chartPlaceholderText}>
              Revenue and usage charts will be displayed here
            </Text>
          </View>
        </View>

        {/* Station Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Station Status</Text>
            {stationStatusLoading && (
              <Text style={styles.loadingText}>Loading...</Text>
            )}
          </View>
          
          {currentStationStatus.map((station) => {
            const statusDisplay = getStatusDisplay(station.status);
            return (
              <TouchableOpacity 
                key={station.id} 
                style={styles.stationCard}
                onPress={() => router.push(`/station/edit?id=${station.id}`)}
              >
                <View style={styles.stationHeader}>
                  <Text style={styles.stationName}>{station.name}</Text>
                  <View style={styles.onlineStatus}>
                    <View style={[styles.onlineDot, { backgroundColor: statusDisplay.dotColor }]} />
                    <Text style={[styles.onlineText, { color: statusDisplay.color }]}>
                      {statusDisplay.text}
                    </Text>
                  </View>
                </View>
                <View style={styles.stationStats}>
                  <Text style={styles.stationStat}>
                    {station.availablePorts}/{station.totalPorts} ports available
                  </Text>
                  <Text style={styles.stationStat}>
                    {station.activeSessions} active sessions
                  </Text>
                </View>
                {station.location && (
                  <Text style={styles.stationLocation}>{station.location}</Text>
                )}
              </TouchableOpacity>
            );
          })}
          
          {currentStationStatus.length === 0 && !stationStatusLoading && (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No stations found</Text>
              <Text style={styles.emptyStateSubtext}>Add your first charging station to get started</Text>
            </View>
          )}
        </View>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
  },
  revenueCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  revenueTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  revenueGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  growthText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  revenueSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (width - 60) / 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionStation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sessionRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDetail: {
    fontSize: 14,
    color: '#666',
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedDot: {
    width: 6,
    height: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 3,
    marginRight: 6,
  },
  sessionStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
  stationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  maintenanceStatus: {},
  maintenanceDot: {
    backgroundColor: '#FF9800',
  },
  maintenanceText: {
    color: '#FF9800',
  },
  stationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stationStat: {
    fontSize: 12,
    color: '#666',
  },
  stationLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});
