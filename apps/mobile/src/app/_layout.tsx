import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { AppSessionProvider } from '../context/AppSessionContext';

SplashScreen.preventAutoHideAsync();

const Layout = () => {
    const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
    }

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (fontError) {
    throw fontError;
  }

  if (!fontsLoaded) {
    return null;
  }
  return (
    <AppSessionProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="index"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="walkthroughScreen"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(auth)/sign-in"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(auth)/sign-up"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(auth)/PhoneNumberScreen"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(auth)/OtpVerificationScreen"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(auth)/WelcomeScreen"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(auth)/BiometricSetupScreen"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(auth)/CreateNewPasswordScreen"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(auth)/PasswordResetSuccessScreen"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(auth)/ResetPasswordVerificationScreen"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(tabs)/home"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(tabs)/market"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(tabs)/portfolio"
          options={{
            animation: 'fade',
          }}
        />
         <Stack.Screen
          name="(tabs)/profile"
          options={{
            animation: 'fade',
          }}
        />
      </Stack>
    </AppSessionProvider>
  );
};

export default Layout;
