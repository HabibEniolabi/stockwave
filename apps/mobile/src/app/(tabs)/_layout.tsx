
import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import HomeTabIcon from '../../assets/icons/HomeTabIcon';

import MarketTabIcon from '../../assets/icons/MarketTabIcon';

import PortfolioTabIcon from '../../assets/icons/PortfolioTabIcon';

import ProfileTabIcon from '../../assets/icons/ProfileTabIcon';

import SwapTabIcon from '../../assets/icons/SwapTabIcon';

import { useAppSession } from '../../context/AppSessionContext';

import { colors } from '../../theme/colors';

export default function TabsLayout() {
  const {
    isSessionReady,
    isVerificationReady,
    isDeviceSecurityReady,

    isAuthenticated,

    hasRegistrationPhone,
    hasCompletedVerification,
    hasSeenWelcome,

    pinCreated,
    isAppUnlocked,
  } = useAppSession();

  if (!isSessionReady || !isVerificationReady || !isDeviceSecurityReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!hasRegistrationPhone) {
    return <Redirect href="/(auth)/PhoneNumberScreen" />;
  }

  if (!hasCompletedVerification) {
    return <Redirect href="/(auth)/OtpVerificationScreen" />;
  }

  /*
   * Welcome/security setup hasn't
   * been fully completed.
   */
  if (!hasSeenWelcome) {
    return <Redirect href="/(auth)/WelcomeScreen" />;
  }

  if (pinCreated && !isAppUnlocked) {
    return <Redirect href="/(security)/UnlockPinScreen" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: false,

        tabBarActiveTintColor: colors.neutral[800],

        tabBarInactiveTintColor: colors.neutral[400],

        tabBarStyle: styles.tabBar,

        tabBarItemStyle: styles.tabBarItem,

        tabBarIconStyle: styles.tabBarIcon,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',

          tabBarIcon: ({ color, focused }) => (
            <HomeTabIcon size={30} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',

          tabBarIcon: ({ color, focused }) => (
            <PortfolioTabIcon size={30} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="swap"
        options={{
          title: 'Swap',

          tabBarIcon: () => (
            <View style={styles.swapButton}>
              <SwapTabIcon size={24} color={colors.other.white} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="market"
        options={{
          title: 'Market',

          tabBarIcon: ({ color, focused }) => (
            <MarketTabIcon size={30} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',

          tabBarIcon: ({ color, focused }) => (
            <ProfileTabIcon size={30} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 67,

    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 22,

    borderTopWidth: 1,

    borderTopColor: colors.neutral[50],

    backgroundColor: colors.other.white,
  },

  tabBarItem: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 0,
  },

  tabBarIcon: {
    alignItems: 'center',

    justifyContent: 'center',
  },

  swapButton: {
    width: 40,
    height: 40,

    borderRadius: 20,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: colors.primary[100],
  },
});
