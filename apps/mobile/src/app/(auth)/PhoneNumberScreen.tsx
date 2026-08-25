import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from 'libphonenumber-js/max';

import AuthHeader from '../../components/common/AuthHeader';
import { PhoneNumberField } from '../../components/form/PhoneNumberField';
import {
  countries,
  type Country,
} from '../../components/types/countries';
import { BackButton } from '../../components/ui/BackButton';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useAppSession } from '../../context/AppSessionContext';

export default function PhoneNumberScreen() {
  const [country, setCountry] = useState<Country>(
    countries.find((item) => item.iso2 === 'US') ??
      countries[0]!,
  );

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { startPhoneVerification } = useAppSession();

const handleContinue = async () => {
  if (isSubmitting) {
    return;
  }

  setPhoneError('');

  const normalizedNumber = phoneNumber.trim();

  if (!normalizedNumber) {
    setPhoneError('Phone number is required.');
    return;
  }

  const lengthError = validatePhoneNumberLength(
    normalizedNumber,
    country.iso2,
  );

  if (lengthError === 'TOO_SHORT') {
    setPhoneError('This phone number is too short.');
    return;
  }

  if (lengthError === 'TOO_LONG') {
    setPhoneError('This phone number is too long.');
    return;
  }

  if (lengthError === 'INVALID_LENGTH') {
    setPhoneError(
      `Enter a valid phone number for ${country.name}.`,
    );
    return;
  }

  if (
    lengthError === 'NOT_A_NUMBER' ||
    lengthError === 'INVALID_COUNTRY'
  ) {
    setPhoneError('Enter a valid phone number.');
    return;
  }

  const parsedPhoneNumber = parsePhoneNumberFromString(
    normalizedNumber,
    country.iso2,
  );

  if (!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
    setPhoneError(
      `Enter a valid phone number for ${country.name}.`,
    );
    return;
  }

  if (
    parsedPhoneNumber.country &&
    parsedPhoneNumber.country !== country.iso2
  ) {
    setPhoneError(
      `This number does not match ${country.name}.`,
    );
    return;
  }
  
  const internationalPhoneNumber =
    parsedPhoneNumber.number;

  console.log({
    country: country.name,
    countryCode: country.iso2,
    nationalNumber:
      parsedPhoneNumber.formatNational(),
    internationalNumber:
      parsedPhoneNumber.formatInternational(),
    e164: internationalPhoneNumber,
  });

  try {
    setIsSubmitting(true);

    await startPhoneVerification(
      internationalPhoneNumber,
    );

    router.push(
      '/(auth)/OtpVerificationScreen',
    );
  } catch (error) {
    console.error(
      'PHONE VERIFICATION ERROR',
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Unable to send the verification code. Please try again.';

    setPhoneError(message);
  } finally {
    setIsSubmitting(false);
  }
};

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
          <BackButton onPress={() => router.back()} />

          <View style={styles.headerContainer}>
            <AuthHeader
              title="Enter your phone number"
              description={
                "You'll receive a 6 digit code for the\nphone number verification"
              }
            />

            <PhoneNumberField
              country={country}
              value={phoneNumber}
              error={phoneError}
              onCountryChange={(selectedCountry) => {
                setCountry(selectedCountry);
                setPhoneNumber('');
                setPhoneError('');
              }}
              onChangeText={(value) => {
                setPhoneNumber(value);

                if (phoneError) {
                  setPhoneError('');
                }
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title="Send code"
          variant="primary"
          loading={isSubmitting}
          disabled={!phoneNumber.trim() || isSubmitting}
          onPress={handleContinue}
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

  keyboardView: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },

  headerContainer: {
    marginTop: spacing[12],
    gap: spacing[8],
  },

  footer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
});