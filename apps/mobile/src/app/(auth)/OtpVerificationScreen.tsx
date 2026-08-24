import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
const SUCCESS_DELAY = 900;
const RESEND_COOLDOWN = 60;

export default function OtpVerificationScreen() {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  const [otpStatus, setOtpStatus] = useState<OtpStatus>('default');

  const [shakeTrigger, setShakeTrigger] = useState(0);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);

  const { pendingPhone, verifyPhoneCode, resendPhoneCode } = useAppSession();

  /*
   * Resend countdown.
   */
  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [resendCooldown]);

 
  const verifyCode = async (code: string) => {
    if (isVerifying || code.length !== OTP_LENGTH) {
      return;
    }

    if (!pendingPhone) {
      setOtpStatus('error');
      setShakeTrigger((current) => current + 1);

      setError('Unable to find the phone number being verified.');

      return;
    }

    try {
      setError('');
      setOtpStatus('default');
      setIsVerifying(true);

      await verifyPhoneCode(code);

      setOtpStatus('success');
      setShakeTrigger((current) => current + 1);

      /*
       * Leave the green success state visible
       * briefly before navigation.
       */
      setTimeout(() => {
        router.replace('/(auth)/WelcomeScreen');
      }, SUCCESS_DELAY);
    } catch (error) {
      console.error('PHONE OTP VERIFICATION ERROR', error);

      const message =
        error instanceof Error
          ? error.message
          : 'The verification code is incorrect.';

      setOtpStatus('error');
      setShakeTrigger((current) => current + 1);
      setError(message);

      setIsVerifying(false);
    }
  };

  const handleCodeChange = (value: string) => {
    setVerificationCode(value);

    if (otpStatus !== 'default') {
      setOtpStatus('default');
    }

    if (error) {
      setError('');
    }

    /*
     * Automatically verify when the sixth
     * digit has been entered.
     */
    if (value.length === OTP_LENGTH) {
      void verifyCode(value);
    }
  };

  const handleVerifyCode = () => {
    if (isVerifying) {
      return;
    }

    setError('');

    if (verificationCode.length !== OTP_LENGTH) {
      setOtpStatus('error');
      setShakeTrigger((current) => current + 1);

      setError(`Enter the ${OTP_LENGTH}-digit verification code.`);

      return;
    }

    void verifyCode(verificationCode);
  };

  
  const handleResendCode = async () => {
    if (isResending || resendCooldown > 0) {
      return;
    }

    if (!pendingPhone) {
      setError('Unable to find the phone number being verified.');

      return;
    }

    try {
      setIsResending(true);

      /*
       * Clear the previous OTP entry/state.
       */
      setVerificationCode('');
      setError('');
      setOtpStatus('default');

      await resendPhoneCode();

      /*
       * Start another cooldown only after
       * Supabase successfully accepts the request.
       */
      setResendCooldown(RESEND_COOLDOWN);
    } catch (error) {
      console.error('RESEND PHONE OTP ERROR', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to resend the verification code.';

      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  const codeIsIncomplete = verificationCode.length !== OTP_LENGTH;

  const resendDisabled = isResending || resendCooldown > 0 || isVerifying;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton
            onPress={() => {
              router.back();
            }}
          />

          <View style={styles.mainContent}>
            <AuthHeader
              title="Enter verification code"
              description={
                'We have sent the verification code to your\nmobile number'
              }
            />

            <View style={styles.otpSection}>
              <OtpInput
                value={verificationCode}
                onChangeText={handleCodeChange}
                length={OTP_LENGTH}
                status={otpStatus}
                shakeTrigger={shakeTrigger}
                disabled={isVerifying}
                autoFocus
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.resendContainer}>
                <Text style={styles.resendQuestion}>
                  Didn&apos;t receive the code?
                </Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Resend verification code"
                  hitSlop={8}
                  disabled={resendDisabled}
                  onPress={() => {
                    void handleResendCode();
                  }}
                >
                  <Text
                    style={[
                      styles.resendText,
                      resendDisabled && styles.resendTextDisabled,
                    ]}
                  >
                    {isResending
                      ? 'Resending...'
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : 'Resend code'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              title={isVerifying ? 'Verifying...' : 'Verify Account'}
              variant="primary"
              loading={isVerifying}
              disabled={codeIsIncomplete || isVerifying}
              onPress={handleVerifyCode}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.other.white,
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },

  mainContent: {
    marginTop: spacing[12],
  },

  otpSection: {
    marginTop: spacing[8],
  },

  errorText: {
    ...getTypography('bodySmall'),
    marginTop: spacing[2],
    color: colors.error.base,
    textAlign: 'center',
  },

  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    marginTop: spacing[6],
  },

  resendQuestion: {
    ...getTypography('bodyMedium'),
    color: colors.neutral[500],
  },

  resendText: {
    ...getTypography('bodyMedium', 'semiBold'),
    color: colors.primary[100],
  },

  resendTextDisabled: {
    color: colors.neutral[400],
  },

  footer: {
    marginTop: 'auto',
    paddingTop: spacing[8],
  },
});
