import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import {
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiService } from '../../services/api';
import { useAuthStore } from '../../store';

export default function BusinessProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoReportsEnabled, setAutoReportsEnabled] = useState(true);
  const [maintenanceAlertsEnabled, setMaintenanceAlertsEnabled] = useState(true);
  
  // Business overview data
  const [businessStats, setBusinessStats] = useState({
    totalStations: 0,
    totalSessions: 0,
    monthlyRevenue: 0,
    customerRating: 0
  });
  const [loading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBusinessStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await apiService.getBusinessMetrics(user.id, 'month');
      if (response.success && response.data) {
        setBusinessStats({
          totalStations: response.data.totalStations || 0,
          totalSessions: response.data.totalSessions || 0,
          monthlyRevenue: response.data.totalRevenue || 0,
          customerRating: response.data.customerSatisfaction || 0
        });
      }
    } catch (error) {
      console.error('Error fetching business stats:', error);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBusinessStats();
    setRefreshing(false);
  }, [fetchBusinessStats]);

  useEffect(() => {
    fetchBusinessStats();
  }, [fetchBusinessStats]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.logout();
              apiService.clearToken();
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              await logout(); // Clear auth even if API call fails
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/business/profile/edit');
  };

  const handleBusinessSettings = () => {
    Alert.alert('Coming Soon', 'Business settings will be available soon');
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Contact business support at support@solarsync.com');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Opening privacy policy...');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Opening terms of service...');
  };

  const ProfileItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    rightComponent 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.profileItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <View style={styles.profileItemIcon}>
          <Ionicons name={icon as any} size={20} color="#007AFF" />
        </View>
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      <View style={styles.profileItemRight}>
        {rightComponent}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Profile</Text>
        <TouchableOpacity onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: (user as any)?.profilePicture || 'https://via.placeholder.com/80x80/007AFF/FFFFFF?text=B' }}
              style={styles.profileImage}
              defaultSource={require('../../assets/images/icon.png')}
            />
            <TouchableOpacity style={styles.editImageButton} onPress={handleEditProfile}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.businessName}>
            {user?.firstName}&apos;s Business
          </Text>
          <Text style={styles.businessEmail}>{user?.email}</Text>
          <Text style={styles.businessPhone}>{user?.phone}</Text>
          
          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.verifiedText}>Verified Business</Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Business Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {loading ? '...' : businessStats.totalStations}
              </Text>
              <Text style={styles.statLabel}>Stations</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {loading ? '...' : businessStats.totalSessions}
              </Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {loading ? '...' : `$${businessStats.monthlyRevenue.toLocaleString()}`}
              </Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {loading ? '...' : `${businessStats.customerRating}★`}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Business Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Management</Text>
          
          <View style={styles.sectionContent}>
            <ProfileItem
              icon="business"
              title="Station Management"
              subtitle="Manage your charging stations"
              onPress={() => router.push('/business/stations')}
            />
            
            <ProfileItem
              icon="analytics"
              title="Business Analytics"
              subtitle="View detailed performance insights"
              onPress={() => router.push('/business/analytics')}
            />
            
            <ProfileItem
              icon="flash"
              title="Active Sessions"
              subtitle="Monitor live charging sessions"
              onPress={() => router.push('/business/sessions')}
            />
            
            <ProfileItem
              icon="wallet"
              title="Revenue & Billing"
              subtitle="Payment history and earnings"
              onPress={() => Alert.alert('Coming Soon', 'Revenue management will be available soon')}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.sectionContent}>
            <ProfileItem
              icon="notifications"
              title="Push Notifications"
              subtitle="Receive alerts and updates"
              showArrow={false}
              rightComponent={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
                  thumbColor="#fff"
                />
              }
            />
            
            <ProfileItem
              icon="document-text"
              title="Automated Reports"
              subtitle="Weekly and monthly reports"
              showArrow={false}
              rightComponent={
                <Switch
                  value={autoReportsEnabled}
                  onValueChange={setAutoReportsEnabled}
                  trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
                  thumbColor="#fff"
                />
              }
            />
            
            <ProfileItem
              icon="alert-circle"
              title="Maintenance Alerts"
              subtitle="Station maintenance notifications"
              showArrow={false}
              rightComponent={
                <Switch
                  value={maintenanceAlertsEnabled}
                  onValueChange={setMaintenanceAlertsEnabled}
                  trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
                  thumbColor="#fff"
                />
              }
            />
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <View style={styles.sectionContent}>
            <ProfileItem
              icon="settings"
              title="Business Settings"
              subtitle="Configure business preferences"
              onPress={handleBusinessSettings}
            />
            
            <ProfileItem
              icon="lock-closed"
              title="Security"
              subtitle="Password and security settings"
              onPress={() => Alert.alert('Coming Soon', 'Security settings will be available soon')}
            />
            
            <ProfileItem
              icon="card"
              title="Payment Methods"
              subtitle="Manage payment and payout methods"
              onPress={() => Alert.alert('Coming Soon', 'Payment management will be available soon')}
            />
            
            <ProfileItem
              icon="document"
              title="Business Documents"
              subtitle="Licenses and certifications"
              onPress={() => Alert.alert('Coming Soon', 'Document management will be available soon')}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          
          <View style={styles.sectionContent}>
            <ProfileItem
              icon="help-circle"
              title="Business Support"
              subtitle="Get help with your business account"
              onPress={handleSupport}
            />
            
            <ProfileItem
              icon="document-text"
              title="Privacy Policy"
              subtitle="How we protect your data"
              onPress={handlePrivacyPolicy}
            />
            
            <ProfileItem
              icon="document"
              title="Terms of Service"
              subtitle="Business terms and conditions"
              onPress={handleTermsOfService}
            />
            
            <ProfileItem
              icon="information-circle"
              title="About SolarSync Business"
              subtitle="Version 1.0.0"
              onPress={() => Alert.alert('About', 'SolarSync Business v1.0.0\nBuilt for charging station operators')}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out" size={20} color="#FF3B30" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#fff',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  businessPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  sectionContent: {
    backgroundColor: '#fff',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileItemText: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  profileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
