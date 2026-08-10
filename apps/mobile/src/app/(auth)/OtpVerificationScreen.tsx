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
import { OtpPreviewModal } from '../../components/ui/OtpPreviewModal';
import { BackButton } from '../../components/ui/BackButton';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';
import { useAppSession } from '../../context/AppSessionContext';

const OTP_LENGTH = 6;
const OTP_PREVIEW_DURATION = 6000;

export default function OtpVerificationScreen() {
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);

  const [otpStatus, setOtpStatus] = useState<OtpStatus>('default');
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const VERIFY_DELAY = 700;
  const SUCCESS_DELAY = 900;

  const { completePhoneVerification } = useAppSession();

  useEffect(() => {
    // Opening the modal generates a new random OTP.
    setOtpModalVisible(true);
  }, []);

  const verifyCode = (code: string) => {
    if (isVerifying || code.length !== OTP_LENGTH) {
      return;
    }

    setError('');
    setIsVerifying(true);

    // Temporary delay so the loading state is visible.
    setTimeout(() => {
      if (code !== generatedOtp) {
        setOtpStatus('error');
        setShakeTrigger((current) => current + 1);
        setError('The verification code is incorrect.');
        setIsVerifying(false);
        return;
      }

      setOtpStatus('success');

      // Show the green state briefly before navigating.
      setTimeout(() => {
        router.replace('/(auth)/WelcomeScreen');
      }, 700);
    }, 400);
  };

  const handleCodeChange = (value: string) => {
    setVerificationCode(value);

    if (otpStatus !== 'default') {
      setOtpStatus('default');
    }

    if (error) {
      setError('');
    }

    // Automatically verify immediately after the sixth digit.
    if (value.length === OTP_LENGTH) {
      verifyCode(value);
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

    setIsVerifying(true);
    setOtpStatus('default');

    // Hold briefly while showing "Verifying..."
    setTimeout(() => {
      if (verificationCode !== generatedOtp) {
        setOtpStatus('error');
        setShakeTrigger((current) => current + 1);
        setError('The verification code is incorrect.');
        setIsVerifying(false);
        return;
      }

      // Turn the boxes green and trigger a lighter wiggle.
      setOtpStatus('success');
      setShakeTrigger((current) => current + 1);

      //Update dumpy aplication statw
      completePhoneVerification();

      // Keep the success state visible before navigating.
      setTimeout(() => {
        router.replace('/(auth)/WelcomeScreen');
      }, SUCCESS_DELAY);
    }, VERIFY_DELAY);
  };

  const handleResendCode = () => {
    setVerificationCode('');
    setGeneratedOtp('');
    setError('');

    setOtpStatus('default');
    setOtpModalVisible(true);
  };

  const codeIsIncomplete = verificationCode.length !== OTP_LENGTH;

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
          <BackButton onPress={() => router.back()} />

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
                  onPress={handleResendCode}
                >
                  <Text style={styles.resendText}>Resend code</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              title={isVerifying ? 'Verifying...' : 'Verify Account'}
              variant="primary"
              loading={isVerifying}
              disabled={codeIsIncomplete}
              onPress={handleVerifyCode}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OtpPreviewModal
        visible={otpModalVisible}
        length={OTP_LENGTH}
        duration={OTP_PREVIEW_DURATION}
        onCodeGenerated={(code) => {
          setGeneratedOtp(code);
        }}
        onClose={() => {
          setOtpModalVisible(false);
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

  footer: {
    marginTop: 'auto',
    paddingTop: spacing[8],
  },
});
