import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { OtpInput } from '../../components/form/OtpInput';
import {
  PinKeypad,
  type PinBiometricMode,
} from '../../components/security/PinKeypad';
import { useAppSession } from '../../context/AppSessionContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

const PIN_LENGTH = 6;

export default function UnlockPinScreen() {
  const { user, biometricEnabled, verifyPin, unlockApp, signOutCurrentDevice } =
    useAppSession();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const [biometricMode, setBiometricMode] =
    useState<PinBiometricMode>('unsupported');

  const hasAutoPrompted = useRef(false);

  const displayName =
    user?.user_metadata?.first_name || user?.user_metadata?.username || 'there';

  const initial = displayName.charAt(0).toUpperCase();

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

  const handleBiometricUnlock = useCallback(async () => {
    if (!biometricEnabled || biometricMode === 'unsupported' || isVerifying) {
      return;
    }

    setError('');

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock StockWave',

        cancelLabel: 'Use PIN instead',

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
  }, [biometricEnabled, biometricMode, isVerifying, unlockApp]);

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

    if (nextPin.length === PIN_LENGTH) {
      setTimeout(() => {
        void verifyAndUnlock(nextPin);
      }, 150);
    }
  };

  const handleBackspace = () => {
    if (isVerifying) {
      return;
    }

    setError('');

    setPin((current) => current.slice(0, -1));
  };

  const handleForgotPin = async () => {
    if (isVerifying) {
      return;
    }

    try {
      setIsVerifying(true);

      await signOutCurrentDevice();

      router.replace('/(auth)/sign-in');
    } catch {
      setError('Unable to reset this device session. Please try again.');

      setIsVerifying(false);
    }
  };

  const canUseBiometrics = biometricEnabled && biometricMode !== 'unsupported';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.backgroundAccent} />

        <View style={styles.headerContent}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>

          <Text style={styles.title}>Enter passcode</Text>

          <Text style={styles.description}>Welcome back, {displayName}.</Text>
        </View>

        <View style={styles.pinCard}>
          <Text style={styles.pinLabel}>Enter your 6-digit PIN</Text>

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

          <View style={styles.errorContainer}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </View>

        <View style={styles.keypadContainer}>
          <PinKeypad
            biometricMode={biometricMode}
            canUseBiometrics={canUseBiometrics}
            isDisabled={isVerifying}
            pinLength={pin.length}
            onNumberPress={handleNumberPress}
            onBackspace={handleBackspace}
            onBiometricPress={() => {
              void handleBiometricUnlock();
            }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.forgotText}>Forgotten passcode? </Text>

          <Pressable
            hitSlop={8}
            disabled={isVerifying}
            onPress={() => {
              void handleForgotPin();
            }}
          >
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
    backgroundColor: '#F8F8FB',
  },

  container: {
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
  },

  backgroundAccent: {
    position: 'absolute',
    width: 330,
    height: 330,
    top: -220,
    right: -110,
    borderRadius: 165,
    backgroundColor: colors.primary[0],
  },

  headerContent: {
    alignItems: 'center',
    paddingTop: spacing[6],
  },

  avatarOuter: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 38,
    backgroundColor: colors.other.white,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
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
    marginTop: spacing[4],
    color: colors.neutral[900],
    textAlign: 'center',
  },

  description: {
    ...getTypography('bodyMedium'),
    marginTop: spacing[2],
    color: colors.neutral[500],
    textAlign: 'center',
  },

  pinCard: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    borderRadius: 24,
    backgroundColor: colors.other.white,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.035,
    shadowRadius: 18,
    elevation: 1,
  },

  pinLabel: {
    ...getTypography('bodySmall', 'medium'),
    color: colors.neutral[500],
    textAlign: 'center',
  },

  pinContainer: {
    width: 250,
    alignSelf: 'center',
    marginTop: spacing[3],
  },

  errorContainer: {
    minHeight: 35,
    justifyContent: 'center',
    marginTop: spacing[1],
  },

  error: {
    ...getTypography('bodySmall'),
    color: colors.error.light,
    textAlign: 'center',
  },

  keypadContainer: {
    marginTop: spacing[5],
  },

  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[3],
  },

  forgotText: {
    ...getTypography('bodyMedium'),
    color: colors.neutral[500],
  },

  resetText: {
    ...getTypography('bodyMedium', 'semiBold'),
    color: colors.primary[100],
  },
});

// import { useCallback, useEffect, useRef, useState } from 'react';
// import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
// import { router, useFocusEffect } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import * as LocalAuthentication from 'expo-local-authentication';
// import { OtpInput } from '../../components/form/OtpInput';
// import {
//   PinKeypad,
//   type PinBiometricMode,
// } from '../../components/security/PinKeypad';
// import { useAppSession } from '../../context/AppSessionContext';
// import { colors } from '../../theme/colors';
// import { spacing } from '../../theme/spacing';
// import { getTypography } from '../../theme/typography';
// import * as NavigationBar from 'expo-navigation-bar'

// const PIN_LENGTH = 6;

// export default function UnlockPinScreen() {
//   const { user, biometricEnabled, verifyPin, unlockApp, signOutCurrentDevice } =
//     useAppSession();
//   const [pin, setPin] = useState('');
//   const [error, setError] = useState('');
//   const [shakeTrigger, setShakeTrigger] = useState(0);
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [biometricMode, setBiometricMode] =
//     useState<PinBiometricMode>('unsupported');

//   const hasAutoPrompted = useRef(false);
//   const displayName =
//     user?.user_metadata?.first_name || user?.user_metadata?.username || 'there';

//   const initial = displayName.charAt(0).toUpperCase();

//   useEffect(() => {
//     if (!biometricEnabled) {
//       return;
//     }

//     const detectBiometric = async () => {
//       try {
//         const hasHardware = await LocalAuthentication.hasHardwareAsync();
//         const enrolled = await LocalAuthentication.isEnrolledAsync();

//         if (!hasHardware || !enrolled) {
//           setBiometricMode('unsupported');

//           return;
//         }

//         const types =
//           await LocalAuthentication.supportedAuthenticationTypesAsync();

//         if (
//           types.includes(
//             LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
//           )
//         ) {
//           setBiometricMode('face');

//           return;
//         }

//         if (
//           types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
//         ) {
//           setBiometricMode('fingerprint');

//           return;
//         }

//         setBiometricMode('unsupported');
//       } catch {
//         setBiometricMode('unsupported');
//       }
//     };

//     void detectBiometric();
//   }, [biometricEnabled]);

//   const handleBiometricUnlock = useCallback(async () => {
//     if (!biometricEnabled || biometricMode === 'unsupported' || isVerifying) {
//       return;
//     }

//     setError('');

//     try {
//       const result = await LocalAuthentication.authenticateAsync({
//         promptMessage: 'Unlock StockWave',
//         cancelLabel: 'Use PIN instead',
//         disableDeviceFallback: true,
//       });

//       if (!result.success) {
//         if (
//           result.error !== 'user_cancel' &&
//           result.error !== 'system_cancel'
//         ) {
//           setError('Biometric authentication failed. Use your PIN instead.');
//         }

//         return;
//       }

//       unlockApp();

//       router.replace('/(tabs)/home');
//     } catch {
//       setError('Unable to use biometric authentication. Use your PIN instead.');
//     }
//   }, [biometricEnabled, biometricMode, isVerifying, unlockApp]);

//   useEffect(() => {
//     if (
//       !biometricEnabled ||
//       biometricMode === 'unsupported' ||
//       hasAutoPrompted.current
//     ) {
//       return;
//     }

//     hasAutoPrompted.current = true;

//     const timer = setTimeout(() => {
//       void handleBiometricUnlock();
//     }, 400);

//     return () => clearTimeout(timer);
//   }, [biometricEnabled, biometricMode, handleBiometricUnlock]);


//   useFocusEffect(
//   useCallback(() => {
//     if (Platform.OS !== 'android') {
//       return;
//     }

//     void NavigationBar.setBackgroundColorAsync(
//       '#120D1D',
//     );

//     void NavigationBar.setButtonStyleAsync(
//       'light',
//     );

//     return () => {
//       void NavigationBar.setBackgroundColorAsync(
//         '#FFFFFF',
//       );

//       void NavigationBar.setButtonStyleAsync(
//         'dark',
//       );
//     };
//   }, []),
// );

//   const verifyAndUnlock = async (enteredPin: string) => {
//     if (isVerifying) {
//       return;
//     }

//     setIsVerifying(true);
//     setError('');

//     try {
//       const isCorrect = await verifyPin(enteredPin);

//       if (!isCorrect) {
//         setError('Incorrect PIN. Please try again.');
//         setShakeTrigger((current) => current + 1);
//         setPin('');
//         return;
//       }

//       unlockApp();

//       router.replace('/(tabs)/home');
//     } catch {
//       setError('Unable to verify your PIN. Please try again.');

//       setPin('');

//       setShakeTrigger((current) => current + 1);
//     } finally {
//       setIsVerifying(false);
//     }
//   };

//   const handleNumberPress = (digit: string) => {
//     if (isVerifying || pin.length >= PIN_LENGTH) {
//       return;
//     }

//     setError('');

//     const nextPin = `${pin}${digit}`.slice(0, PIN_LENGTH);

//     setPin(nextPin);

//     if (nextPin.length === PIN_LENGTH) {
//       setTimeout(() => {
//         void verifyAndUnlock(nextPin);
//       }, 150);
//     }
//   };

//   const handleBackspace = () => {
//     if (isVerifying) {
//       return;
//     }

//     setError('');

//     setPin((current) => current.slice(0, -1));
//   };

//   const handleForgotPin = async () => {
//     if (isVerifying) {
//       return;
//     }

//     try {
//       setIsVerifying(true);

//       await signOutCurrentDevice();

//       router.replace('/(auth)/sign-in');
//     } catch {
//       setError('Unable to reset this device session. Please try again.');

//       setIsVerifying(false);
//     }
//   };

//   const canUseBiometrics = biometricEnabled && biometricMode !== 'unsupported';

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar style="light" />

//       <View style={styles.container}>
//         <View style={styles.glowOne} />

//         <View style={styles.glowTwo} />

//         <View style={styles.brandRow}>
//           <View style={styles.brandMark} />

//           <Text style={styles.brandText}>STOCKWAVE</Text>

//           <View style={styles.secureIndicator}>
//             <View style={styles.secureDot} />

//             <Text style={styles.secureText}>SECURE</Text>
//           </View>
//         </View>

//         <View style={styles.headerContent}>
//           <View style={styles.avatarRing}>
//             <View style={styles.avatar}>
//               <Text style={styles.avatarText}>{initial}</Text>
//             </View>
//           </View>

//           <Text style={styles.eyebrow}>WELCOME BACK</Text>

//           <Text style={styles.title}>{displayName}</Text>

//           <Text style={styles.description}>
//             Enter your passcode to securely continue
//           </Text>

//           <View style={styles.pinContainer}>
//             <OtpInput
//               value={pin}
//               onChangeText={setPin}
//               length={PIN_LENGTH}
//               purpose="pin"
//               secure
//               variant="dots"
//               keyboardEnabled={false}
//               status={error ? 'error' : 'default'}
//               shakeTrigger={shakeTrigger}
//             />
//           </View>

//           <View style={styles.errorArea}>
//             {error ? (
//               <Text style={styles.error}>{error}</Text>
//             ) : (
//               <Text style={styles.helperText}>6-digit passcode</Text>
//             )}
//           </View>
//         </View>

//         <View style={styles.keypadSection}>
//           <PinKeypad
//             biometricMode={biometricMode}
//             canUseBiometrics={canUseBiometrics}
//             isDisabled={isVerifying}
//             pinLength={pin.length}
//             onNumberPress={handleNumberPress}
//             onBackspace={handleBackspace}
//             onBiometricPress={() => {
//               void handleBiometricUnlock();
//             }}
//           />
//         </View>

//         <View style={styles.footer}>
//           <Text style={styles.forgotText}>Forgotten passcode?</Text>

//           <Pressable
//             hitSlop={10}
//             disabled={isVerifying}
//             onPress={() => {
//               void handleForgotPin();
//             }}
//           >
//             <Text style={styles.resetText}>Reset</Text>
//           </Pressable>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#120D1D',
//   },

//   container: {
//     flex: 1,
//     overflow: 'hidden',
//     paddingHorizontal: spacing[5],
//     paddingBottom: spacing[4],
//   },

//   glowOne: {
//     position: 'absolute',
//     width: 360,
//     height: 360,
//     top: -245,
//     right: -120,
//     borderRadius: 180,
//     backgroundColor: 'rgba(134, 76, 190, 0.14)',
//   },

//   glowTwo: {
//     position: 'absolute',
//     width: 280,
//     height: 280,
//     bottom: -190,
//     left: -160,
//     borderRadius: 140,
//     backgroundColor: 'rgba(91, 48, 131, 0.10)',
//   },

//   brandRow: {
//     height: 48,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },

//   brandMark: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: colors.primary[25],
//   },

//   brandText: {
//     ...getTypography('bodySmall', 'semiBold'),
//     marginLeft: 8,
//     letterSpacing: 2.2,
//     color: 'rgba(255,255,255,0.75)',
//   },

//   secureIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginLeft: 'auto',
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.08)',
//     borderRadius: 999,
//     backgroundColor: 'rgba(255,255,255,0.035)',
//   },

//   secureDot: {
//     width: 5,
//     height: 5,
//     marginRight: 6,
//     borderRadius: 3,
//     backgroundColor: '#78D7A5',
//   },

//   secureText: {
//     fontSize: 9,
//     fontWeight: '700',
//     letterSpacing: 1.3,
//     color: 'rgba(255,255,255,0.56)',
//   },

//   headerContent: {
//     alignItems: 'center',
//     paddingTop: spacing[3],
//   },

//   avatarRing: {
//     width: 82,
//     height: 82,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.12)',
//     borderRadius: 41,
//     backgroundColor: 'rgba(255,255,255,0.035)',
//   },

//   avatar: {
//     width: 66,
//     height: 66,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 33,
//     backgroundColor: 'rgba(142, 92, 190, 0.16)',
//   },

//   avatarText: {
//     ...getTypography('heading4', 'semiBold'),
//     color: colors.primary[25],
//   },

//   eyebrow: {
//     marginTop: spacing[4],
//     fontSize: 10,
//     fontWeight: '700',
//     letterSpacing: 2.4,
//     color: 'rgba(255,255,255,0.36)',
//   },

//   title: {
//     ...getTypography('heading3', 'bold'),
//     marginTop: 6,
//     color: colors.other.white,
//     textAlign: 'center',
//   },

//   description: {
//     ...getTypography('bodyMedium'),
//     maxWidth: 240,
//     marginTop: spacing[2],
//     lineHeight: 21,
//     color: 'rgba(255,255,255,0.48)',
//     textAlign: 'center',
//   },

//   pinContainer: {
//     width: 250,
//     marginTop: spacing[5],
//   },

//   errorArea: {
//     minHeight: 28,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 6,
//   },

//   error: {
//     ...getTypography('bodySmall'),
//     color: colors.error.light,
//     textAlign: 'center',
//   },

//   helperText: {
//     ...getTypography('bodySmall'),
//     color: 'rgba(255,255,255,0.25)',
//   },

//   keypadSection: {
//     marginTop: spacing[4],
//     paddingTop: spacing[2],
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(255,255,255,0.05)',
//   },

//   footer: {
//     marginTop: 'auto',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingTop: spacing[3],
//   },

//   forgotText: {
//     ...getTypography('bodySmall'),
//     color: 'rgba(255,255,255,0.4)',
//   },

//   resetText: {
//     ...getTypography('bodySmall', 'semiBold'),
//     marginLeft: 6,
//     color: colors.primary[25],
//   },
// });
