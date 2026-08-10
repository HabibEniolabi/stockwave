import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from
  'react-native-safe-area-context';

import { BiometricSetupModal } from
  '../../components/modals/BiometricSetupModal';

import { useAppSession } from
  '../../context/AppSessionContext';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from
  '../../theme/typography';

export default function ProfileScreen() {
  const {
    isAuthenticated,
    isPhoneVerified,
    hasSeenWelcome,

    biometricEnabled,
    biometricPromptDismissed,

    pinCreated,
  } = useAppSession();

  const [
    biometricModalVisible,
    setBiometricModalVisible,
  ] = useState(false);

  useEffect(() => {
    const shouldShowBiometricSetup =
      isAuthenticated &&
      hasSeenWelcome &&
      !biometricEnabled &&
      !biometricPromptDismissed;

    if (!shouldShowBiometricSetup) {
      return;
    }

    const timer = setTimeout(() => {
      setBiometricModalVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    isAuthenticated,
    hasSeenWelcome,
    biometricEnabled,
    biometricPromptDismissed,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>
          StockWave Home
        </Text>

        <Text style={styles.subtitle}>
          Your Home UI goes here.
        </Text>

        {/* DEVELOPMENT ONLY */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>
            Dummy session
          </Text>

          <Text style={styles.debugText}>
            Authenticated:{' '}
            {isAuthenticated ? 'Yes' : 'No'}
          </Text>

          <Text style={styles.debugText}>
            Phone verified:{' '}
            {isPhoneVerified ? 'Yes' : 'No'}
          </Text>

          <Text style={styles.debugText}>
            Welcome completed:{' '}
            {hasSeenWelcome ? 'Yes' : 'No'}
          </Text>

          <Text style={styles.debugText}>
            Biometrics:{' '}
            {biometricEnabled ? 'Enabled' : 'Disabled'}
          </Text>

          <Text style={styles.debugText}>
            PIN:{' '}
            {pinCreated ? 'Created' : 'Not created'}
          </Text>
        </View>
      </View>

      <BiometricSetupModal
        visible={biometricModalVisible}
        onClose={() => {
          setBiometricModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.other.white,
  },

  container: {
    flex: 1,
    padding: spacing[4],
  },

  title: {
    ...getTypography('heading4', 'bold'),
    color: colors.neutral[900],
  },

  subtitle: {
    ...getTypography('bodyMedium'),
    marginTop: spacing[2],
    color: colors.neutral[500],
  },

  debugContainer: {
    marginTop: spacing[8],
    padding: spacing[4],
    borderRadius: 14,
    backgroundColor: colors.neutral[25],
  },

  debugTitle: {
    ...getTypography('bodyMedium', 'semiBold'),
    marginBottom: spacing[3],
    color: colors.neutral[900],
  },

  debugText: {
    ...getTypography('bodySmall'),
    marginBottom: spacing[1],
    color: colors.neutral[600],
  },
});