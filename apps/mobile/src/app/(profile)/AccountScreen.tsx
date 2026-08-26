import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';

import { useAppSession } from '../../context/AppSessionContext';

import { colors } from '../../theme/colors';

import { spacing } from '../../theme/spacing';

import { getTypography } from '../../theme/typography';

import { useState } from 'react';

export default function AccountScreen() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const {
    user,

    hasRegistrationPhone,
    hasCompletedVerification,

    signOutCurrentDevice,
    resetSession,
  } = useAppSession();

  const email = user?.email ?? 'Not available';

  const phone = user?.user_metadata?.registration_phone ?? 'Not added';

  const handleSignOut = () => {
    if (isSigningOut || isDeleting) {
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
            void performSignOut();
          },
        },
      ],
    );
  };

  const performSignOut = async () => {
    try {
      setIsSigningOut(true);

      await signOutCurrentDevice();

      router.dismissAll();

      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('SIGN OUT ERROR', error);

      Alert.alert(
        'Unable to sign out',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = () => {
    if (isSigningOut || isDeleting) {
      return;
    }

    Alert.alert(
      'Delete your account?',
      'Your StockWave account and associated account data will be permanently deleted. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Continue',
          style: 'destructive',

          onPress: () => {
            showFinalDeleteConfirmation();
          },
        },
      ],
    );
  };

  const showFinalDeleteConfirmation = () => {
    Alert.alert(
      'Are you absolutely sure?',
      'Deleting your account is permanent. You will need to create a new account if you want to use StockWave again.',
      [
        {
          text: 'Keep account',
          style: 'cancel',
        },

        {
          text: 'Delete permanently',
          style: 'destructive',

          onPress: () => {
            void performDeleteAccount();
          },
        },
      ],
    );
  };

  const performDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      const { error } = await supabase.functions.invoke('delete-account');

      if (error) {
        throw error;
      }

      await resetSession();

      router.dismissAll();

      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('DELETE ACCOUNT ERROR', error);

      Alert.alert(
        'Unable to delete account',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.neutral[900]} />
        </Pressable>

        <Text style={styles.headerTitle}>Account</Text>

        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>

        <View style={styles.card}>
          <AccountRow title="Email address" value={email} />

          <Divider />

          <AccountRow title="Phone number" value={phone} />

          <Divider />

          <AccountRow
            title="Phone added"
            value={hasRegistrationPhone ? 'Yes' : 'No'}
          />

          <Divider />

          <AccountRow
            title="Verification"
            value={hasCompletedVerification ? 'Completed' : 'Incomplete'}
          />
        </View>

        <Text style={[styles.sectionTitle, styles.sessionTitle]}>SESSION</Text>

        <View style={styles.card}>
          <Pressable
            disabled={isSigningOut || isDeleting}
            style={({ pressed }) => [
              styles.actionRow,

              pressed && styles.pressed,
            ]}
            onPress={handleSignOut}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="log-out-outline"
                size={21}
                color={colors.neutral[700]}
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

            <Ionicons name="chevron-forward" size={20} color="#8090A5" />
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, styles.dangerTitle]}>
          DANGER ZONE
        </Text>

        <View style={styles.dangerCard}>
          <Pressable
            disabled={isSigningOut || isDeleting}
            style={({ pressed }) => [
              styles.actionRow,

              pressed && styles.pressed,
            ]}
            onPress={handleDeleteAccount}
          >
            <View style={[styles.actionIcon, styles.deleteIcon]}>
              <Ionicons name="trash-outline" size={21} color="#D92D20" />
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
      </ScrollView>
    </SafeAreaView>
  );
}

type AccountRowProps = {
  title: string;
  value: string;
};

function AccountRow({ title, value }: AccountRowProps) {
  return (
    <View style={styles.accountRow}>
      <Text style={styles.accountLabel}>{title}</Text>

      <Text numberOfLines={1} style={styles.accountValue}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: colors.other.white,
  },

  header: {
    height: 62,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: spacing[4],
  },

  backButton: {
    width: 40,
    height: 40,

    borderRadius: 20,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,

    borderColor: colors.neutral[100],
  },

  headerTitle: {
    ...getTypography('heading5', 'bold'),

    color: colors.neutral[900],
  },

  headerPlaceholder: {
    width: 40,
  },

  content: {
    paddingHorizontal: spacing[4],

    paddingTop: spacing[5],

    paddingBottom: spacing[12],
  },

  sectionTitle: {
    ...getTypography('bodySmall', 'semiBold'),

    marginBottom: spacing[3],

    color: colors.neutral[400],

    letterSpacing: 0.5,
  },

  card: {
    overflow: 'hidden',

    borderRadius: 12,

    borderWidth: 1,

    borderColor: colors.neutral[100],

    backgroundColor: colors.other.white,
  },

  accountRow: {
    minHeight: 60,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    gap: spacing[4],

    paddingHorizontal: spacing[4],

    paddingVertical: spacing[3],
  },

  accountLabel: {
    ...getTypography('bodyMedium'),

    color: colors.neutral[500],
  },

  accountValue: {
    ...getTypography('bodyMedium', 'semiBold'),

    flex: 1,

    textAlign: 'right',

    color: colors.neutral[900],
  },

  divider: {
    height: 1,

    marginLeft: spacing[4],

    backgroundColor: colors.neutral[100],
  },

  sessionTitle: {
    marginTop: spacing[8],
  },

  actionRow: {
    minHeight: 74,

    flexDirection: 'row',

    alignItems: 'center',

    padding: spacing[4],
  },

  actionIcon: {
    width: 38,
    height: 38,

    borderRadius: 19,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: colors.neutral[50],
  },

  actionContent: {
    flex: 1,

    marginLeft: spacing[3],
  },

  actionTitle: {
    ...getTypography('bodyMedium', 'semiBold'),

    color: colors.neutral[900],
  },

  actionDescription: {
    ...getTypography('bodySmall'),

    marginTop: 3,

    color: colors.neutral[500],
  },

  dangerTitle: {
    marginTop: spacing[8],

    color: '#D92D20',
  },

  dangerCard: {
    overflow: 'hidden',

    borderRadius: 12,

    borderWidth: 1,

    borderColor: '#FECACA',

    backgroundColor: '#FFFBFA',
  },

  deleteIcon: {
    backgroundColor: '#FEF3F2',
  },

  deleteTitle: {
    ...getTypography('bodyMedium', 'semiBold'),

    color: '#D92D20',
  },

  pressed: {
    opacity: 0.6,
  },
});
