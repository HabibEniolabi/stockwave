import { Redirect, router } from 'expo-router';

import { useState, useEffect } from 'react';

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
import { OtpPreviewModal } from '../../components/ui/OtpPreviewModal';

const OTP_LENGTH = 6;

export default function ResetPasswordVerificationScreen() {
  const {
    resetPasswordEmail,
    passwordResetPreviewCode,
    verifyPasswordResetCode,
    resendPasswordResetCode,
    expirePasswordResetCode,
  } = useAppSession();

  const [code, setCode] = useState('');
  const [status, setStatus] = useState<OtpStatus>('default');
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [isPreviewVisible, setIsPreviewVisible] = useState(
    Boolean(passwordResetPreviewCode),
  );

  useEffect(() => {
    if (passwordResetPreviewCode) {
      setIsPreviewVisible(true);
    }
  }, [passwordResetPreviewCode]);

  if (!resetPasswordEmail) {
    return <Redirect href="/(auth)/ForgotPasswordScreen" />;
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
    if (isResending || isVerifying) {
      return;
    }

    try {
      setIsResending(true);

      setCode('');
      setError('');
      setStatus('default');

      await resendPasswordResetCode();

      setIsPreviewVisible(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to generate a new verification code.',
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewVisible(false);
  };

  const handlePreviewExpire = () => {
    setIsPreviewVisible(false);

    expirePasswordResetCode();

    setCode('');
    setStatus('default');

    setError('The verification code has expired. Generate a new code.');
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <BackButton onPress={() => router.back()} />

          <View style={styles.content}>
            <AuthHeader
              title="Enter verification code"
              description="Enter the 6-digit recovery code shown below "
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
              disabled={isResending || isVerifying}
              hitSlop={8}
              onPress={() => {
                void handleResend();
              }}
            >
              <Text style={styles.resend}>
                {isResending ? 'Generating...' : 'Generate new code'}
              </Text>
            </Pressable>
          </View>

          <Button
            title={isVerifying ? 'Verifying...' : 'Verify code'}
            variant="primary"
            loading={isVerifying}
            disabled={isVerifying || code.length !== OTP_LENGTH}
            onPress={() => {
              void verifyCode(code);
            }}
          />
        </View>
      </SafeAreaView>
      <OtpPreviewModal
        visible={isPreviewVisible}
        code={passwordResetPreviewCode}
        onClose={handleClosePreview}
        onExpire={handlePreviewExpire}
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
