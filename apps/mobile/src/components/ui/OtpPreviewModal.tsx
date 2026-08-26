import { useRef } from 'react';

import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

type OtpPreviewModalProps = {
  visible: boolean;
  code: string;
  duration?: number;
  onClose: () => void;
};

export function OtpPreviewModal({
  visible,
  code,
  duration = 6000,
  onClose,
}: OtpPreviewModalProps) {
  const progress = useRef(
    new Animated.Value(1),
  ).current;

  const handleModalShow = () => {
    progress.stopAnimation();

    /*
     * Start with a completely full bar.
     */
    progress.setValue(1);

    /*
     * Drain the bar from 100% to 0%
     * over the lifetime of the modal.
     */
    Animated.timing(progress, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  };

  const handleClose = () => {
    progress.stopAnimation();

    onClose();
  };

  const progressWidth =
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [
        '0%',
        '100%',
      ],
    });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onShow={handleModalShow}
      onRequestClose={handleClose}
    >
      <View
        style={styles.overlay}
      >
        <Pressable
          style={
            StyleSheet.absoluteFill
          }
          onPress={handleClose}
        />

        <View
          style={styles.modal}
        >
          <Text
            style={styles.label}
          >
            Your verification code
          </Text>

          <Text
            style={styles.code}
          >
            {code}
          </Text>

          <Text
            style={
              styles.description
            }
          >
            This code will disappear shortly.
          </Text>

          <View
            style={
              styles.progressTrack
            }
          >
            <Animated.View
              style={[
                styles.progressIndicator,
                {
                  width:
                    progressWidth,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',

      paddingHorizontal:
        spacing[4],

      backgroundColor:
        'rgba(13, 13, 18, 0.45)',
    },

    modal: {
      width: '100%',
      maxWidth: 340,

      padding: spacing[6],

      borderRadius: 20,

      backgroundColor:
        colors.other.white,
    },

    label: {
      ...getTypography(
        'bodyMedium',
        'semiBold',
      ),

      color:
        colors.neutral[900],

      textAlign: 'center',
    },

    code: {
      ...getTypography(
        'heading3',
        'bold',
      ),

      marginTop:
        spacing[4],

      color:
        colors.primary[100],

      textAlign: 'center',

      letterSpacing: 8,
    },

    description: {
      ...getTypography(
        'bodySmall',
      ),

      marginTop:
        spacing[3],

      color:
        colors.neutral[500],

      textAlign: 'center',
    },

    progressTrack: {
      width: '100%',
      height: 4,

      marginTop:
        spacing[6],

      overflow: 'hidden',

      borderRadius: 999,

      backgroundColor:
        colors.neutral[50],
    },

    progressIndicator: {
      height: '100%',

      borderRadius: 999,

      backgroundColor:
        colors.primary[100],
    },
  });