import { Redirect, router } from 'expo-router';

import { useState } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import AuthHeader from '../../components/common/AuthHeader';

import { OtpInput, type OtpStatus } from '../../components/form/OtpInput';

import { BackButton } from '../../components/ui/BackButton';

import { Button } from '../../components/ui/Button';

import { useAppSession } from '../../context/AppSessionContext';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

import { getTypography } from '../../theme/typography';

const OTP_LENGTH = 6;

export default function ResetPasswordVerificationScreen() {
  const {
    resetPasswordEmail,

    verifyPasswordResetCode,
    resendPasswordResetCode,
  } = useAppSession();

  const [code, setCode] = useState('');

  const [status, setStatus] = useState<OtpStatus>('default');

  const [shakeTrigger, setShakeTrigger] = useState(0);

  const [error, setError] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);

  const [isResending, setIsResending] = useState(false);

  if (!resetPasswordEmail) {
    return <Redirect href="/(auth)/forgot-password" />;
  }

  const verifyCode = async (value: string) => {
    if (isVerifying || value.length !== OTP_LENGTH) {
      return;
    }

    try {
      setIsVerifying(true);
      setError('');
      setStatus('default');

      await verifyPasswordResetCode(value);

      setStatus('success');

      setShakeTrigger((current) => current + 1);

      setTimeout(() => {
        router.replace('/(auth)/CreateNewPasswordScreen');
      }, 500);
    } catch (error) {
      setStatus('error');

      setShakeTrigger((current) => current + 1);

      setError(
        error instanceof Error
          ? error.message
          : 'The verification code is invalid or expired.',
      );

      setIsVerifying(false);
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value);

    setStatus('default');
    setError('');

    if (value.length === OTP_LENGTH) {
      void verifyCode(value);
    }
  };

  const handleResend = async () => {
    if (isResending) {
      return;
    }

    try {
      setIsResending(true);

      setCode('');
      setError('');
      setStatus('default');

      await resendPasswordResetCode();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to resend verification code.',
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BackButton onPress={() => router.back()} />

        <View style={styles.content}>
          <AuthHeader
            title="Enter verification code"
            description={`We sent a 6-digit verification code to\n${resetPasswordEmail}`}
          />

          <OtpInput
            value={code}
            length={OTP_LENGTH}
            status={status}
            shakeTrigger={shakeTrigger}
            disabled={isVerifying}
            onChangeText={handleCodeChange}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={isResending}
            hitSlop={8}
            onPress={() => {
              void handleResend();
            }}
          >
            <Text style={styles.resend}>
              {isResending ? 'Resending...' : 'Resend code'}
            </Text>
          </Pressable>
        </View>

        <Button
          title={isVerifying ? 'Verifying...' : 'Verify code'}
          variant="primary"
          loading={isVerifying}
          disabled={code.length !== OTP_LENGTH}
          onPress={() => {
            void verifyCode(code);
          }}
        />
      </View>
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
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },

  content: {
    flex: 1,
    gap: spacing[6],
    marginTop: spacing[12],
  },

  error: {
    ...getTypography('bodySmall'),

    color: colors.error.base,

    textAlign: 'center',
  },

  resend: {
    ...getTypography('bodyMedium', 'semiBold'),

    color: colors.primary[100],

    textAlign: 'center',
  },
});
