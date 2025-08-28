import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
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

import { formatEnergy, formatPrice } from '../../utils/helpers';

const { width } = Dimensions.get('window');

export default function BusinessAnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch latest analytics data
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  // Mock analytics data
  const mockAnalytics = {
    totalRevenue: 15689.45,
    totalSessions: 347,
    totalEnergy: 4521.7,
    averageSessionDuration: 38,
    peakHours: [18, 19, 20], // 6-8 PM
    topPerformingStation: 'PowerStation Downtown',
    customerSatisfaction: 4.6,
    growthRate: 12.5,
    monthlyData: [
      { month: 'Jan', revenue: 12450, sessions: 298, energy: 3876 },
      { month: 'Feb', revenue: 13890, sessions: 321, energy: 4123 },
      { month: 'Mar', revenue: 15689, sessions: 347, energy: 4522 },
    ],
    stationPerformance: [
      { name: 'PowerStation Downtown', revenue: 8945.20, sessions: 189, utilization: 78 },
      { name: 'GreenCharge Mall', revenue: 4532.10, sessions: 112, utilization: 65 },
      { name: 'FastCharge Highway', revenue: 2212.15, sessions: 46, utilization: 34 },
    ],
    peakHoursData: [
      { hour: '06:00', sessions: 12 },
      { hour: '07:00', sessions: 28 },
      { hour: '08:00', sessions: 45 },
      { hour: '09:00', sessions: 34 },
      { hour: '10:00', sessions: 22 },
      { hour: '11:00', sessions: 18 },
      { hour: '12:00', sessions: 31 },
      { hour: '13:00', sessions: 25 },
      { hour: '14:00', sessions: 19 },
      { hour: '15:00', sessions: 23 },
      { hour: '16:00', sessions: 38 },
      { hour: '17:00', sessions: 52 },
      { hour: '18:00', sessions: 67 },
      { hour: '19:00', sessions: 71 },
      { hour: '20:00', sessions: 63 },
      { hour: '21:00', sessions: 44 },
      { hour: '22:00', sessions: 32 },
      { hour: '23:00', sessions: 21 },
    ]
  };

  const PeriodButton = ({ period, title }: { period: typeof selectedPeriod, title: string }) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.activePeriodButton
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text style={[
        styles.periodButtonText,
        selectedPeriod === period && styles.activePeriodButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const MetricCard = ({ 
    icon, 
    title, 
    value, 
    subtitle, 
    trend, 
    color = '#007AFF' 
  }: {
    icon: string;
    title: string;
    value: string;
    subtitle?: string;
    trend?: number;
    color?: string;
  }) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        {trend !== undefined && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={trend >= 0 ? "trending-up" : "trending-down"} 
              size={16} 
              color={trend >= 0 ? "#4CAF50" : "#F44336"} 
            />
            <Text style={[
              styles.trendText,
              { color: trend >= 0 ? "#4CAF50" : "#F44336" }
            ]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Analytics</Text>
        <TouchableOpacity onPress={() => console.log('Export data')}>
          <Ionicons name="download-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodContainer}>
        <PeriodButton period="week" title="Week" />
        <PeriodButton period="month" title="Month" />
        <PeriodButton period="year" title="Year" />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Metrics</Text>
          
          <View style={styles.metricsGrid}>
            <MetricCard
              icon="wallet"
              title="Total Revenue"
              value={formatPrice(mockAnalytics.totalRevenue)}
              subtitle="This month"
              trend={mockAnalytics.growthRate}
              color="#4CAF50"
            />
            
            <MetricCard
              icon="flash"
              title="Total Sessions"
              value={mockAnalytics.totalSessions.toString()}
              subtitle="Charging sessions"
              trend={8.3}
              color="#007AFF"
            />
            
            <MetricCard
              icon="battery-charging"
              title="Energy Delivered"
              value={formatEnergy(mockAnalytics.totalEnergy)}
              subtitle="Total energy"
              trend={15.7}
              color="#FF9800"
            />
            
            <MetricCard
              icon="time"
              title="Avg. Duration"
              value={`${mockAnalytics.averageSessionDuration}m`}
              subtitle="Per session"
              trend={-2.1}
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Revenue Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Trend</Text>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Monthly Revenue</Text>
              <Text style={styles.chartSubtitle}>Last 3 months</Text>
            </View>
            
            <View style={styles.chartPlaceholder}>
              <View style={styles.chartBars}>
                {mockAnalytics.monthlyData.map((data, index) => (
                  <View key={index} style={styles.chartBarContainer}>
                    <View 
                      style={[
                        styles.chartBar,
                        { 
                          height: (data.revenue / 20000) * 100,
                          backgroundColor: index === mockAnalytics.monthlyData.length - 1 ? '#007AFF' : '#E0E0E0'
                        }
                      ]}
                    />
                    <Text style={styles.chartBarLabel}>{data.month}</Text>
                    <Text style={styles.chartBarValue}>{formatPrice(data.revenue)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Station Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Station Performance</Text>
          
          {mockAnalytics.stationPerformance.map((station, index) => (
            <View key={index} style={styles.stationPerformanceCard}>
              <View style={styles.stationHeader}>
                <Text style={styles.stationName}>{station.name}</Text>
                <Text style={styles.stationRevenue}>{formatPrice(station.revenue)}</Text>
              </View>
              
              <View style={styles.stationMetrics}>
                <View style={styles.stationMetric}>
                  <Text style={styles.stationMetricLabel}>Sessions</Text>
                  <Text style={styles.stationMetricValue}>{station.sessions}</Text>
                </View>
                
                <View style={styles.stationMetric}>
                  <Text style={styles.stationMetricLabel}>Utilization</Text>
                  <Text style={styles.stationMetricValue}>{station.utilization}%</Text>
                </View>
              </View>
              
              <View style={styles.utilizationBar}>
                <View 
                  style={[
                    styles.utilizationFill,
                    { 
                      width: `${station.utilization}%`,
                      backgroundColor: station.utilization > 70 ? '#4CAF50' : 
                                    station.utilization > 40 ? '#FF9800' : '#F44336'
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Peak Hours Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Peak Hours Analysis</Text>
          
          <View style={styles.peakHoursContainer}>
            <Text style={styles.peakHoursTitle}>Usage by Hour</Text>
            
            <View style={styles.peakHoursChart}>
              {mockAnalytics.peakHoursData.map((hourData, index) => (
                <View key={index} style={styles.hourBar}>
                  <View 
                    style={[
                      styles.hourBarFill,
                      { 
                        height: (hourData.sessions / 80) * 60,
                        backgroundColor: hourData.sessions > 50 ? '#4CAF50' : 
                                       hourData.sessions > 30 ? '#FF9800' : '#E0E0E0'
                      }
                    ]}
                  />
                  {index % 4 === 0 && (
                    <Text style={styles.hourLabel}>{hourData.hour}</Text>
                  )}
                </View>
              ))}
            </View>
            
            <Text style={styles.peakHoursInsight}>
              Peak usage: 6 PM - 8 PM (Average: {Math.round(
                mockAnalytics.peakHoursData.slice(18, 21).reduce((sum, h) => sum + h.sessions, 0) / 3
              )} sessions/hour)
            </Text>
          </View>
        </View>

        {/* Customer Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Insights</Text>
          
          <View style={styles.insightsContainer}>
            <View style={styles.insightCard}>
              <Ionicons name="star" size={24} color="#FFB800" />
              <Text style={styles.insightValue}>{mockAnalytics.customerSatisfaction}</Text>
              <Text style={styles.insightLabel}>Customer Rating</Text>
            </View>
            
            <View style={styles.insightCard}>
              <Ionicons name="people" size={24} color="#007AFF" />
              <Text style={styles.insightValue}>89%</Text>
              <Text style={styles.insightLabel}>Repeat Customers</Text>
            </View>
            
            <View style={styles.insightCard}>
              <Ionicons name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.insightValue}>+{mockAnalytics.growthRate}%</Text>
              <Text style={styles.insightLabel}>Monthly Growth</Text>
            </View>
          </View>
        </View>

        {/* Top Performing Station */}
        <View style={styles.section}>
          <View style={styles.topStationCard}>
            <View style={styles.topStationHeader}>
              <Ionicons name="trophy" size={24} color="#FFB800" />
              <Text style={styles.topStationTitle}>Top Performing Station</Text>
            </View>
            
            <Text style={styles.topStationName}>{mockAnalytics.topPerformingStation}</Text>
            <Text style={styles.topStationDescription}>
              Highest revenue and customer satisfaction this month
            </Text>
          </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activePeriodButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activePeriodButtonText: {
    color: '#fff',
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: (width - 60) / 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#999',
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
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  chartPlaceholder: {
    height: 120,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 30,
    borderRadius: 4,
    marginBottom: 8,
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  chartBarValue: {
    fontSize: 8,
    color: '#999',
  },
  stationPerformanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stationRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  stationMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stationMetric: {
    alignItems: 'center',
  },
  stationMetricLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  stationMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  utilizationBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 2,
  },
  peakHoursContainer: {
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
  peakHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  peakHoursChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    marginBottom: 16,
    gap: 2,
  },
  hourBar: {
    flex: 1,
    alignItems: 'center',
  },
  hourBarFill: {
    width: '100%',
    borderRadius: 2,
    marginBottom: 4,
  },
  hourLabel: {
    fontSize: 8,
    color: '#666',
    transform: [{ rotate: '-45deg' }],
  },
  peakHoursInsight: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  insightsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  insightLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  topStationCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFB800',
  },
  topStationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  topStationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8F00',
  },
  topStationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  topStationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
