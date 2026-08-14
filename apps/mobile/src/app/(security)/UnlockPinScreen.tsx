import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { OtpInput } from '../../components/form/OtpInput';
import { AppIcon } from '../../components/icons/AppIcon';
import BackspaceIcon from '../../assets/icons/BackspaceIcon';
import { useAppSession } from '../../context/AppSessionContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

const PIN_LENGTH = 6;

/*
 * Dummy for now.
 * Later:
 *
 * user.firstName
 */
const DISPLAY_NAME = 'Agatha';

type BiometricMode = 'face' | 'fingerprint' | 'unsupported';

type KeypadKey = {
  digit: string;
  letters?: string;
};

const keypadRows: KeypadKey[][] = [
  [
    {
      digit: '1',
    },
    {
      digit: '2',
      letters: 'ABC',
    },
    {
      digit: '3',
      letters: 'DEF',
    },
  ],
  [
    {
      digit: '4',
      letters: 'GHI',
    },
    {
      digit: '5',
      letters: 'JKL',
    },
    {
      digit: '6',
      letters: 'MNO',
    },
  ],
  [
    {
      digit: '7',
      letters: 'PQRS',
    },
    {
      digit: '8',
      letters: 'TUV',
    },
    {
      digit: '9',
      letters: 'WXYZ',
    },
  ],
];

export default function UnlockPinScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [biometricMode, setBiometricMode] =
    useState<BiometricMode>('unsupported');

  /*
   * Prevent Face ID from repeatedly
   * launching because of rerenders.
   */
  const hasAutoPrompted = useRef(false);
  const { biometricEnabled, verifyPin, unlockApp, resetSession } =
    useAppSession();

  /*
   * Detect the biometric type being
   * used on this device.
   */
  useEffect(() => {
    if (!biometricEnabled) {
      return;
    }

    const detectBiometric = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !enrolled) {
          setBiometricMode('unsupported');

          return;
        }

        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          )
        ) {
          setBiometricMode('face');
          return;
        }

        if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          setBiometricMode('fingerprint');

          return;
        }

        setBiometricMode('unsupported');
      } catch {
        setBiometricMode('unsupported');
      }
    };

    void detectBiometric();
  }, [biometricEnabled]);

  /*
   * Face ID / Fingerprint unlock.
   */
  const handleBiometricUnlock = useCallback(async () => {
    if (!biometricEnabled || biometricMode === 'unsupported' || isVerifying) {
      return;
    }

    setError('');

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock StockWave',
        cancelLabel: 'Use PIN instead',

        /*
         * If biometrics fail,
         * fallback should be our
         * StockWave PIN screen.
         */
        disableDeviceFallback: true,
      });

      if (!result.success) {
        /*
         * Cancel just means:
         * stay on PIN screen.
         */
        if (
          result.error !== 'user_cancel' &&
          result.error !== 'system_cancel'
        ) {
          setError('Biometric authentication failed. Use your PIN instead.');
        }

        return;
      }

      unlockApp();

      router.replace('/(tabs)/home');
    } catch {
      setError('Unable to use biometric authentication. Use your PIN instead.');
    }
  }, [biometricEnabled, biometricMode, isVerifying, unlockApp]);

  /*
   * Automatically request Face ID /
   * fingerprint once when this screen
   * opens.
   */
  useEffect(() => {
    if (
      !biometricEnabled ||
      biometricMode === 'unsupported' ||
      hasAutoPrompted.current
    ) {
      return;
    }

    hasAutoPrompted.current = true;

    const timer = setTimeout(() => {
      void handleBiometricUnlock();
    }, 400);

    return () => clearTimeout(timer);
  }, [biometricEnabled, biometricMode, handleBiometricUnlock]);

  const verifyAndUnlock = async (enteredPin: string) => {
    if (isVerifying) {
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isCorrect = await verifyPin(enteredPin);

      if (!isCorrect) {
        setError('Incorrect PIN. Please try again.');
        setShakeTrigger((current) => current + 1);
        setPin('');

        return;
      }

      unlockApp();

      router.replace('/(tabs)/home');
    } catch {
      setError('Unable to verify your PIN. Please try again.');

      setPin('');

      setShakeTrigger((current) => current + 1);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNumberPress = (digit: string) => {
    if (isVerifying || pin.length >= PIN_LENGTH) {
      return;
    }

    setError('');

    const nextPin = `${pin}${digit}`.slice(0, PIN_LENGTH);

    setPin(nextPin);

    /*
     * Automatically verify once all
     * 6 digits have been entered.
     */
    if (nextPin.length === PIN_LENGTH) {
      setTimeout(() => {
        void verifyAndUnlock(nextPin);
      }, 150);
    }
  };

  /*
   * Functional bottom-right backspace.
   */
  const handleBackspace = () => {
    if (isVerifying) {
      return;
    }
    setError('');
    setPin((current) => current.slice(0, -1));
  };

  /*
   * For now, forgotten PIN sends the
   * user through full authentication.
   *
   * Backend integration will later
   * replace this with the real reset flow.
   */
  const handleForgotPin = () => {
    resetSession();

    router.replace('/(auth)/sign-in');
  };

  const initial = DISPLAY_NAME.charAt(0).toUpperCase();
  const canUseBiometrics = biometricEnabled && biometricMode !== 'unsupported';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <Text style={styles.title}>Enter passcode</Text>

          <Text style={styles.description}>Welcome back, {DISPLAY_NAME}.</Text>

          <View style={styles.pinContainer}>
            <OtpInput
              value={pin}
              onChangeText={setPin}
              length={PIN_LENGTH}
              purpose="pin"
              secure
              variant="dots"
              keyboardEnabled={false}
              status={error ? 'error' : 'default'}
              shakeTrigger={shakeTrigger}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.keypad}>
          {keypadRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key) => (
                <Pressable
                  key={key.digit}
                  disabled={isVerifying}
                  style={({ pressed }) => [
                    styles.keyButton,

                    pressed && styles.keyButtonPressed,
                  ]}
                  onPress={() => handleNumberPress(key.digit)}
                >
                  <Text style={styles.keyNumber}>{key.digit}</Text>

                  {key.letters ? (
                    <Text style={styles.keyLetters}>{key.letters}</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ))}

          {/* Bottom keypad row */}
          <View style={styles.keypadRow}>
            {/* Face ID / Fingerprint */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                biometricMode === 'face'
                  ? 'Unlock with Face ID'
                  : 'Unlock with fingerprint'
              }
              disabled={!canUseBiometrics || isVerifying}
              style={[
                styles.specialKey,

                !canUseBiometrics && styles.specialKeyDisabled,
              ]}
              onPress={() => {
                void handleBiometricUnlock();
              }}
            >
              {biometricMode === 'fingerprint' ? (
                <AppIcon
                  name="fingerprint"
                  size={32}
                  color={colors.other.white}
                />
              ) : (
                <AppIcon name="faceId" size={32} color={colors.other.white} />
              )}
            </Pressable>

            {/* Zero */}
            <Pressable
              disabled={isVerifying}
              style={({ pressed }) => [
                styles.keyButton,

                pressed && styles.keyButtonPressed,
              ]}
              onPress={() => handleNumberPress('0')}
            >
              <Text style={styles.keyNumber}>0</Text>
            </Pressable>

            {/* Backspace */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete last digit"
              disabled={!pin.length || isVerifying}
              style={[
                styles.specialKey,
                !pin.length && styles.specialKeyDisabled,
              ]}
              onPress={handleBackspace}
            >
              <BackspaceIcon size={30} color={colors.neutral[300]} />
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.forgotText}>Forgotten passcode? </Text>

          <Pressable hitSlop={8} onPress={handleForgotPin}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[900],
  },

  container: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
  },

  headerContent: {
    alignItems: 'center',
    marginTop: spacing[8],
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[0],
  },

  avatarText: {
    ...getTypography('heading5', 'semiBold'),
    color: colors.primary[300],
  },

  title: {
    ...getTypography('heading3', 'bold'),
    marginTop: spacing[5],
    color: colors.other.white,
    textAlign: 'center',
  },

  description: {
    ...getTypography('bodyLarge'),
    marginTop: spacing[3],
    color: colors.neutral[400],
    textAlign: 'center',
  },

  pinContainer: {
    width: 260,
    marginTop: spacing[8],
  },

  error: {
    ...getTypography('bodySmall'),
    marginTop: spacing[3],
    color: colors.error.light,
    textAlign: 'center',
  },

  keypad: {
    marginTop: spacing[8],
    gap: spacing[3],
  },

  keypadRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },

  keyButton: {
    flex: 1,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[800],
  },

  keyButtonPressed: {
    opacity: 0.7,

    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  keyNumber: {
    ...getTypography('heading4', 'semiBold'),
    color: colors.other.white,
  },

  keyLetters: {
    ...getTypography('bodySmall', 'medium'),
    marginTop: 2,
    letterSpacing: 2,
    color: colors.neutral[400],
  },

  specialKey: {
    flex: 1,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },

  specialKeyDisabled: {
    opacity: 0.25,
  },

  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[4],
  },

  forgotText: {
    ...getTypography('bodyMedium'),
    color: colors.neutral[400],
  },

  resetText: {
    ...getTypography('bodyMedium', 'semiBold'),
    color: colors.primary[25],
    textDecorationLine: 'underline',
  },
});
