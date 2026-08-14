import { useEffect, useRef, useState } from 'react';

import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';

export type OtpStatus = 'default' | 'error' | 'success';

type OtpVariant = 'boxes' | 'dots';
type OtpPurpose = 'otp' | 'pin';
type OtpInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  status?: OtpStatus;
  shakeTrigger?: number;

  /*
   * Increment this whenever the parent
   * explicitly wants the hidden TextInput
   * to receive focus again.
   */
  focusTrigger?: number;

  /*
   * OTP = normal OTP autofill behaviour.
   * PIN = no SMS OTP autofill.
   */
  purpose?: OtpPurpose;

  /*
   * boxes = your existing OTP/PIN boxes.
   * dots = passcode indicators.
   */
  variant?: OtpVariant;

  /*
   * Hide the actual PIN digits.
   */
  secure?: boolean;

  /*
   * false when using our own custom keypad.
   */
  keyboardEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function OtpInput({
  value,
  onChangeText,
  length = 6,
  autoFocus = false,
  disabled = false,
  status = 'default',
  shakeTrigger = 0,
  focusTrigger = 0,
  purpose = 'otp',
  variant = 'boxes',
  secure = false,
  keyboardEnabled = true,
  style,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(false);

  const digits = Array.from(
    {
      length,
    },
    (_, index) => value[index] ?? '',
  );

  const activeIndex = value.length >= length ? length - 1 : value.length;

  /*
   * Initial autofocus.
   */
  useEffect(() => {
    if (!autoFocus || disabled || !keyboardEnabled) {
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [autoFocus, disabled, keyboardEnabled]);

  /*
   * Explicit refocus requested by
   * parent screen.
   *
   * This fixes your current Create PIN
   * problem after moving between steps
   * or after a PIN mismatch.
   */
  useEffect(() => {
    if (!focusTrigger || disabled || !keyboardEnabled) {
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [focusTrigger, disabled, keyboardEnabled]);

  /*
   * Error / success wiggle.
   */
  useEffect(() => {
    if ((status !== 'error' && status !== 'success') || shakeTrigger === 0) {
      return;
    }

    translateX.setValue(0);

    const distance = status === 'error' ? 10 : 4;

    const duration = status === 'error' ? 50 : 80;

    Animated.sequence([
      Animated.timing(translateX, {
        toValue: -distance,
        duration,
        useNativeDriver: true,
      }),

      Animated.timing(translateX, {
        toValue: distance,
        duration,
        useNativeDriver: true,
      }),

      Animated.timing(translateX, {
        toValue: -(distance * 0.6),
        duration,
        useNativeDriver: true,
      }),

      Animated.timing(translateX, {
        toValue: distance * 0.6,
        duration,
        useNativeDriver: true,
      }),

      Animated.timing(translateX, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeTrigger, status, translateX]);

  const handleChangeText = (text: string) => {
    const numbersOnly = text.replace(/\D/g, '').slice(0, length);
    onChangeText(numbersOnly);
  };

  const handlePress = () => {
    if (disabled || !keyboardEnabled) {
      return;
    }

    inputRef.current?.focus();
  };

  const content = (
    <>
      {keyboardEnabled ? (
        <TextInput
          ref={inputRef}
          value={value}
          autoFocus={autoFocus}
          editable={!disabled}
          keyboardType="number-pad"
          maxLength={length}
          secureTextEntry={purpose === 'pin'}
          caretHidden
          style={styles.hiddenInput}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...(purpose === 'otp'
            ? {
                textContentType: 'oneTimeCode' as const,
                autoComplete: 'sms-otp' as const,
                importantForAutofill: 'yes' as const,
              }
            : {
                textContentType: 'none' as const,
                autoComplete: 'off' as const,
                importantForAutofill: 'no' as const,
              })}
        />
      ) : null}

      {digits.map((digit, index) => {
        if (variant === 'dots') {
          const isFilled = Boolean(digit);
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isFilled && styles.dotFilled,
                status === 'error' && styles.dotError,
                status === 'success' && styles.dotSuccess,
              ]}
            />
          );
        }

        const isActive =
          isFocused && index === activeIndex && status === 'default';

        return (
          <View
            key={index}
            style={[
              styles.box,
              isActive && styles.boxActive,
              status === 'error' && styles.boxError,
              status === 'success' && styles.boxSuccess,
              disabled && styles.boxDisabled,
            ]}
          >
            {digit ? (
              <Text
                style={[
                  styles.digit,
                  status === 'error' && styles.digitError,
                  status === 'success' && styles.digitSuccess,
                ]}
              >
                {secure ? '•' : digit}
              </Text>
            ) : isActive ? (
              <View style={styles.caret} />
            ) : null}
          </View>
        );
      })}
    </>
  );

  return (
    <Animated.View
      style={[
        styles.animatedContainer,

        {
          transform: [
            {
              translateX,
            },
          ],
        },
      ]}
    >
      {keyboardEnabled ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            purpose === 'pin' ? 'PIN input' : 'Verification code input'
          }
          disabled={disabled}
          style={[
            styles.container,
            variant === 'dots' && styles.dotsContainer,
            style,
          ]}
          onPress={handlePress}
        >
          {content}
        </Pressable>
      ) : (
        <View style={[styles.container, styles.dotsContainer, style]}>
          {content}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    width: '100%',
  },

  container: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  dotsContainer: {
    justifyContent: 'center',
    gap: 20,
  },

  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  box: {
    flex: 1,
    maxWidth: 52,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[100],
    borderRadius: 12,
    backgroundColor: colors.other.white,
  },

  boxActive: {
    borderColor: colors.primary[100],
  },

  boxError: {
    borderColor: colors.error.base,
    backgroundColor: '#FFF5F5',
  },

  boxSuccess: {
    borderColor: colors.success.base,
    backgroundColor: '#F2FFF8',
  },

  boxDisabled: {
    backgroundColor: colors.neutral[25],
    opacity: 0.6,
  },

  digit: {
    fontFamily: fontFamily.semiBold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.neutral[900],
  },

  digitError: {
    color: colors.error.base,
  },

  digitSuccess: {
    color: colors.success.base,
  },

  caret: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary[100],
  },

  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.neutral[600],
    backgroundColor: 'transparent',
  },

  dotFilled: {
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[100],
  },

  dotError: {
    borderColor: colors.error.base,
  },

  dotSuccess: {
    borderColor: colors.success.base,
    backgroundColor: colors.success.base,
  },
});
