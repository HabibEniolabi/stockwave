import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SuccessInfo } from '../../components/common/SuccessInfo';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { getTypography } from '../../theme/typography';
import { ConfettiAnimation } from '../../components/animations/ConfettiAnimation';
import { StockWaveSuccessMark } from '../../components/branding/StockWaveSuccessMark';
import { useAppSession } from '../../context/AppSessionContext';

export default function WelcomeScreen() {
  const {
    completeWelcome,
    isAuthenticated,
    hasSeenWelcome
  } = useAppSession();

  console.log('WELCOME SESSION', {
    isAuthenticated,
    hasSeenWelcome,
  });

  const handleContinue = () => {
    completeWelcome();

    router.replace('/(tabs)/home');
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <SuccessInfo
        icon={<StockWaveSuccessMark size={96} />}
        title={
          <Text style={styles.title}>
            {' Hello Agatha Bella! 👋\nWelcome to StockWave'}
          </Text>
        }
        confetti={<ConfettiAnimation />}
        description="It’s great to have you here"
        footer={
          <Button
            title="I’m ready to start!"
            variant="primary"
            onPress={handleContinue}
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

  title: {
    ...getTypography('heading4', 'bold'),
    color: colors.neutral[900],
    textAlign: 'center',
  },
});
