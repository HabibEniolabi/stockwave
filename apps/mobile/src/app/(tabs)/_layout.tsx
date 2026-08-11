import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import HomeTabIcon from '../../assets/icons/HomeTabIcon';
import PortfolioTabIcon  from '../../assets/icons/PortfolioTabIcon';
import SwapTabIcon  from '../../assets/icons/SwapTabIcon';
import MarketTabIcon  from '../../assets/icons/MarketTabIcon';
import ProfileTabIcon  from '../../assets/icons/ProfileTabIcon';

import { useAppSession } from '../../context/AppSessionContext';

import { colors } from '../../theme/colors';

export default function TabsLayout() {
  const {
    isAuthenticated,
    hasSeenWelcome,
  } = useAppSession();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!hasSeenWelcome) {
    return (
      <Redirect href="/(auth)/WelcomeScreen" />
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: false,

        tabBarActiveTintColor:
          colors.neutral[800],

        tabBarInactiveTintColor:
          colors.neutral[400],

        tabBarStyle: styles.tabBar,

        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          // title: 'Home',

          tabBarIcon: ({
            color,
          }) => (
            <HomeTabIcon
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="portfolio"
        options={{
          // title: 'Portfolio',

          tabBarIcon: ({
            color,
          }) => (
            <PortfolioTabIcon
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="swap"
        options={{
          // title: 'Swap',

          tabBarIcon: () => (
            <View style={styles.swapButton}>
              <SwapTabIcon
                size={32}
                color={colors.other.white}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="market"
        options={{
          // title: 'Market',

          tabBarIcon: ({
            color,
          }) => (
            <MarketTabIcon
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          // title: 'Profile',

          tabBarIcon: ({
            color,
          }) => (
            <ProfileTabIcon
              size={28}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 88,

    paddingTop: 10,
    paddingBottom: 18,

    borderTopWidth: 1,
    borderTopColor: colors.neutral[50],

    backgroundColor: colors.other.white,
  },

  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  swapButton: {
    width: 64,
    height: 64,

    borderRadius: 32,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.primary[100],
  },
});