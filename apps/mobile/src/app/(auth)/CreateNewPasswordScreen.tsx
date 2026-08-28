import { Redirect, router } from 'expo-router';

import { useState } from 'react';

import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import AuthHeader from '../../components/common/AuthHeader';

import { TextField } from '../../components/form/TextField';

import { BackButton } from '../../components/ui/BackButton';

import { Button } from '../../components/ui/Button';

import { useAppSession } from '../../context/AppSessionContext';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function CreateNewPasswordScreen() {
  const { resetPasswordVerified, completePasswordReset } = useAppSession();

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordError, setPasswordError] = useState('');

  const [confirmError, setConfirmError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!resetPasswordVerified) {
    return <Redirect href="/(auth)/ForgotPasswordScreen" />;
  }

  const handleResetPassword = async () => {
    if (isSubmitting) {
      return;
    }

    setPasswordError('');
    setConfirmError('');

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');

      return;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');

      return;
    }

    try {
      setIsSubmitting(true);

      await completePasswordReset(password);

      router.replace('/(auth)/PasswordResetSuccessScreen');
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : 'Unable to update your password.',
      );

      setIsSubmitting(false);
    }
  };

  const formIncomplete = !password || !confirmPassword;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <BackButton onPress={() => router.back()} />

        <View style={styles.content}>
          <AuthHeader
            title="Create new password"
            description="Your new password must be different from your previous password."
          />

          <View style={styles.form}>
            <TextField
              placeholder="New password"
              secureTextEntry
              value={password}
              error={passwordError}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onChangeText={(value) => {
                setPassword(value);

                if (passwordError) {
                  setPasswordError('');
                }
              }}
            />

            <TextField
              placeholder="Confirm new password"
              secureTextEntry
              value={confirmPassword}
              error={confirmError}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={() => {
                void handleResetPassword();
              }}
              onChangeText={(value) => {
                setConfirmPassword(value);

                if (confirmError) {
                  setConfirmError('');
                }
              }}
            />
          </View>
        </View>

        <Button
          title="Reset password"
          variant="primary"
          loading={isSubmitting}
          disabled={formIncomplete}
          onPress={() => {
            void handleResetPassword();
          }}
        />
      </KeyboardAvoidingView>
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
    marginTop: spacing[12],
  },

  form: {
    gap: spacing[4],
    marginTop: spacing[8],
  },
});
