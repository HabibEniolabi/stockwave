import {
  Text,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import AuthHeader from '../../components/common/AuthHeader';
import StockWave from '../../assets/icons/StockWave';
import { TextField } from '../../components/form/TextField';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { getTypography } from '../../theme/typography';
import { SocialSignIn } from '../../components/ui/SocianSignin';
import { signUpWithEmail } from '../../services/auth';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  // ...existing code...
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');

const handleContinue = async () => {
  if (isSigningUp) {
    return;
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  setUsernameError('');
  setEmailError('');
  setPasswordError('');

  if (!normalizedUsername) {
    setUsernameError('Username is required.');
    return;
  }

  if (normalizedUsername.length < 3) {
    setUsernameError('Username must be at least 3 characters.');
    return;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
    setUsernameError('Username can only contain letters, numbers and underscores.');
    return;
  }

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
    setIsSigningUp(true);

    await signUpWithEmail(email, password, {
      first_name: firstName,
      last_name: lastName,
    });

    router.push('/(auth)/PhoneNumberScreen');
  } catch (error) {
    // show error
  } finally {
    setIsSigningUp(false);
  }
};

  const handleGoogleSignUp = () => {
    console.log('Continue with Google');
  };

  const handleAppleSignUp = () => {
    console.log('Continue with Apple');
  };

  const handlePhoneSignUp = () => {
    router.push({
      pathname: '/(auth)/PhoneAuthScreen',
      params: {
        mode: 'sign-up',
      },
    });
  };

  const formIsComplete = !email.trim() || !password || !username.trim();
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
                }}
              />
              <TextField
                placeholder="Password"
                value={password}
                error={passwordError}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                // autoComplete="new-password"
                // textContentType="newPassword"
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
                }}
              />
            </View>
            <Button
              title="Continue"
              onPress={handleContinue}
              loading={isSigningUp}
              disabled={formIsComplete}
              variant="primary"
            />

            <SocialSignIn
              onGooglePress={handleGoogleSignUp}
              onApplePress={handleAppleSignUp}
              onPhonePress={handlePhoneSignUp}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push('/(auth)/sign-in')}
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

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[100],
  },

  dividerText: {
    ...getTypography('bodyLarge'),
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
