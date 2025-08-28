// Script to clear authentication state for development
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function clearAuthState() {
  try {
    await AsyncStorage.multiRemove([
      'auth-storage',
      'vehicle-storage', 
      'charging-storage',
      'analytics-storage',
      'station-storage'
    ]);
    console.log('✅ Authentication state cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing auth state:', error);
  }
}

clearAuthState();
