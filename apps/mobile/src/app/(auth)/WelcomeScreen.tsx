// import { router } from 'expo-router';
// import { StyleSheet, Text } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// import { SuccessInfo } from '../../components/common/SuccessInfo';
// import { Button } from '../../components/ui/Button';
// import { colors } from '../../theme/colors';
// import { getTypography } from '../../theme/typography';
// import { ConfettiAnimation } from '../../components/animations/ConfettiAnimation';
// import { StockWaveSuccessMark } from '../../components/branding/StockWaveSuccessMark';
// import { useAppSession } from '../../context/AppSessionContext';
// import { useState } from 'react';

// export default function WelcomeScreen() {
//   const { completeWelcome, user } = useAppSession();

//   const [isCompleting, setIsCompleting] = useState(false);

//   const username = user?.user_metadata?.username;

//   const handleContinue = async () => {
//     if (isCompleting) {
//       return;
//     }

//     try {
//       setIsCompleting(true);
//       await completeWelcome();

//       router.replace('/(tabs)/home');
//     } catch (error) {
//       console.error('Unable to complete welcome', error);

//       setIsCompleting(false);
//     }
//   };
//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <SuccessInfo
//         icon={<StockWaveSuccessMark size={96} />}
//         title={
//           <Text style={styles.title}>
//             {`Hello ${username}! 👋\nWelcome to StockWave`}
//           </Text>
//         }
//         confetti={<ConfettiAnimation />}
//         description="It’s great to have you here"
//         footer={
//           <Button
//             title="I’m ready to start!"
//             variant="primary"
//             onPress={handleContinue}
//           />
//         }
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: colors.other.white,
//   },

//   title: {
//     ...getTypography('heading4', 'bold'),
//     color: colors.neutral[900],
//     textAlign: 'center',
//   },
// });

import { router } from 'expo-router';
import { useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import StockWave from '../../assets/icons/StockWave';

import { BiometricSetupModal } from '../../components/modals/BiometricSetupModal';

import { Button } from '../../components/ui/Button';

import { useAppSession } from '../../context/AppSessionContext';

import { colors } from '../../theme/colors';

import { spacing } from '../../theme/spacing';

import { getTypography } from '../../theme/typography';

export default function WelcomeScreen() {
  const [showSecuritySetup, setShowSecuritySetup] = useState(false);

  const { user } = useAppSession();

  const username = user?.user_metadata?.username ?? 'there';

  const handleReadyToStart = () => {
    /*
     * Do NOT call completeWelcome here.
     *
     * The modal should appear immediately
     * when the user taps the button.
     */
    setShowSecuritySetup(true);
  };

  const handleContinueToPin = () => {
    setShowSecuritySetup(false);

    /*
     * Replace Welcome with PIN setup so
     * Welcome is not left behind in the
     * navigation history.
     */
    router.replace('/(security)/CreatePinScreen');
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <StockWave width={56} height={56} />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>Welcome, {username}</Text>

              <Text style={styles.description}>
                Your StockWave account is ready. Let&apos;s secure it before you
                get started.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              title="I'm ready to start"
              variant="primary"
              onPress={handleReadyToStart}
            />
          </View>
        </View>
      </SafeAreaView>

      <BiometricSetupModal
        visible={showSecuritySetup}
        onContinueToPin={handleContinueToPin}
      />
    </>
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

    paddingTop: spacing[8],

    paddingBottom: spacing[4],
  },

  content: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',
  },

  logoContainer: {
    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: spacing[8],
  },

  textContainer: {
    alignItems: 'center',

    gap: spacing[3],
  },

  title: {
    ...getTypography('heading2', 'bold'),

    color: colors.neutral[900],

    textAlign: 'center',
  },

  description: {
    ...getTypography('bodyMedium'),

    maxWidth: 320,

    color: colors.neutral[500],

    textAlign: 'center',
  },

  footer: {
    paddingTop: spacing[6],
  },
});
