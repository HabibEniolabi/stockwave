import {
  Text,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import StockWave from '../../assets/icons/StockWave';

import AuthHeader from '../../components/common/AuthHeader';
import { TextField } from '../../components/form/TextField';
import { Button } from '../../components/ui/Button';
import { AlternativeSignIn } from '../../components/ui/AlternativeSignin';

import { useAppSession } from '../../context/AppSessionContext';

import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { getTypography } from '../../theme/typography';

type Provider = 'google' | 'apple' | 'phone';

export default function SignUpScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  const [isSigningUp, setIsSigningUp] = useState(false);

  const { signUp } = useAppSession();

  const [busyProvider, setBusyProvider] = useState<Provider | null>(null);

  const handleContinue = async () => {
    if (isSigningUp) {
      return;
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setFormError('');

    /*
     * Username validation
     */
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

    /*
     * Email validation
     */
    if (!normalizedEmail) {
      setEmailError('Email address is required.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    /*
     * Password validation
     */
    if (!password) {
      setPasswordError('Password is required.');
      return;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    try {
      setIsSigningUp(true);

      await signUp({
        username: normalizedUsername,
        email: normalizedEmail,
        password,
      });

      router.replace('/(auth)/PhoneNumberScreen');
    } catch (error) {
      console.error('SIGN UP ERROR', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create your account. Please try again.';

      setFormError(message);
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignUp = () => {
    try {
      setBusyProvider('google');

      // Later:
      // await signInWithGoogle();
    } catch (error) {
      console.error('Google sign up failed:', error);
    } finally {
      setBusyProvider(null);
    }
  };

  const handleAppleSignUp = () => {
    try {
      setBusyProvider('apple');

      // Later:
      // await signInWithApple();
    } catch (error) {
      console.error('Apple sign up failed:', error);
    } finally {
      setBusyProvider(null);
    }
  };

  const handlePhoneSignUp = () => {
    router.push({
      pathname: '/(auth)/PhoneAuthScreen',
      params: {
        mode: 'sign-up',
      },
    });
  };

  const formIsIncomplete = !username.trim() || !email.trim() || !password;

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
          <View style={styles.mainContent}>
            <AuthHeader
              icon={<StockWave width={32} height={32} />}
              title="Join StockWave!"
              description={
                'Embark on your investment journey with a\nsingle dollar.'
              }
            />

            <View style={styles.form}>
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

                  if (formError) {
                    setFormError('');
                  }
                }}
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
                returnKeyType="next"
                onChangeText={(value) => {
                  setEmail(value);

                  if (emailError) {
                    setEmailError('');
                  }

                  if (formError) {
                    setFormError('');
                  }
                }}
              />

              <TextField
                placeholder="Password"
                value={password}
                error={passwordError}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleContinue}
                {...Platform.select({
                  ios: {
                    textContentType: 'none' as const,
                  },
                  android: {
                    autoComplete: 'new-password' as const,
                    importantForAutofill: 'yes' as const,
                  },
                })}
                returnKeyType="done"
                onChangeText={(value) => {
                  setPassword(value);

                  if (passwordError) {
                    setPasswordError('');
                  }

                  if (formError) {
                    setFormError('');
                  }
                }}
              />
            </View>

            {formError ? (
              <Text style={styles.formError}>{formError}</Text>
            ) : null}

            <Button
              title="Continue"
              variant="primary"
              loading={isSigningUp}
              disabled={formIsIncomplete || isSigningUp}
              onPress={handleContinue}
            />

            <AlternativeSignIn
              onGooglePress={handleGoogleSignUp}
              onApplePress={handleAppleSignUp}
              onPhonePress={handlePhoneSignUp}
              busyProvider={busyProvider}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>

            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                router.replace('/(auth)/sign-in');
              }}
            >
              <Text style={styles.footerLink}>Sign in</Text>
            </Pressable>
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
    paddingTop: spacing[8],
    paddingBottom: spacing[4],
  },

  mainContent: {
    gap: spacing[10],
    marginTop: spacing[12],
  },

  form: {
    gap: spacing[4],
  },

  formError: {
    ...getTypography('bodySmall'),
    color: colors.error.base,
    textAlign: 'center',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    marginTop: 'auto',
    paddingTop: spacing[8],
  },

  footerText: {
    ...getTypography('bodyMedium'),
    color: colors.neutral[500],
  },

  footerLink: {
    ...getTypography('bodyMedium', 'semiBold'),
    color: colors.primary[100],
  },
});
