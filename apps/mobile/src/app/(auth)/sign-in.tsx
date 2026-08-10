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
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';
import { SocialSignIn } from '../../components/ui/SocianSignin';
import { useAppSession } from '../../context/AppSessionContext';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { completeSignIn } = useAppSession();

  const handleSignIn = () => {
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

    completeSignIn();

    console.log({
      email: normalizedEmail,
      password,
    });

    // Replace this with your authentication request later.
    router.replace('/(tabs)/home');
  };

  const handleGoogleSignIn = () => {
    console.log('Continue with Google');
  };

  const handleAppleSignIn = () => {
    console.log('Continue with Apple');
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

              <View>
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
            </View>

            <Button
              title="Sign in"
              variant="primary"
              disabled={formIsIncomplete}
              onPress={handleSignIn}
            />

            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              style={styles.forgotPasswordButton}
              onPress={() => {
                router.push('/(auth)/ResetPasswordVerificationScreen');
              }}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>

            <SocialSignIn
              onGooglePress={handleGoogleSignIn}
              onApplePress={handleAppleSignIn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>

            <Pressable
              accessibilityRole="button"
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
    marginTop: spacing[2],
  },

  forgotPasswordText: {
    ...getTypography('bodyMedium', 'semiBold'),
    color: colors.primary[100],
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[100],
  },

  dividerText: {
    ...getTypography('bodySmall'),
    color: colors.neutral[400],
  },

  socialButtons: {
    gap: spacing[3],
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
