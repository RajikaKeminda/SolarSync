import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatEnergy, formatPrice, getRelativeTime } from '../../utils/helpers';

export default function SessionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch latest session data
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  // Mock session data
  const mockSessions = [
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe',
      userPhone: '+1234567890',
      stationId: '1',
      stationName: 'PowerStation Downtown',
      portType: 'CCS2',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      energyDelivered: 45.2,
      cost: 15.82,
      status: 'completed' as const,
      vehicleInfo: 'Tesla Model 3',
      paymentStatus: 'paid',
      rating: 5
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Jane Smith',
      userPhone: '+1234567891',
      stationId: '2',
      stationName: 'GreenCharge Mall',
      portType: 'Type2',
      startTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      endTime: null,
      energyDelivered: 23.7,
      cost: 8.30,
      status: 'active' as const,
      vehicleInfo: 'BMW i3',
      paymentStatus: 'pending',
      rating: null
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Mike Johnson',
      userPhone: '+1234567892',
      stationId: '1',
      stationName: 'PowerStation Downtown',
      portType: 'CCS2',
      startTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      endTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      energyDelivered: 67.8,
      cost: 23.73,
      status: 'completed' as const,
      vehicleInfo: 'Audi e-tron',
      paymentStatus: 'paid',
      rating: 4
    },
    {
      id: '4',
      userId: 'user4',
      userName: 'Sarah Wilson',
      userPhone: '+1234567893',
      stationId: '3',
      stationName: 'FastCharge Highway',
      portType: 'CHAdeMO',
      startTime: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      endTime: new Date(Date.now() - 7 * 60 * 60 * 1000), // 7 hours ago
      energyDelivered: 0,
      cost: 0,
      status: 'cancelled' as const,
      vehicleInfo: 'Nissan Leaf',
      paymentStatus: 'refunded',
      rating: null
    }
  ];

  const filteredSessions = mockSessions.filter(session => {
    if (selectedFilter === 'all') return true;
    return session.status === selectedFilter;
  });

  const handleSessionAction = (sessionId: string, action: 'stop' | 'support') => {
    if (action === 'stop') {
      Alert.alert(
        'Stop Session',
        'Are you sure you want to stop this charging session?',
        [
          { text: 'Cancel' },
          { text: 'Stop', style: 'destructive', onPress: () => console.log(`Stopping session ${sessionId}`) }
        ]
      );
    } else {
      Alert.alert('Support', 'Contacting customer support...');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#007AFF';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'refunded': return '#9E9E9E';
      case 'failed': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <Text style={styles.noRating}>No rating</Text>;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={12}
          color={i <= rating ? '#FFB800' : '#E0E0E0'}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const FilterButton = ({ filter, title, count }: { filter: typeof selectedFilter, title: string, count: number }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.activeFilterButton
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.activeFilterButtonText
      ]}>
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Charging Sessions</Text>
        <TouchableOpacity onPress={() => router.push('/business/analytics')}>
          <Ionicons name="analytics-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton 
            filter="all" 
            title="All" 
            count={mockSessions.length} 
          />
          <FilterButton 
            filter="active" 
            title="Active" 
            count={mockSessions.filter(s => s.status === 'active').length} 
          />
          <FilterButton 
            filter="completed" 
            title="Completed" 
            count={mockSessions.filter(s => s.status === 'completed').length} 
          />
          <FilterButton 
            filter="cancelled" 
            title="Cancelled" 
            count={mockSessions.filter(s => s.status === 'cancelled').length} 
          />
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionId}>Session #{session.id}</Text>
                  <View style={styles.sessionStatus}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(session.status) }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(session.status) }
                    ]}>
                      {getStatusText(session.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.sessionActions}>
                  {session.status === 'active' && (
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={() => handleSessionAction(session.id, 'stop')}
                    >
                      <Ionicons name="stop-circle" size={20} color="#F44336" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.actionIcon}
                    onPress={() => handleSessionAction(session.id, 'support')}
                  >
                    <Ionicons name="help-circle-outline" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.customerInfo}>
                <View style={styles.customerDetails}>
                  <Text style={styles.customerName}>{session.userName}</Text>
                  <Text style={styles.customerPhone}>{session.userPhone}</Text>
                  <Text style={styles.vehicleInfo}>{session.vehicleInfo}</Text>
                </View>
                
                <View style={styles.stationDetails}>
                  <Text style={styles.stationName}>{session.stationName}</Text>
                  <Text style={styles.portType}>{session.portType}</Text>
                </View>
              </View>

              <View style={styles.sessionStats}>
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>Started</Text>
                  <Text style={styles.statValue}>
                    {getRelativeTime(session.startTime)}
                  </Text>
                </View>
                
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>Duration</Text>
                  <Text style={styles.statValue}>
                    {session.endTime ? 
                      `${Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60))}m` :
                      `${Math.round((Date.now() - session.startTime.getTime()) / (1000 * 60))}m`
                    }
                  </Text>
                </View>
                
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>Energy</Text>
                  <Text style={styles.statValue}>
                    {formatEnergy(session.energyDelivered)}
                  </Text>
                </View>
                
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>Revenue</Text>
                  <Text style={styles.statValue}>
                    {formatPrice(session.cost)}
                  </Text>
                </View>
              </View>

              <View style={styles.sessionFooter}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>Payment:</Text>
                  <Text style={[
                    styles.paymentStatus,
                    { color: getPaymentStatusColor(session.paymentStatus) }
                  ]}>
                    {session.paymentStatus.charAt(0).toUpperCase() + session.paymentStatus.slice(1)}
                  </Text>
                </View>
                
                <View style={styles.ratingInfo}>
                  <Text style={styles.ratingLabel}>Rating:</Text>
                  {renderStars(session.rating)}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="flash-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No Sessions Found</Text>
            <Text style={styles.emptyText}>
              No charging sessions match the selected filter.
            </Text>
          </View>
        )}

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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  stationDetails: {
    alignItems: 'flex-end',
  },
  stationName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  portType: {
    fontSize: 10,
    color: '#666',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#666',
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingLabel: {
    fontSize: 12,
    color: '#666',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  noRating: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
