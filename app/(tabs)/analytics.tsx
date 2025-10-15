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
import { useAnalyticsStore, useVehicleStore, useAuthStore } from '../../store';
import { calculateCarbonSavings, formatEnergy, formatPrice } from '../../utils/helpers';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { analytics } = useAnalyticsStore();
  const { selectedVehicle } = useVehicleStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await apiService.getAnalytics(user.id, selectedPeriod);
      if (response.success && response.data) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, [user?.id, selectedPeriod]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }, [fetchAnalytics]);

  // Load analytics data
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Mock data for demonstration (fallback)
  const mockAnalytics = {
    totalChargingSessions: 24,
    totalEnergyConsumed: 156.7,
    totalCost: 89.45,
    averageSessionDuration: 45,
    carbonSavings: calculateCarbonSavings(156.7),
    monthlyStats: [
      { month: '2024-01', sessionsCount: 8, energyConsumed: 52.3, totalCost: 29.80, avgCostPerKwh: 0.57 },
      { month: '2024-02', sessionsCount: 9, energyConsumed: 58.1, totalCost: 33.15, avgCostPerKwh: 0.57 },
      { month: '2024-03', sessionsCount: 7, energyConsumed: 46.3, totalCost: 26.50, avgCostPerKwh: 0.57 },
    ],
    favoriteStations: ['PowerStation Downtown', 'GreenCharge Mall', 'FastCharge Highway']
  };

  const currentAnalytics = analyticsData || analytics || mockAnalytics;

  const StatCard = ({ icon, title, value, subtitle, color = '#007AFF' }: {
    icon: string;
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const ChartPlaceholder = ({ title, height = 200 }: { title: string; height?: number }) => (
    <View style={[styles.chartContainer, { height }]}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartPlaceholder}>
        <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
        <Text style={styles.chartPlaceholderText}>Chart visualization would go here</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Period Filter */}
      <View style={styles.periodContainer}>
        <View style={styles.periodFilter}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              icon="flash"
              title="Total Sessions"
              value={currentAnalytics.totalChargingSessions.toString()}
              subtitle="This month"
              color="#007AFF"
            />
            
            <StatCard
              icon="battery-charging"
              title="Energy Consumed"
              value={formatEnergy(currentAnalytics.totalEnergyConsumed)}
              subtitle="Total charged"
              color="#4CAF50"
            />
            
            <StatCard
              icon="wallet"
              title="Total Cost"
              value={formatPrice(currentAnalytics.totalCost)}
              subtitle="This month"
              color="#FF9800"
            />
            
            <StatCard
              icon="time"
              title="Avg. Duration"
              value={`${currentAnalytics.averageSessionDuration}m`}
              subtitle="Per session"
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Environmental Impact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environmental Impact</Text>
          
          <View style={styles.environmentCard}>
            <View style={styles.carbonSavingsContainer}>
              <Ionicons name="leaf" size={32} color="#4CAF50" />
              <View style={styles.carbonSavingsText}>
                <Text style={styles.carbonSavingsValue}>
                  {currentAnalytics.carbonSavings.toFixed(1)} kg
                </Text>
                <Text style={styles.carbonSavingsLabel}>CO₂ Saved</Text>
              </View>
            </View>
            
            <Text style={styles.environmentDescription}>
              By using electric charging instead of gasoline, you&apos;ve prevented{' '}
              {currentAnalytics.carbonSavings.toFixed(1)} kg of CO₂ emissions this month.
            </Text>
            
            <View style={styles.equivalentContainer}>
              <View style={styles.equivalent}>
                <Ionicons name="car" size={20} color="#666" />
                <Text style={styles.equivalentText}>
                  ≈ {(currentAnalytics.carbonSavings / 2.3).toFixed(0)} km avoided in gas car
                </Text>
              </View>
              
              <View style={styles.equivalent}>
                <Ionicons name="leaf" size={20} color="#666" />
                <Text style={styles.equivalentText}>
                  ≈ {(currentAnalytics.carbonSavings / 21.8).toFixed(1)} trees planted
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Energy Usage Chart */}
        <View style={styles.section}>
          <ChartPlaceholder title="Energy Usage Trend" />
        </View>

        {/* Cost Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Analysis</Text>
          
          <View style={styles.costAnalysisCard}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Average Cost per kWh</Text>
              <Text style={styles.costValue}>
                {formatPrice(currentAnalytics.totalCost / currentAnalytics.totalEnergyConsumed, 'USD')}
              </Text>
            </View>
            
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Monthly Budget</Text>
              <Text style={styles.costValue}>
                {formatPrice(currentAnalytics.totalCost)} / {formatPrice(150)}
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${(currentAnalytics.totalCost / 150) * 100}%` }
                ]}
              />
            </View>
            
            <Text style={styles.budgetNote}>
              You&apos;re {((currentAnalytics.totalCost / 150) * 100).toFixed(0)}% of your monthly budget
            </Text>
          </View>
        </View>

        {/* Charging Patterns */}
        <View style={styles.section}>
          <ChartPlaceholder title="Charging Patterns" height={180} />
        </View>

        {/* Favorite Stations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite Stations</Text>
          
          {currentAnalytics.favoriteStations.map((station: string, index: number) => (
            <View key={index} style={styles.favoriteStationCard}>
              <View style={styles.stationRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              
              <View style={styles.stationInfo}>
                <Text style={styles.stationName}>{station}</Text>
                <Text style={styles.stationUsage}>
                  {Math.floor(Math.random() * 5) + 3} visits this month
                </Text>
              </View>
              
              <TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Vehicle Efficiency */}
        {selectedVehicle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Efficiency</Text>
            
            <View style={styles.efficiencyCard}>
              <Text style={styles.vehicleName}>
                {selectedVehicle.make} {selectedVehicle.model}
              </Text>
              
              <View style={styles.efficiencyStats}>
                <View style={styles.efficiencyStat}>
                  <Text style={styles.efficiencyValue}>
                    {(currentAnalytics.totalEnergyConsumed / 1000 * 100).toFixed(1)} kWh/100km
                  </Text>
                  <Text style={styles.efficiencyLabel}>Energy Efficiency</Text>
                </View>
                
                <View style={styles.efficiencyStat}>
                  <Text style={styles.efficiencyValue}>
                    {(currentAnalytics.totalCost / 1000 * 100).toFixed(2)}$/100km
                  </Text>
                  <Text style={styles.efficiencyLabel}>Cost per 100km</Text>
                </View>
              </View>
            </View>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  periodContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  periodFilter: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
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
  environmentCard: {
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
  carbonSavingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  carbonSavingsText: {
    marginLeft: 16,
  },
  carbonSavingsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  carbonSavingsLabel: {
    fontSize: 14,
    color: '#666',
  },
  environmentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  equivalentContainer: {
    gap: 8,
  },
  equivalent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equivalentText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  chartContainer: {
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
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chartPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  costAnalysisCard: {
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
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  budgetNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  favoriteStationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
  stationRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rankNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stationUsage: {
    fontSize: 12,
    color: '#666',
  },
  efficiencyCard: {
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
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  efficiencyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  efficiencyStat: {
    alignItems: 'center',
  },
  efficiencyValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  efficiencyLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
