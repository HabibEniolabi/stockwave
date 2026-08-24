import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StockWave from '../../assets/icons/StockWave';
import AuthHeader from '../../components/common/AuthHeader';
import { TextField } from '../../components/form/TextField';
import { BackButton } from '../../components/ui/BackButton';
import { Button } from '../../components/ui/Button';

import { useAppSession } from '../../context/AppSessionContext';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type PhoneAuthMode = 'sign-in' | 'sign-up';

const normalizePhone = (value: string) => value.replace(/[\s()-]/g, '');

const isValidPhone = (value: string) => /^\+[1-9]\d{7,14}$/.test(value);

export default function PhoneAuthScreen() {
  const { mode: modeParam } = useLocalSearchParams<{
    mode?: string;
  }>();

  const mode: PhoneAuthMode = modeParam === 'sign-up' ? 'sign-up' : 'sign-in';

  const isSignUp = mode === 'sign-up';

  const { startPhoneAuth } = useAppSession();

  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');

  const [phoneError, setPhoneError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (isSubmitting) {
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    const normalizedUsername = username.trim();

    setPhoneError('');
    setUsernameError('');

    if (isSignUp) {
      if (!normalizedUsername) {
        setUsernameError('Username is required.');
        return;
      }

      if (normalizedUsername.length < 3) {
        setUsernameError('Username must be at least 3 characters.');
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
        setUsernameError(
          'Username can only contain letters, numbers and underscores.',
        );
        return;
      }
    }

    if (!normalizedPhone) {
      setPhoneError('Phone number is required.');
      return;
    }

    if (!isValidPhone(normalizedPhone)) {
      setPhoneError('Enter a valid phone number including country code.');
      return;
    }

    try {
      setIsSubmitting(true);

      await startPhoneAuth(normalizedPhone, mode);

      router.push({
        pathname: '/(auth)/PhoneOtpScreen',
        params: {
          phone: normalizedPhone,
          mode,
          ...(isSignUp
            ? {
                username: normalizedUsername,
              }
            : {}),
        },
      });
    } catch (error) {
      setPhoneError(
        error instanceof Error
          ? error.message
          : 'Unable to send verification code.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formIsIncomplete = !phone.trim() || (isSignUp && !username.trim());

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
              icon={<StockWave width={32} height={32} />}
              title={isSignUp ? 'Sign up with phone' : 'Sign in with phone'}
              description={
                isSignUp
                  ? 'Create your StockWave account using your mobile number.'
                  : 'Enter your mobile number to continue to StockWave.'
              }
            />

            <View style={styles.form}>
              {isSignUp ? (
                <TextField
                  placeholder="Username"
                  value={username}
                  error={usernameError}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  returnKeyType="next"
                  onChangeText={(value) => {
                    setUsername(value);

                    if (usernameError) {
                      setUsernameError('');
                    }
                  }}
                />
              ) : null}

              <TextField
                placeholder="+234 801 234 5678"
                value={phone}
                error={phoneError}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                onChangeText={(value) => {
                  setPhone(value);

                  if (phoneError) {
                    setPhoneError('');
                  }
                }}
              />
            </View>

            <Button
              title="Continue"
              variant="primary"
              loading={isSubmitting}
              disabled={formIsIncomplete}
              onPress={handleContinue}
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
    gap: spacing[8],
    marginTop: spacing[8],
  },

  form: {
    gap: spacing[4],
  },
});
