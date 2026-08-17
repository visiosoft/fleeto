import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as NativeSplashScreen from 'expo-splash-screen';
import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider } from './src/contexts/AuthContext';
import SplashScreen from './src/screens/SplashScreen';
import AppNavigator from './src/navigation/AppNavigator';

// Keep the native splash (app.json "splash" / adaptive icon) up until our own
// animated splash has mounted underneath it, so the handoff has no gap.
NativeSplashScreen.preventAutoHideAsync().catch(() => {});

const App: React.FC = () => {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  useEffect(() => {
    // Our purple animated splash is now on screen; safe to drop the native one.
    NativeSplashScreen.hideAsync().catch(() => {});
  }, []);

  // The dark root colour prevents a white flash between the native splash
  // and the first rendered frame.
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#1A0B33' }}>
      <StatusBar style="light" backgroundColor="#1A0B33" translucent={false} />
      {!fontsLoaded ? (
        <SplashScreen fontsReady={false} message="Starting up" />
      ) : (
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      )}
    </GestureHandlerRootView>
  );
};

export default App;
