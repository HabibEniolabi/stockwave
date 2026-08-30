import { useEffect, useRef } from 'react';

import { Animated, Modal, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

type OtpPreviewModalProps = {
  visible: boolean;
  code: string;
  duration?: number;
  onClose: () => void;
  onExpire?: () => void;
};

export function OtpPreviewModal({
  visible,
  code,
  duration = 6000,
  onClose,
  onExpire,
}: OtpPreviewModalProps) {
  const progress = useRef(new Animated.Value(1)).current;
  const onCloseRef = useRef(onClose);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!visible || !code) {
      progress.stopAnimation();

      return;
    }

    progress.stopAnimation();

    /*
     * Every time the modal opens or a
     * new OTP is generated, restart the
     * progress bar from 100%.
     */
    progress.setValue(1);

    const animation = Animated.timing(progress, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (!finished) {
        return;
      }

      /*
       * Some screens, such as password
       * recovery, need to invalidate the
       * OTP when the timer expires.
       */
      if (onExpireRef.current) {
        onExpireRef.current();

        return;
      }

      /*
       * Other usages only need the
       * preview modal to disappear.
       */
      onCloseRef.current();
    });

    return () => {
      animation.stop();
    };
  }, [visible, code, duration, progress]);

  const handleClose = () => {
    progress.stopAnimation();

    /*
     * Manual dismissal only closes the
     * modal. It does not automatically
     * invalidate the OTP.
     */
    onCloseRef.current();
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={styles.modal}
          onPress={(event) => {
            /*
             * Tapping inside the modal
             * should not dismiss it.
             */
            event.stopPropagation();
          }}
        >
          <Text style={styles.label}>Your verification code</Text>

          <Text style={styles.code}>{code}</Text>

          <Text style={styles.description}>
            This code will disappear shortly.
          </Text>

          <Pressable pointerEvents="none" style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressIndicator,
                {
                  width: progressWidth,
                },
              ]}
            />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    backgroundColor: 'rgba(13, 13, 18, 0.45)',
  },

  modal: {
    width: '100%',
    maxWidth: 340,
    padding: spacing[6],
    borderRadius: 20,
    backgroundColor: colors.other.white,
  },

  label: {
    ...getTypography('bodyMedium', 'semiBold'),
    color: colors.neutral[900],
    textAlign: 'center',
  },

  code: {
    ...getTypography('heading3', 'bold'),
    marginTop: spacing[4],
    color: colors.primary[100],
    textAlign: 'center',
    letterSpacing: 8,
  },

  description: {
    ...getTypography('bodySmall'),
    marginTop: spacing[3],
    color: colors.neutral[500],
    textAlign: 'center',
  },

  progressTrack: {
    width: '100%',
    height: 4,
    marginTop: spacing[6],
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.neutral[50],
  },

  progressIndicator: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary[100],
  },
});