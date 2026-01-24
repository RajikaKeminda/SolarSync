import { useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store';
import { isValidEmail } from '../../utils/helpers';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth, setLoading, isLoading } = useAuthStore();
  const { signIn, setActive } = useSignIn()
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      if (!signIn) {
        Alert.alert('Error', 'Failed to login');
        return;
      }

      const { createdSessionId } = await signIn.create({ identifier: email, password })
      await setActive({ session: createdSessionId })

      const response = await apiService.login(email, password);
      
      if (response.success && response.data) {
        const user: any = response.data;
        apiService.setToken(createdSessionId || '');
        setAuth(user, createdSessionId || '');
      } else {
        Alert.alert('Login Failed', response.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (userType: 'ev_owner' | 'station_owner') => {
    const demoUser = {
      id: 'demo-user',
      email: userType === 'ev_owner' ? 'demo@evowner.com' : 'demo@business.com',
      firstName: userType === 'ev_owner' ? 'John' : 'Business',
      lastName: userType === 'ev_owner' ? 'Doe' : 'Owner',
      phone: '+1234567890',
      userType,
      profilePicture: undefined,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setAuth(demoUser, 'demo-token');
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  const navigateToForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove([
        'auth-storage',
        'vehicle-storage', 
        'charging-storage',
        'analytics-storage',
        'station-storage'
      ]);
      Alert.alert('Success', 'All app data cleared! App will reload.');
      // Force refresh by reloading the app
      setAuth({ id: '', email: '', firstName: '', lastName: '', phone: '', userType: 'ev_owner', isVerified: false, createdAt: new Date(), updatedAt: new Date() }, '');
      setTimeout(() => {
        useAuthStore.getState().clearAuth();
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="flash" size={48} color="#007AFF" />
            <Text style={styles.logoText}>SolarSync</Text>
          </View>
          <Text style={styles.subtitle}>
            Find and manage EV charging stations
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={navigateToForgotPassword}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or try demo</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.demoButton}
            onPress={() => handleDemoLogin('ev_owner')}
          >
            <Ionicons name="car" size={20} color="#007AFF" />
            <Text style={styles.demoButtonText}>Demo as EV Owner</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.demoButton}
            onPress={() => handleDemoLogin('station_owner')}
          >
            <Ionicons name="business" size={20} color="#007AFF" />
            <Text style={styles.demoButtonText}>Demo as Station Owner</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don&apos;t have an account?{' '}
            <Text style={styles.signUpLink} onPress={navigateToRegister}>
              Sign Up
            </Text>
          </Text>
          
          {/* Development Debug Button */}
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={clearAllData}
            >
              <Text style={styles.debugButtonText}>🔧 Clear All Data (Dev)</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    color: '#007AFF',
    textAlign: 'right',
    marginBottom: 24,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F0F8FF',
  },
  demoButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  signUpLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
  debugButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
