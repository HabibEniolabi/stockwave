import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BlurView } from 'expo-blur';

import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

type AccountActionsModalProps = {
  visible: boolean;

  isSigningOut?: boolean;
  isDeleting?: boolean;

  onClose: () => void;
  onSignOut: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
};

export function AccountActionsModal({
  visible,

  isSigningOut = false,
  isDeleting = false,

  onClose,
  onSignOut,
  onDeleteAccount,
}: AccountActionsModalProps) {
  const isBusy = isSigningOut || isDeleting;

  const handleSignOut = () => {
    if (isBusy) {
      return;
    }

    Alert.alert(
      'Sign out?',
      'You can sign back in to your StockWave account at any time.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Sign out',
          style: 'destructive',

          onPress: () => {
            void onSignOut();
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    if (isBusy) {
      return;
    }

    Alert.alert(
      'Delete account?',
      'Your StockWave account and associated data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Continue',
          style: 'destructive',

          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'This action cannot be undone. You will need to create a new account to use StockWave again.',
              [
                {
                  text: 'Keep account',

                  style: 'cancel',
                },

                {
                  text: 'Delete permanently',

                  style: 'destructive',

                  onPress: () => {
                    void onDeleteAccount();
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />

        <Pressable
          disabled={isBusy}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Account</Text>

              <Text style={styles.description}>
                Manage your StockWave account.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close account options"
              disabled={isBusy}
              hitSlop={10}
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color={colors.neutral[700]} />
            </Pressable>
          </View>

          <View style={styles.actionsContainer}>
            <Pressable
              accessibilityRole="button"
              disabled={isBusy}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.pressed,
                isBusy && styles.disabled,
              ]}
              onPress={handleSignOut}
            >
              <View style={styles.actionIcon}>
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color={colors.neutral[800]}
                />
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </Text>

                <Text style={styles.actionDescription}>
                  Sign out of StockWave on this device.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.neutral[400]}
              />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              accessibilityRole="button"
              disabled={isBusy}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.pressed,
                isBusy && styles.disabled,
              ]}
              onPress={handleDeleteAccount}
            >
              <View style={[styles.actionIcon, styles.deleteIcon]}>
                <Ionicons name="trash-outline" size={22} color="#D92D20" />
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.deleteTitle}>
                  {isDeleting ? 'Deleting account...' : 'Delete account'}
                </Text>

                <Text style={styles.actionDescription}>
                  Permanently delete your StockWave account.
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#D92D20" />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            style={({ pressed }) => [
              styles.cancelButton,

              pressed && styles.pressed,
            ]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13, 13, 18, 0.18)',
  },

  sheet: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.other.white,
  },

  handle: {
    width: 42,
    height: 5,
    alignSelf: 'center',
    marginBottom: spacing[5],
    borderRadius: 999,
    backgroundColor: colors.neutral[100],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },

  title: {
    ...getTypography('heading5', 'bold'),
    color: colors.neutral[900],
  },

  description: {
    ...getTypography('bodySmall'),
    marginTop: spacing[1],
    color: colors.neutral[500],
  },

  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.neutral[50],
  },

  actionsContainer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 16,
    borderColor: colors.neutral[100],
    backgroundColor: colors.other.white,
  },

  action: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },

  actionIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.neutral[50],
  },

  deleteIcon: {
    backgroundColor: '#FEF3F2',
  },

  actionContent: {
    flex: 1,
    marginLeft: spacing[3],
    marginRight: spacing[2],
  },

  actionTitle: {
    ...getTypography('bodyMedium', 'semiBold'),
    color: colors.neutral[900],
  },

  deleteTitle: {
    ...getTypography('bodyMedium', 'semiBold'),
    color: '#D92D20',
  },

  actionDescription: {
    ...getTypography('bodySmall'),
    marginTop: 3,
    color: colors.neutral[500],
  },

  divider: {
    height: 1,
    marginLeft: 70,
    backgroundColor: colors.neutral[100],
  },

  cancelButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
    borderRadius: 14,
    backgroundColor: colors.neutral[50],
  },

  cancelText: {
    ...getTypography('bodyMedium', 'semiBold'),
    color: colors.neutral[800],
  },

  pressed: {
    opacity: 0.6,
  },

  disabled: {
    opacity: 0.5,
  },
});
