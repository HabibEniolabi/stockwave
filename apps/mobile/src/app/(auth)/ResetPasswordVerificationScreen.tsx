import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthHeader from '../../components/common/AuthHeader';
import {
  OtpInput,
  type OtpStatus,
} from '../../components/form/OtpInput';
import { BackButton } from '../../components/ui/BackButton';
import { Button } from '../../components/ui/Button';
import { OtpPreviewModal } from '../../components/ui/OtpPreviewModal';
import { useAppSession } from '../../context/AppSessionContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

const OTP_LENGTH = 6;

export default function ResetPasswordVerificationScreen() {
  const {
    resetPasswordEmail,
    setResetPasswordCode,
    verifyPasswordResetCode,
  } = useAppSession();

  const [code, setCode] = useState('');
  const [generatedOtp, setGeneratedOtp] =
    useState('');

  const [status, setStatus] =
    useState<OtpStatus>('default');

  const [shakeTrigger, setShakeTrigger] =
    useState(0);

  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] =
    useState(false);

  const [modalVisible, setModalVisible] =
    useState(false);

  useEffect(() => {
    setModalVisible(true);
  }, []);

  const handleVerify = () => {
    if (isVerifying) {
      return;
    }

    if (code.length !== OTP_LENGTH) {
      setStatus('error');
      setShakeTrigger((current) => current + 1);
      setError('Enter the 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setError('');

    setTimeout(() => {
      if (code !== generatedOtp) {
        setStatus('error');
        setShakeTrigger((current) => current + 1);
        setError(
          'The verification code is incorrect.',
        );
        setIsVerifying(false);
        return;
      }

      setStatus('success');
      setShakeTrigger((current) => current + 1);

      setResetPasswordCode(code);
      verifyPasswordResetCode();

      setTimeout(() => {
        router.replace(
          '/(auth)/CreateNewPasswordScreen',
        );
      }, 800);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BackButton onPress={() => router.back()} />

        <View style={styles.content}>
          <AuthHeader
            title="Enter verification code"
            description={
              `We sent a 6-digit verification code to\n${resetPasswordEmail}`
            }
          />

          <OtpInput
            value={code}
            length={OTP_LENGTH}
            status={status}
            shakeTrigger={shakeTrigger}
            disabled={isVerifying}
            onChangeText={(value) => {
              setCode(value);
              setStatus('default');
              setError('');
            }}
          />

          {error ? (
            <Text style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.resend}>
              Resend code
            </Text>
          </Pressable>
        </View>

        <Button
          title={
            isVerifying
              ? 'Verifying...'
              : 'Verify code'
          }
          loading={isVerifying}
          disabled={code.length !== OTP_LENGTH}
          onPress={handleVerify}
        />
      </View>

      <OtpPreviewModal
        visible={modalVisible}
        length={OTP_LENGTH}
        duration={6000}
        onCodeGenerated={setGeneratedOtp}
        onClose={() => setModalVisible(false)}
      />
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
  },
});