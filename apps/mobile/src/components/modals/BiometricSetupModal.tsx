// import { router } from 'expo-router';
// import { useEffect, useState } from 'react';
// import {
//   ActivityIndicator,
//   Pressable,
//   StyleSheet,
//   Text,
//   View,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import * as LocalAuthentication from 'expo-local-authentication';

// import { BackButton } from '../ui/BackButton';
// import { Button } from '../ui/Button';
// import { AnimatedFaceIdIcon } from '../animations/AnimatedFaceIdIcon';
// import { colors } from '../../theme/colors';
// import { spacing } from '../../theme/spacing';
// import { getTypography } from '../../theme/typography';
// import { AppIcon } from '../icons/AppIcon';
// import Animated, {
//   useAnimatedStyle,
//   useSharedValue,
//   withRepeat,
//   withSequence,
//   withTiming,
// } from 'react-native-reanimated';

// type BiometricMode = 'face' | 'fingerprint' | 'unsupported';

// export default function BiometricSetupScreen() {
//   const [mode, setMode] = useState<BiometricMode>('unsupported');

//   const [isChecking, setIsChecking] = useState(true);
//   const [isAuthenticating, setIsAuthenticating] = useState(false);

//   const [error, setError] = useState('');

//   useEffect(() => {
//     const detectBiometricType = async () => {
//       try {
//         const hasHardware = await LocalAuthentication.hasHardwareAsync();

//         const isEnrolled = await LocalAuthentication.isEnrolledAsync();

//         if (!hasHardware || !isEnrolled) {
//           setMode('unsupported');
//           return;
//         }

//         const supportedTypes =
//           await LocalAuthentication.supportedAuthenticationTypesAsync();

//         const supportsFace = supportedTypes.includes(
//           LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
//         );

//         const supportsFingerprint = supportedTypes.includes(
//           LocalAuthentication.AuthenticationType.FINGERPRINT,
//         );

//         if (supportsFace) {
//           setMode('face');
//           return;
//         }

//         if (supportsFingerprint) {
//           setMode('fingerprint');
//           return;
//         }

//         setMode('unsupported');
//       } catch {
//         setMode('unsupported');
//         setError('We could not check biometric authentication.');
//       } finally {
//         setIsChecking(false);
//       }
//     };

//     detectBiometricType();
//   }, []);

//   const fingerprintScale = useSharedValue(1);

//   useEffect(() => {
//     fingerprintScale.value = withRepeat(
//       withSequence(
//         withTiming(1.08, { duration: 700 }),
//         withTiming(1, { duration: 700 }),
//       ),
//       -1,
//       true,
//     );
//   }, [fingerprintScale]);

//   const fingerprintAnimatedStyle = useAnimatedStyle(() => ({
//     transform: [{ scale: fingerprintScale.value }],
//   }));

//   const handleAuthenticate = async () => {
//     if (mode === 'unsupported' || isAuthenticating) {
//       return;
//     }

//     setError('');
//     setIsAuthenticating(true);

//     try {
//       const result = await LocalAuthentication.authenticateAsync({
//         promptMessage:
//           mode === 'face' ? 'Set up Face ID' : 'Set up fingerprint',
//         cancelLabel: 'Cancel',
//         fallbackLabel: 'Use device passcode',
//         disableDeviceFallback: false,
//       });

//       if (!result.success) {
//         if (
//           result.error !== 'user_cancel' &&
//           result.error !== 'system_cancel'
//         ) {
//           setError('Biometric authentication was not completed.');
//         }

//         return;
//       }

//       router.replace('/(tabs)/home');
//     } catch {
//       setError('Biometric authentication could not be completed.');
//     } finally {
//       setIsAuthenticating(false);
//     }
//   };

//   const handleContinueWithoutBiometrics = () => {
//     router.replace('/(tabs)/home');
//   };

//   const handleSkip = () => {
//     router.replace('/(tabs)/home');
//   };

//   if (isChecking) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={colors.primary[100]} />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const isFaceId = mode === 'face';
//   const isUnsupported = mode === 'unsupported';

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.container}>
//         <View style={styles.topBar}>
//           <BackButton onPress={() => router.back()} />

//           <Pressable
//             accessibilityRole="button"
//             accessibilityLabel="Skip biometric setup"
//             hitSlop={12}
//             style={({ pressed }) => [
//               styles.skipButton,
//               pressed && styles.skipButtonPressed,
//             ]}
//             onPress={handleSkip}
//           >
//             <Text style={styles.skipText}>Skip</Text>
//           </Pressable>
//         </View>

//         <View style={styles.content}>
//           <View style={styles.iconContainer}>
//             {isFaceId ? (
//               <AnimatedFaceIdIcon size={72} />
//             ) : (
//               <Animated.View style={fingerprintAnimatedStyle}>
//                 <AppIcon
//                   name="fingerprint"
//                   size={72}
//                   color={colors.primary[100]}
//                 />
//               </Animated.View>
//             )}
//           </View>

//           <Text style={styles.title}>
//             {isUnsupported
//               ? 'Biometrics unavailable'
//               : isFaceId
//                 ? 'Set up Face ID'
//                 : 'Set up fingerprint'}
//           </Text>

//           <Text style={styles.description}>
//             {isUnsupported
//               ? 'No enrolled biometric authentication was found on this device.'
//               : isFaceId
//                 ? 'Enable Face ID authentication on StockWave for fast and secure entry.'
//                 : 'Use your fingerprint to unlock StockWave quickly and securely.'}
//           </Text>

//           {error ? <Text style={styles.error}>{error}</Text> : null}
//         </View>

//         <View style={styles.footer}>
//           {isUnsupported ? (
//             <Button
//               title="Continue"
//               variant="primary"
//               onPress={handleContinueWithoutBiometrics}
//             />
//           ) : (
//             <Button
//               title={
//                 isAuthenticating
//                   ? 'Authenticating...'
//                   : isFaceId
//                     ? 'Scan my face'
//                     : 'Use fingerprint'
//               }
//               variant="primary"
//               loading={isAuthenticating}
//               onPress={handleAuthenticate}
//             />
//           )}
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: colors.other.white,
//   },

//   container: {
//     flex: 1,
//     paddingHorizontal: spacing[4],
//     paddingTop: spacing[2],
//     paddingBottom: spacing[4],
//   },

//   loadingContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   content: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: spacing[4],
//   },

//   iconContainer: {
//     width: 96,
//     height: 96,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: spacing[6],
//   },

//   title: {
//     ...getTypography('heading6', 'bold'),
//     color: colors.neutral[900],
//     textAlign: 'center',
//   },

//   description: {
//     ...getTypography('bodyMedium'),
//     maxWidth: 300,
//     marginTop: spacing[3],
//     color: colors.neutral[500],
//     textAlign: 'center',
//   },

//   error: {
//     ...getTypography('bodySmall'),
//     marginTop: spacing[4],
//     color: colors.error.base,
//     textAlign: 'center',
//   },

//   footer: {
//     width: '100%',
//   },

//   topBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },

//   skipButton: {
//     minHeight: 48,
//     justifyContent: 'center',
//     paddingHorizontal: spacing[2],
//   },

//   skipButtonPressed: {
//     opacity: 0.6,
//   },

//   skipText: {
//     ...getTypography('bodyLarge', 'semiBold'),
//     color: colors.primary[100],
//   },
// });


import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as LocalAuthentication from
  'expo-local-authentication';

import { AnimatedFaceIdIcon } from
  '../animations/AnimatedFaceIdIcon';
import { AppIcon } from '../icons/AppIcon';
import { Button } from '../ui/Button';

import { useAppSession } from
  '../../context/AppSessionContext';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

type BiometricMode =
  | 'face'
  | 'fingerprint'
  | 'unsupported';

type BiometricSetupModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function BiometricSetupModal({
  visible,
  onClose,
}: BiometricSetupModalProps) {
  const {
    enableBiometrics,
    dismissBiometricPrompt,
  } = useAppSession();

  const [mode, setMode] =
    useState<BiometricMode>('unsupported');

  const [isChecking, setIsChecking] =
    useState(true);

  const [isAuthenticating, setIsAuthenticating] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }

    const detectBiometricType = async () => {
      setIsChecking(true);
      setError('');

      try {
        const hasHardware =
          await LocalAuthentication.hasHardwareAsync();

        const enrolled =
          await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !enrolled) {
          setMode('unsupported');
          return;
        }

        const supportedTypes =
          await LocalAuthentication
            .supportedAuthenticationTypesAsync();

        const supportsFace =
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType
              .FACIAL_RECOGNITION,
          );

        const supportsFingerprint =
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType
              .FINGERPRINT,
          );

        if (supportsFace) {
          setMode('face');
          return;
        }

        if (supportsFingerprint) {
          setMode('fingerprint');
          return;
        }

        setMode('unsupported');
      } catch {
        setMode('unsupported');

        setError(
          'Unable to check biometric authentication.',
        );
      } finally {
        setIsChecking(false);
      }
    };

    detectBiometricType();
  }, [visible]);

  const handleMaybeLater = () => {
    dismissBiometricPrompt();
    onClose();
  };

  const handleEnableBiometrics = async () => {
    if (
      mode === 'unsupported' ||
      isAuthenticating
    ) {
      return;
    }

    setIsAuthenticating(true);
    setError('');

    try {
      const result =
        await LocalAuthentication.authenticateAsync({
          promptMessage:
            mode === 'face'
              ? 'Enable Face ID for StockWave'
              : 'Enable fingerprint for StockWave',

          cancelLabel: 'Cancel',

          fallbackLabel: 'Use device passcode',

          disableDeviceFallback: false,
        });

      if (!result.success) {
        if (
          result.error !== 'user_cancel' &&
          result.error !== 'system_cancel'
        ) {
          setError(
            'Biometric authentication was not completed.',
          );
        }

        return;
      }

      enableBiometrics();

      onClose();

      router.push(
        '/(security)/CreatePinScreen',
      );
    } catch {
      setError(
        'Unable to complete biometric authentication.',
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const isFaceId = mode === 'face';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleMaybeLater}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleMaybeLater}
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {isChecking ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primary[100]}
              />

              <Text style={styles.loadingText}>
                Checking device security...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.content}>
                <View style={styles.iconContainer}>
                  {mode === 'face' ? (
                    <AnimatedFaceIdIcon size={72} />
                  ) : mode === 'fingerprint' ? (
                    <AppIcon
                      name="fingerprint"
                      size={72}
                      color={colors.primary[100]}
                    />
                  ) : (
                    <AppIcon
                      name="close"
                      size={56}
                      color={colors.neutral[400]}
                    />
                  )}
                </View>

                <Text style={styles.title}>
                  {mode === 'unsupported'
                    ? 'Biometrics unavailable'
                    : isFaceId
                      ? 'Set up Face ID'
                      : 'Set up fingerprint'}
                </Text>

                <Text style={styles.description}>
                  {mode === 'unsupported'
                    ? 'No enrolled biometric authentication was found on this device.'
                    : isFaceId
                      ? 'Use Face ID for faster and more secure access to StockWave.'
                      : 'Use your fingerprint for faster and more secure access to StockWave.'}
                </Text>

                {error ? (
                  <Text style={styles.error}>
                    {error}
                  </Text>
                ) : null}
              </View>

              <View style={styles.actions}>
                {mode !== 'unsupported' ? (
                  <Button
                    title={
                      isFaceId
                        ? 'Enable Face ID'
                        : 'Enable fingerprint'
                    }
                    variant="primary"
                    loading={isAuthenticating}
                    onPress={
                      handleEnableBiometrics
                    }
                  />
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  hitSlop={10}
                  style={styles.laterButton}
                  onPress={handleMaybeLater}
                >
                  <Text style={styles.laterText}>
                    Maybe later
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13, 13, 18, 0.35)',
  },

  sheet: {
    minHeight: 430,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.other.white,
  },

  handle: {
    width: 42,
    height: 5,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: colors.neutral[100],
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },

  loadingText: {
    ...getTypography('bodyMedium'),
    color: colors.neutral[500],
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
  },

  iconContainer: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },

  title: {
    ...getTypography('heading5', 'bold'),
    color: colors.neutral[900],
    textAlign: 'center',
  },

  description: {
    ...getTypography('bodyMedium'),
    maxWidth: 310,
    marginTop: spacing[3],
    color: colors.neutral[500],
    textAlign: 'center',
  },

  error: {
    ...getTypography('bodySmall'),
    marginTop: spacing[4],
    color: colors.error.base,
    textAlign: 'center',
  },

  actions: {
    gap: spacing[4],
  },

  laterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },

  laterText: {
    ...getTypography('bodyMedium', 'semiBold'),
    color: colors.neutral[500],
  },
});