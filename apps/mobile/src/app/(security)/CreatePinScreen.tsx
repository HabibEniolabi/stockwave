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

import { colors } from
  '../../theme/colors';

import { spacing } from
  '../../theme/spacing';

import { getTypography } from
  '../../theme/typography';

const PIN_LENGTH = 6;

type PinStep = 'create' | 'confirm';

export default function CreatePinScreen() {
  const [pin, setPin] = useState('');
  const [focusTrigger, setFocusTrigger]= useState(0)

  const [
    confirmationPin,
    setConfirmationPin,
  ] = useState('');

  const [step, setStep] =
    useState<PinStep>('create');

  const [error, setError] =
    useState('');

  const [
    shakeTrigger,
    setShakeTrigger,
  ] = useState(0);

  const [
    inputResetKey,
    setInputResetKey,
  ] = useState(0);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const {
    createPin,
  } = useAppSession();

  const isCreating =
    step === 'create';

  const currentPin =
    isCreating
      ? pin
      : confirmationPin;

  const handlePinChange = (
    value: string,
  ) => {
    if (error) {
      setError('');
    }

    if (isCreating) {
      setPin(value);
      return;
    }

    setConfirmationPin(value);
  };

  const resetPinInput = () => {
    setInputResetKey(
      current => current + 1,
    );
  };

  const handleContinue = async () => {
    if (
      currentPin.length !==
      PIN_LENGTH
    ) {
      return;
    }

    setError('');

    /*
     * STEP 1
     *
     * User has created the first PIN.
     * Move to confirmation.
     */
    if (isCreating) {
      setConfirmationPin('');
      setStep('confirm');
      setFocusTrigger(
        current => current + 1
      );

      return;
    }

    /*
     * STEP 2
     *
     * Validate confirmation.
     */
    if (
      confirmationPin !== pin
    ) {
      setError(
        'PINs do not match. Please try again.',
      );
      setConfirmationPin('');
      setShakeTrigger(
        current => current + 1,
      );

     setFocusTrigger(
      current => current + 1,
     );

      return;
    }

    try {
      setIsSaving(true);

      await createPin(pin);

      router.replace(
        '/(tabs)/home',
      );
    } catch {
      setError(
        'Unable to create your PIN. Please try again.',
      );

      setShakeTrigger(
        current => current + 1,
      );

      resetPinInput();
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');

      setConfirmationPin('');

      setError('');

      resetPinInput();

      return;
    }

    router.replace(
      '/(tabs)/home',
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.container}>
        <BackButton
          onPress={handleBack}
        />

        <View style={styles.content}>
          <Text style={styles.title}>
            {isCreating
              ? 'Create New PIN'
              : 'Confirm PIN'}
          </Text>

          <Text
            style={styles.description}
          >
            {isCreating
              ? 'Adding a PIN number will make your\ninvestment secure'
              : 'Enter your PIN again to confirm it'}
          </Text>

          <View
            style={styles.pinContainer}
          >
            <OtpInput
              key={`${step}-${inputResetKey}`}
              value={currentPin}
              onChangeText={
                handlePinChange
              }
              length={PIN_LENGTH}
              purpose="pin"
              secure
              focusTrigger={focusTrigger}
              autoFocus
              status={
                error
                  ? 'error'
                  : 'default'
              }
              shakeTrigger={
                shakeTrigger
              }
            />
          </View>

          {error ? (
            <Text
              style={styles.error}
            >
              {error}
            </Text>
          ) : null}
        </View>

        <Button
          title={
            isCreating
              ? 'Continue'
              : 'Create PIN'
          }
          variant="primary"
          loading={isSaving}
          disabled={
            currentPin.length !==
              PIN_LENGTH ||
            isSaving
          }
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      colors.other.white,
  },

  container: {
    flex: 1,
    paddingHorizontal:
      spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },

  content: {
    flex: 1,
    marginTop: spacing[12],
  },

  title: {
    ...getTypography(
      'heading5',
      'bold',
    ),
    color: colors.neutral[900],
  },

  description: {
    ...getTypography(
      'bodyMedium',
    ),
    maxWidth: 320,
    marginTop: spacing[2],
    color: colors.neutral[500],
  },

  pinContainer: {
    marginTop: spacing[8],
  },

  error: {
    ...getTypography(
      'bodySmall',
    ),
    marginTop: spacing[3],
    color: colors.error.base,
  },
});