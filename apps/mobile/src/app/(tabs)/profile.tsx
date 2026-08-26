import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountActionsModal } from '../../components/modals/AccountActionsModal';

import { useAppSession } from '../../context/AppSessionContext';
import { supabase } from '../../lib/supabase';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

type ProfileMenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  onPress: () => void;
};

export default function ProfileScreen() {
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    user,

    signOutCurrentDevice,
    resetSession,
  } = useAppSession();

  const username =
    user?.user_metadata?.username ??
    user?.user_metadata?.full_name ??
    'StockWave User';

  const email = user?.email ?? '';

  const avatarUrl =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;

  const initials = username
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join('');

  const handleComingSoon = (feature: string) => {
    Alert.alert(feature, `${feature} will be available here.`);
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);

      await signOutCurrentDevice();

      setIsAccountModalVisible(false);

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

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      const { error } = await supabase.functions.invoke('delete-account');

      if (error) {
        throw error;
      }

      await resetSession();

      setIsAccountModalVisible(false);

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
    <>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={10}
              style={styles.backButton}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                }
              }}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={colors.neutral[900]}
              />
            </Pressable>

            <Text style={styles.headerTitle}>Profile</Text>

            <View style={styles.headerPlaceholder} />
          </View>

          <View style={styles.profileSection}>
            {avatarUrl ? (
              <Image
                source={{
                  uri: avatarUrl,
                }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials || 'S'}</Text>
              </View>
            )}

            <View style={styles.userInfo}>
              <Text numberOfLines={1} style={styles.userName}>
                {username}
              </Text>

              <Text numberOfLines={1} style={styles.userEmail}>
                {email}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.inviteCard,

              pressed && styles.pressed,
            ]}
            onPress={() => {
              handleComingSoon('Invite friends');
            }}
          >
            <View style={styles.inviteIcon}>
              <Ionicons name="cash-outline" size={19} color="#78849A" />
            </View>

            <View style={styles.inviteContent}>
              <Text style={styles.inviteTitle}>Invite friends</Text>

              <Text style={styles.inviteSubtitle}>
                Invite your friends and get $15
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#8090A5" />
          </Pressable>

          <View style={styles.sectionDivider} />

          <View style={styles.menuContainer}>
            <ProfileMenuItem
              icon="person-outline"
              title="Account"
              onPress={() => {
                setIsAccountModalVisible(true);
              }}
            />

            <ProfileMenuItem
              icon="finger-print-outline"
              title="Security"
              onPress={() => {
                handleComingSoon('Security');
              }}
            />

            <ProfileMenuItem
              icon="card-outline"
              title="Billing / Payments"
              onPress={() => {
                handleComingSoon('Billing / Payments');
              }}
            />

            <ProfileMenuItem
              icon="language-outline"
              title="Language"
              value="English"
              onPress={() => {
                handleComingSoon('Language');
              }}
            />

            <ProfileMenuItem
              icon="settings-outline"
              title="Settings"
              onPress={() => {
                handleComingSoon('Settings');
              }}
            />

            <ProfileMenuItem
              icon="help-outline"
              title="FAQ"
              onPress={() => {
                handleComingSoon('FAQ');
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <AccountActionsModal
        visible={isAccountModalVisible}
        isSigningOut={isSigningOut}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isSigningOut && !isDeleting) {
            setIsAccountModalVisible(false);
          }
        }}
        onSignOut={handleSignOut}
        onDeleteAccount={handleDeleteAccount}
      />
    </>
  );
}

function ProfileMenuItem({
  icon,
  title,
  value,
  onPress,
}: ProfileMenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={21} color="#8090A5" />
      </View>

      <Text style={styles.menuTitle}>{title}</Text>

      <View style={styles.menuTrailing}>
        {value ? <Text style={styles.menuValue}>{value}</Text> : null}

        <Ionicons name="chevron-forward" size={20} color="#8090A5" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.other.white,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: spacing[6],
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
    backgroundColor: colors.other.white,
  },

  headerTitle: {
    ...getTypography('heading5', 'bold'),
    color: colors.neutral[900],
  },

  headerPlaceholder: {
    width: 40,
    height: 40,
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[5],
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },

  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  avatarInitials: {
    ...getTypography('heading4', 'bold'),
    color: colors.other.white,
  },

  userInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },

  userName: {
    ...getTypography('bodyLarge', 'bold'),
    color: colors.neutral[900],
  },

  userEmail: {
    ...getTypography('bodySmall'),
    marginTop: spacing[1],
    color: colors.neutral[500],
  },

  inviteCard: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[4],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: '#C7D0DB',
    borderRadius: 6,
    backgroundColor: '#FBFCFD',
  },

  inviteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE3EA',
    backgroundColor: colors.other.white,
  },

  inviteContent: {
    flex: 1,
    marginLeft: spacing[3],
  },

  inviteTitle: {
    ...getTypography('bodyMedium', 'semiBold'),
    color: colors.neutral[900],
  },

  inviteSubtitle: {
    ...getTypography('bodySmall'),
    marginTop: 2,
    color: colors.neutral[400],
  },

  sectionDivider: {
    height: 14,
    marginTop: spacing[4],
    backgroundColor: colors.neutral[50],
  },

  menuContainer: {
    paddingVertical: spacing[3],
    backgroundColor: colors.other.white,
  },

  menuItem: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },

  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },

  menuTitle: {
    ...getTypography('bodyMedium'),
    flex: 1,
    marginLeft: spacing[3],
    color: colors.neutral[900],
  },

  menuTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  menuValue: {
    ...getTypography('bodySmall'),
    color: colors.neutral[500],
  },

  pressed: {
    opacity: 0.6,
  },
});
