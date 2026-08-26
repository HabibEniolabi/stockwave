import { router } from 'expo-router';
import { useState } from 'react';

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

import StockWave from '../../assets/icons/StockWave';

import AuthHeader from '../../components/common/AuthHeader';
import { TextField } from '../../components/form/TextField';

import { AlternativeSignIn } from '../../components/ui/AlternativeSignIn';
import { Button } from '../../components/ui/Button';

import { useAppSession } from '../../context/AppSessionContext';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

type Provider = 'google' | 'apple';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [isSigningIn, setIsSigningIn] = useState(false);

  const [busyProvider, setBusyProvider] = useState<Provider | null>(null);

  const { signIn } = useAppSession();

  const handleSignIn = async () => {
    if (isSigningIn) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    setEmailError('');
    setPasswordError('');

    if (!normalizedEmail) {
      setEmailError('Email address is required.');

      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setEmailError('Enter a valid email address.');

      return;
    }

    if (!password) {
      setPasswordError('Password is required.');

      return;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');

      return;
    }

    try {
      setIsSigningIn(true);

      await signIn(normalizedEmail, password);

      /*
       * TabsLayout becomes the single source
       * of truth for authenticated routing.
       *
       * It will decide whether this user needs:
       *
       * PhoneNumberScreen
       * OtpVerificationScreen
       * WelcomeScreen
       * UnlockPinScreen
       * or Home.
       */
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('SIGN IN ERROR', error);

      setPasswordError(
        error instanceof Error ? error.message : 'Unable to sign in.',
      );

      setIsSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (busyProvider) {
      return;
    }

    try {
      setBusyProvider('google');

      // Later:
      // await signInWithGoogle();
    } catch (error) {
      console.error('GOOGLE SIGN IN ERROR', error);
    } finally {
      setBusyProvider(null);
    }
  };

  const handleAppleSignIn = async () => {
    if (busyProvider) {
      return;
    }

    try {
      setBusyProvider('apple');

      // Later:
      // await signInWithApple();
    } catch (error) {
      console.error('APPLE SIGN IN ERROR', error);
    } finally {
      setBusyProvider(null);
    }
  };

  const formIsIncomplete = !email.trim() || !password;

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
              title="Hey there!👋"
              description="Sign in to continue your investment journey."
            />

            <View style={styles.form}>
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
                }}
              />

              <TextField
                placeholder="Password"
                value={password}
                error={passwordError}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
                onChangeText={(value) => {
                  setPassword(value);

                  if (passwordError) {
                    setPasswordError('');
                  }
                }}
              />
            </View>

            <Button
              title="Sign in"
              variant="primary"
              loading={isSigningIn}
              disabled={formIsIncomplete || isSigningIn}
              onPress={handleSignIn}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              hitSlop={8}
              style={styles.forgotPasswordButton}
              onPress={() => {
                router.push('/(auth)/ForgotPasswordScreen');
              }}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>

            <AlternativeSignIn
              onGooglePress={handleGoogleSignIn}
              onApplePress={handleAppleSignIn}
              busyProvider={busyProvider} 
              onPhonePress={() => {console.log("No auth here!")}}         
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign up"
              hitSlop={8}
              onPress={() => {
                router.replace('/(auth)/sign-up');
              }}
            >
              <Text style={styles.footerLink}>Sign up</Text>
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
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
  },

  mainContent: {
    gap: spacing[6],
    marginTop: spacing[10],
  },

  form: {
    gap: spacing[4],
  },

  forgotPasswordButton: {
    alignSelf: 'flex-end',
  },

  forgotPasswordText: {
    ...getTypography('bodyMedium', 'semiBold'),
    color: colors.primary[100],
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
