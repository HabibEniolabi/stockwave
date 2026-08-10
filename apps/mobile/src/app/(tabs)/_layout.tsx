import {
  Redirect,
  Tabs,
} from 'expo-router';

import { AppIcon } from
  '../../components/icons/AppIcon';

import { useAppSession } from
  '../../context/AppSessionContext';

import { colors } from '../../theme/colors';

export default function TabsLayout() {
  const {
    isAuthenticated,
    hasSeenWelcome,
  } = useAppSession();

  if (!isAuthenticated) {
    return (
      <Redirect href="/(auth)/sign-in" />
    );
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

        tabBarActiveTintColor:
          colors.primary[100],

        tabBarInactiveTintColor:
          colors.neutral[400],
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({
            color,
            focused,
          }) => (
            <AppIcon
              name="home"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({
            color,
            focused,
          }) => (
            <AppIcon
              name="portfolio"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="market"
        options={{
          title: 'Market',
          tabBarIcon: ({
            color,
            focused,
          }) => (
            <AppIcon
              name="market"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({
            color,
            focused,
          }) => (
            <AppIcon
              name="profile"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}