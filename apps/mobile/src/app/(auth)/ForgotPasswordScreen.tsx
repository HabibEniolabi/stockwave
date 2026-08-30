import { router } from 'expo-router';
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

export default function ForgotPasswordScreen() {
  const { startPasswordReset } = useAppSession();

  const [email, setEmail] = useState('');

  const [emailError, setEmailError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (isSubmitting) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    setEmailError('');

    if (!normalizedEmail) {
      setEmailError('Email address is required.');

      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setEmailError('Enter a valid email address.');

      return;
    }

    try {
      setIsSubmitting(true);

      await startPasswordReset(normalizedEmail);

      router.push('/(auth)/ResetPasswordVerificationScreen');
    } catch (error) {
      setEmailError(
        error instanceof Error
          ? error.message
          : 'Unable to start password recovery.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <BackButton onPress={() => router.back()} />

        <View style={styles.content}>
          <AuthHeader
            title="Forgot password?"
            description="Enter your email address and we'll send you a verification code."
          />

          <TextField
            placeholder="Email"
            value={email}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="done"
            onSubmitEditing={() => {
              void handleContinue();
            }}
            onChangeText={(value) => {
              setEmail(value);

              if (emailError) {
                setEmailError('');
              }
            }}
          />
        </View>

        <Button
          title="Continue"
          variant="primary"
          loading={isSubmitting}
          disabled={!email.trim()}
          onPress={() => {
            void handleContinue();
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
    gap: spacing[8],
    marginTop: spacing[12],
  },
});
