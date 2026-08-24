import { Platform, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import Apple from '../../assets/icons/Apple';
import Google from '../../assets/icons/Google';

import { Button } from './Button';
import { AppIcon } from '../icons/AppIcon';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

type AlternativeProviderId = 'google' | 'apple' | 'phone';

type AlternativeProvider = {
  id: AlternativeProviderId;
  title: string;
  icon: ReactNode;
  onPress: () => void;
};

type AlternativeSignInProps = {
  onGooglePress: () => void;
  onApplePress: () => void;
  onPhonePress: () => void;

  busyProvider?: AlternativeProviderId | null;
};

export function AlternativeSignIn({
  onGooglePress,
  onApplePress,
  onPhonePress,
  busyProvider = null,
}: AlternativeSignInProps) {
  const providers: AlternativeProvider[] = [
    {
      id: 'google',
      title: 'Continue with Google',
      icon: <Google width={24} height={24} />,
      onPress: onGooglePress,
    },

    ...(Platform.OS === 'ios'
      ? [
          {
            id: 'apple' as const,
            title: 'Continue with Apple',
            icon: <Apple width={24} height={24} />,
            onPress: onApplePress,
          },
        ]
      : [
          {
            id: 'phone' as const,
            title: 'Continue with Phone',
            icon: (
              <AppIcon name="phone" size={26} color={colors.neutral[900]} />
            ),
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

  providers: {
    gap: spacing[3],
  },
});
