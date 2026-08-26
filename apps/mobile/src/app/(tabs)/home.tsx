import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BiometricSetupModal } from '../../components/modals/BiometricSetupModal';
import { Button } from '../../components/ui/Button';

import { useAppSession } from '../../context/AppSessionContext';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

export default function HomeScreen() {
  const [isSecuritySetupVisible, setIsSecuritySetupVisible] = useState(false);

  const {
    isAuthenticated,

    /*
     * Keep the current Home UI wording
     * unchanged while using the new
     * verification state internally.
     */
    hasCompletedVerification: isPhoneVerified,

    hasSeenWelcome,
    biometricEnabled,
    pinCreated,
    lockApp,
  } = useAppSession();

  /*
   * Home is only reachable after Welcome
   * has been completed.
   *
   * Therefore:
   *
   * Welcome
   * → "I'm ready to start!"
   * → Home
   * → no PIN yet
   * → show biometric setup.
   *
   * Once the PIN exists this will never
   * appear again during normal Home loads.
   */
  useEffect(() => {
    if (!pinCreated) {
      setIsSecuritySetupVisible(true);

      return;
    }

    setIsSecuritySetupVisible(false);
  }, [pinCreated]);

  const handleContinueToPin = () => {
    setIsSecuritySetupVisible(false);

    router.replace('/(security)/CreatePinScreen');
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>StockWave Home</Text>

          <Text style={styles.subtitle}>Your Home UI goes here.</Text>

          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Session</Text>

            <Text style={styles.debugText}>
              Authenticated: {isAuthenticated ? 'Yes' : 'No'}
            </Text>

            <Text style={styles.debugText}>
              Phone verified: {isPhoneVerified ? 'Yes' : 'No'}
            </Text>

            <Text style={styles.debugText}>
              Welcome completed: {hasSeenWelcome ? 'Yes' : 'No'}
            </Text>

            <Text style={styles.debugText}>
              Biometrics: {biometricEnabled ? 'Enabled' : 'Disabled'}
            </Text>

            <Text style={styles.debugText}>
              PIN: {pinCreated ? 'Created' : 'Not created'}
            </Text>
          </View>

          <Button title="DEV: Lock App" variant="outline" onPress={lockApp} />
        </View>
      </SafeAreaView>

      <BiometricSetupModal
        visible={isSecuritySetupVisible}
        onContinueToPin={handleContinueToPin}
      />
    </>
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
