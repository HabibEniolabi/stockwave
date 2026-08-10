import { router } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from
  'react-native-safe-area-context';

import { OtpInput } from
  '../../components/form/OtpInput';
import { BackButton } from
  '../../components/ui/BackButton';
import { Button } from
  '../../components/ui/Button';

import { useAppSession } from
  '../../context/AppSessionContext';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from
  '../../theme/typography';

const PIN_LENGTH = 4;

export default function CreatePinScreen() {
  const [pin, setPin] = useState('');

  const {
    completePinSetup,
  } = useAppSession();

  const handleCreatePin = () => {
    if (pin.length !== PIN_LENGTH) {
      return;
    }

    // Later this will be stored securely.
    console.log('Dummy PIN created:', pin);

    completePinSetup();

    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BackButton
          onPress={() => router.back()}
        />

        <View style={styles.content}>
          <Text style={styles.title}>
            Create New PIN
          </Text>

          <Text style={styles.description}>
            Adding a PIN will make your
            investment account more secure.
          </Text>

          <View style={styles.pinContainer}>
            <OtpInput
              value={pin}
              onChangeText={setPin}
              length={PIN_LENGTH}
              autoFocus
            />
          </View>
        </View>

        <Button
          title="Confirm"
          variant="primary"
          disabled={pin.length !== PIN_LENGTH}
          onPress={handleCreatePin}
        />
      </View>
    </SafeAreaView>
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
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },

  content: {
    flex: 1,
    marginTop: spacing[12],
  },

  title: {
    ...getTypography('heading5', 'bold'),
    color: colors.neutral[900],
  },

  description: {
    ...getTypography('bodyMedium'),
    maxWidth: 320,
    marginTop: spacing[2],
    color: colors.neutral[500],
  },

  pinContainer: {
    marginTop: spacing[8],
  },
});