import { router } from 'expo-router';

import { useEffect, useState } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBar } from 'expo-status-bar';

import * as LocalAuthentication from 'expo-local-authentication';

import { OtpInput } from '../../components/form/OtpInput';

import { AppIcon } from '../../components/icons/AppIcon';

import { useAppSession } from '../../context/AppSessionContext';

import { colors } from '../../theme/colors';

import { spacing } from '../../theme/spacing';

import { getTypography } from '../../theme/typography';

const PIN_LENGTH = 6;

/*
 * Dummy user data for now.
 * This will come from the authenticated
 * backend user later.
 */
const DISPLAY_NAME = 'Agatha';

type BiometricMode = 'face' | 'fingerprint';

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

  const [biometricMode, setBiometricMode] = useState<BiometricMode>('face');

  const {
    biometricEnabled,

    verifyPin,

    unlockApp,

    resetSession,
  } = useAppSession();

  /*
   * Determine whether the stored
   * biometric preference corresponds
   * to Face ID or fingerprint.
   */
  useEffect(() => {
    if (!biometricEnabled) {
      return;
    }

    const detectBiometricType = async () => {
      try {
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
        }
      } catch {
        // PIN remains available.
      }
    };

    detectBiometricType();
  }, [biometricEnabled]);

  const verifyAndUnlock = async (enteredPin: string) => {
    if (isVerifying) {
      return;
    }

    setIsVerifying(true);

    setError('');

    try {
      const isValid = await verifyPin(enteredPin);

      if (!isValid) {
        setError('Incorrect PIN. Please try again.');

        setShakeTrigger((current) => current + 1);

        setPin('');

        return;
      }

      unlockApp();

      router.replace('/(tabs)/home');
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
     * Passcode screens normally verify
     * immediately after the last digit,
     * so no extra Unlock button is needed.
     */
    if (nextPin.length === PIN_LENGTH) {
      setTimeout(() => {
        void verifyAndUnlock(nextPin);
      }, 120);
    }
  };

  const handleDelete = () => {
    if (isVerifying) {
      return;
    }

    setError('');

    setPin((current) => current.slice(0, -1));
  };

  const handleBiometricUnlock = async () => {
    if (!biometricEnabled || isVerifying) {
      return;
    }

    setError('');

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock StockWave',

        cancelLabel: 'Use PIN instead',

        /*
         * We want OUR StockWave
         * PIN as the fallback,
         * not the device passcode.
         */
        disableDeviceFallback: true,
      });

      if (!result.success) {
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
  };

  /*
   * Temporary dummy behaviour.
   *
   * Later this becomes a proper backend
   * PIN-reset / reauthentication flow.
   */
  const handleResetPin = () => {
    resetSession();

    router.replace('/(auth)/sign-in');
  };

  /*
   * Because this is an app lock,
   * Back must NOT return to Home.
   *
   * For now it exits the dummy session.
   */
  const handleBack = () => {
    resetSession();

    router.replace('/(auth)/sign-in');
  };

  const initial = DISPLAY_NAME.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to sign in"
          hitSlop={10}
          style={styles.backButton}
          onPress={handleBack}
        >
          <AppIcon name="back" size={24} color={colors.other.white} />
        </Pressable>

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

          <View style={styles.keypadRow}>
            <Pressable
              disabled={!biometricEnabled}
              style={[
                styles.specialKey,

                !biometricEnabled && styles.specialKeyHidden,
              ]}
              onPress={handleBiometricUnlock}
            >
              <AppIcon
                name={biometricMode === 'face' ? 'faceId' : 'fingerprint'}
                size={32}
                color={colors.other.white}
              />
            </Pressable>

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

            <Pressable
              disabled={!pin.length || isVerifying}
              style={styles.specialKey}
              onPress={handleDelete}
            >
              <Text style={styles.deleteText}>⌫</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.forgotText}>Forgotten passcode? </Text>

          <Pressable onPress={handleResetPin}>
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

    paddingTop: spacing[2],

    paddingBottom: spacing[4],
  },

  backButton: {
    width: 52,
    height: 52,

    borderRadius: 26,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,

    borderColor: colors.neutral[700],
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

  specialKeyHidden: {
    opacity: 0,
  },

  deleteText: {
    fontSize: 32,

    color: colors.neutral[300],
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
