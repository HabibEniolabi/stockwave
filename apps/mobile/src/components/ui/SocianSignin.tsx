import { Platform, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import Apple from '../../assets/icons/Apple';
import Google from '../../assets/icons/Google';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';
import { AppIcon } from '../icons/AppIcon';

type SocialProvider = {
  id: string;
  title: string;
  icon: ReactNode;
  onPress: () => void;
};

type SocialSignInProps = {
  onGooglePress: () => void;
  onApplePress: () => void;
  onPhonePress: () => void;
  /** Blocks both buttons while a sign-in is mid-flight. */
  busyProvider?: string | null;
};

export function SocialSignIn({
  onGooglePress,
  onApplePress,
  onPhonePress,
  busyProvider = null,
}: SocialSignInProps) {
  /**
   * Android gets Google alone, on purpose. A Google account is required to use
   * the Play Store, so a second provider adds no coverage — it only adds ways
   * for one person to end up with two accounts, which in a money app is a
   * support problem, not a design flourish.
   *
   * iOS gets Apple because App Store review requires it alongside any other
   * third-party sign-in.
   */
  const providers: SocialProvider[] = [
    {
      id: 'google',
      title: 'Continue with Google',
      icon: <Google width={24} height={24} />,
      onPress: onGooglePress,
    },
    ...(Platform.OS === 'ios'
      ? [
          {
            id: 'apple',
            title: 'Continue with Apple',
            icon: <Apple width={24} height={24} />,
            onPress: onApplePress,
          },
        ]
      : [
        {
          id: 'phone',
          title: 'Continue with Phone',
          icon: <AppIcon name="phone" size={26} color={colors.neutral[900]} />,
          onPress: onPhonePress,
        },
      ]),
  ];

  return (
    <View>
      <View style={styles.divider}>
        <View style={styles.rule} />
        <Text style={styles.dividerLabel}>Or continue with</Text>
        <View style={styles.rule} />
      </View>

      <View style={styles.providers}>
        {providers.map((provider) => (
          <Button
            key={provider.id}
            title={provider.title}
            variant="social"
            leftIcon={provider.icon}
            loading={busyProvider === provider.id}
            disabled={busyProvider !== null && busyProvider !== provider.id}
            onPress={provider.onPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[6],
  },

  rule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[100],
  },

  dividerLabel: {
    ...getTypography('bodyMedium'),
    color: colors.neutral[500],
  },

  /**
   * `gap` rather than `space-between` or fixed heights — the block sizes to
   * however many providers it was handed, so Android's single button reads as
   * deliberate instead of as a row with something missing.
   */
  providers: {
    gap: spacing[3],
  },
});