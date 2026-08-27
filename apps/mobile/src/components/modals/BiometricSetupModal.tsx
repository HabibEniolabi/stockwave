import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  // Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import { AnimatedFaceIdIcon } from '../animations/AnimatedFaceIdIcon';
import { AppIcon } from '../icons/AppIcon';
import { Button } from '../ui/Button';

import { useAppSession } from '../../context/AppSessionContext';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

type BiometricMode = 'face' | 'fingerprint' | 'unsupported';

type BiometricSetupModalProps = {
  visible: boolean;
  onContinueToPin: () => void;
};

export function BiometricSetupModal({
  visible,
  onContinueToPin,
}: BiometricSetupModalProps) {
  const { enableBiometrics } = useAppSession();

  const [mode, setMode] = useState<BiometricMode>('unsupported');

  const [isChecking, setIsChecking] = useState(true);

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }

    const detectBiometricType = async () => {
      setIsChecking(true);
      setError('');

      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();

        const enrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !enrolled) {
          setMode('unsupported');
          return;
        }

        const supportedTypes =
          await LocalAuthentication.supportedAuthenticationTypesAsync();

        const supportsFace = supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        );

        const supportsFingerprint = supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT,
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

        setError('Unable to check biometric authentication.');
      } finally {
        setIsChecking(false);
      }
    };

    detectBiometricType();
  }, [visible]);

  const handleUsePinInstead = () => {
    onContinueToPin();
  };

  const handleEnableBiometrics = async () => {
    if (mode === 'unsupported' || isAuthenticating) {
      return;
    }

    setIsAuthenticating(true);
    setError('');

    try {
      const result = await LocalAuthentication.authenticateAsync({
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
          setError('Biometric authentication was not completed.');
        }

        return;
      }

      await enableBiometrics();
      onContinueToPin();
    } catch {
      setError('Unable to complete biometric authentication.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const isFaceId = mode === 'face';

  const isUnsupported = mode === 'unsupported';

  return (
    // <Modal
    //   transparent
    //   visible={visible}
    //   animationType="slide"
    //   statusBarTranslucent
    //   onRequestClose={
    //     handleUsePinInstead
    //   }
    // >
    <View style={styles.modalRoot}>
      <View style={styles.overlay}>
        {/*
          Don't make this Pressable.

          Security setup is mandatory,
          so tapping the backdrop should
          not dismiss the flow.
        */}
        <View style={StyleSheet.absoluteFill} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {isChecking ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[100]} />

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
                      name="fingerprint"
                      size={72}
                      color={colors.neutral[400]}
                    />
                  )}
                </View>

                <Text style={styles.title}>
                  {isUnsupported
                    ? 'Secure your account'
                    : isFaceId
                      ? 'Set up Face ID'
                      : 'Set up fingerprint'}
                </Text>

                <Text style={styles.description}>
                  {isUnsupported
                    ? 'Biometric authentication is unavailable on this device. Create a PIN to secure StockWave.'
                    : isFaceId
                      ? 'Use Face ID for faster and more secure access to StockWave.'
                      : 'Use your fingerprint for faster and more secure access to StockWave.'}
                </Text>

                {error ? <Text style={styles.error}>{error}</Text> : null}
              </View>

              <View style={styles.actions}>
                {isUnsupported ? (
                  <Button
                    title="Create PIN"
                    variant="primary"
                    onPress={handleUsePinInstead}
                  />
                ) : (
                  <>
                    <Button
                      title={isFaceId ? 'Enable Face ID' : 'Enable fingerprint'}
                      variant="primary"
                      loading={isAuthenticating}
                      onPress={handleEnableBiometrics}
                    />

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Use PIN instead"
                      hitSlop={10}
                      style={styles.laterButton}
                      onPress={handleUsePinInstead}
                    >
                      <Text style={styles.laterText}>Use PIN instead</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </View>
    // {/* </Modal> */}
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
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
