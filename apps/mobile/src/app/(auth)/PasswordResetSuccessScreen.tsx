import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { SuccessInfo } from '../../components/common/SuccessInfo';

import { AppIcon } from '../../components/icons/AppIcon';

import { Button } from '../../components/ui/Button';

import { colors } from '../../theme/colors';

export default function PasswordResetSuccessScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <SuccessInfo
        icon={
          <AppIcon name="checkmark" size={72} color={colors.success.base} />
        }
        title="Password changed!"
        description="Your password has been successfully updated."
        footer={
          <Button
            title="Back to sign in"
            variant="primary"
            onPress={() => router.replace('/(auth)/sign-in')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: colors.other.white,
  },
});
