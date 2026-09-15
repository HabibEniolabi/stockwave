import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { AppState, type AppStateStatus } from 'react-native';

import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

import {
  completeInAppPasswordRecovery,
  getInAppVerificationStatus,
  markWelcomeSeen,
  saveRegistrationPhone as saveRegistrationPhoneMetadata,
  signInWithEmail,
  signUpWithEmail,
  startInAppPasswordRecovery,
  startInAppVerification,
  verifyInAppPasswordRecovery,
  verifyInAppVerification,
  type SignUpPayload,
} from '../services/auth';

import {
  clearDeviceSecurity,
  getDeviceBiometricsEnabled,
  hasDevicePin,
  saveDevicePin,
  setDeviceBiometricsEnabled,
  verifyDevicePin,
} from '../services/deviceSecurity';

/*
 * How long the user may leave StockWave before
 * we require PIN / biometrics again.
 *
 * 30 seconds gives enough time to briefly open
 * another app without constantly relocking.
 */
const APP_LOCK_GRACE_PERIOD_MS = 30 * 1000;

/*
 * DEVELOPMENT ONLY.
 *
 * Set this to true while you're actively
 * developing Home and don't want PIN interruptions.
 *
 * Because __DEV__ is required, this can never
 * bypass the lock in a production build.
 */
const DEV_BYPASS_APP_LOCK = __DEV__ && false;

type VerificationChallenge = {
  code: string;
  expiresAt: string;
};

type AppSessionContextValue = {
  session: Session | null;
  user: User | null;

  isSessionReady: boolean;
  isAuthenticated: boolean;

  hasRegistrationPhone: boolean;
  hasSeenWelcome: boolean;

  hasCompletedVerification: boolean;
  isVerificationReady: boolean;

  signIn: (email: string, password: string) => Promise<void>;

  signUp: (payload: SignUpPayload) => Promise<void>;

  saveRegistrationPhone: (phone: string, countryCode: string) => Promise<void>;

  startVerification: () => Promise<VerificationChallenge>;

  verifyVerificationCode: (code: string) => Promise<void>;

  completeWelcome: () => Promise<void>;

  isDeviceSecurityReady: boolean;
  biometricEnabled: boolean;
  pinCreated: boolean;
  isAppUnlocked: boolean;

  /*
   * Screens/layouts should use this rather
   * than rebuilding lock conditions themselves.
   */
  shouldRequireAppUnlock: boolean;

  createPin: (pin: string) => Promise<void>;

  verifyPin: (pin: string) => Promise<boolean>;

  unlockApp: () => void;
  lockApp: () => void;

  enableBiometrics: () => Promise<void>;

  resetPasswordEmail: string;

  resetPasswordVerified: boolean;

  passwordResetPreviewCode: string;

  passwordResetCodeExpiresAt: number | null;

  startPasswordReset: (email: string) => Promise<void>;

  resendPasswordResetCode: () => Promise<void>;

  verifyPasswordResetCode: (code: string) => Promise<void>;

  completePasswordReset: (password: string) => Promise<void>;

  signOutCurrentDevice: () => Promise<void>;

  resetSession: () => Promise<void>;
};

const AppSessionContext = createContext<AppSessionContextValue | undefined>(
  undefined,
);

type AppSessionProviderProps = {
  children: ReactNode;
};

export function AppSessionProvider({ children }: AppSessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);

  const [isSessionReady, setIsSessionReady] = useState(false);

  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  const [hasCompletedVerification, setHasCompletedVerification] =
    useState(false);

  const [isVerificationReady, setIsVerificationReady] = useState(false);

  const [isDeviceSecurityReady, setIsDeviceSecurityReady] = useState(false);

  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const [pinCreated, setPinCreated] = useState(false);

  const [isAppUnlocked, setIsAppUnlocked] = useState(false);

  const [resetPasswordEmail, setResetPasswordEmail] = useState('');

  const [resetPasswordVerified, setResetPasswordVerified] = useState(false);

  const [passwordResetPreviewCode, setPasswordResetPreviewCode] = useState('');

  const [passwordResetCodeExpiresAt, setPasswordResetCodeExpiresAt] = useState<
    number | null
  >(null);

  const [passwordResetChallengeToken, setPasswordResetChallengeToken] =
    useState('');

  const [passwordResetToken, setPasswordResetToken] = useState('');

  /*
   * Track the native application lifecycle.
   *
   * appStateRef:
   * active / inactive / background
   *
   * backgroundedAtRef:
   * when the user left StockWave.
   */
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const backgroundedAtRef = useRef<number | null>(null);

  const user = session?.user ?? null;

  const isAuthenticated = Boolean(session);

  const hasRegistrationPhone = Boolean(user?.user_metadata?.registration_phone);

  /*
   * Central condition used by navigation.
   *
   * Development bypass affects only the
   * local app lock. It does not fake auth.
   */
  const shouldRequireAppUnlock =
    !DEV_BYPASS_APP_LOCK && pinCreated && !isAppUnlocked;

  const syncSession = (nextSession: Session | null) => {
    setSession(nextSession);

    const nextUser = nextSession?.user ?? null;

    if (!nextUser) {
      setHasSeenWelcome(false);

      setHasCompletedVerification(false);

      return;
    }

    setHasSeenWelcome(Boolean(nextUser.user_metadata?.has_seen_welcome));
  };

  /*
   * Restore Supabase session.
   */
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error('Unable to restore Supabase session:', error.message);
      }

      syncSession(data.session);

      /*
       * Cold-starting StockWave always
       * begins locally locked.
       *
       * The navigation guard decides whether
       * an actual PIN exists and therefore
       * whether UnlockPinScreen is necessary.
       */
      setIsAppUnlocked(false);

      setIsSessionReady(true);
    };

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return;
      }

      syncSession(nextSession);

      setIsSessionReady(true);
    });

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  /*
   * Restore onboarding verification.
   */
  useEffect(() => {
    let active = true;

    const restoreVerificationState = async () => {
      if (!isSessionReady) {
        return;
      }

      setIsVerificationReady(false);

      if (!user) {
        if (!active) {
          return;
        }

        setHasCompletedVerification(false);

        setIsVerificationReady(true);

        return;
      }

      try {
        const verified = await getInAppVerificationStatus(user.id);

        if (!active) {
          return;
        }

        setHasCompletedVerification(verified);
      } catch (error) {
        console.error('Unable to restore verification state:', error);

        if (active) {
          setHasCompletedVerification(false);
        }
      } finally {
        if (active) {
          setIsVerificationReady(true);
        }
      }
    };

    void restoreVerificationState();

    return () => {
      active = false;
    };
  }, [isSessionReady, user?.id]);

  /*
   * Restore persisted PIN and biometric
   * configuration for this specific user.
   */
  useEffect(() => {
    let active = true;

    const restoreDeviceSecurity = async () => {
      if (!isSessionReady) {
        return;
      }

      setIsDeviceSecurityReady(false);

      if (!user) {
        if (!active) {
          return;
        }

        setPinCreated(false);

        setBiometricEnabled(false);

        setIsAppUnlocked(false);

        setIsDeviceSecurityReady(true);

        return;
      }

      try {
        const [hasPin, biometricsEnabled] = await Promise.all([
          hasDevicePin(user.id),

          getDeviceBiometricsEnabled(user.id),
        ]);

        if (!active) {
          return;
        }

        setPinCreated(hasPin);

        setBiometricEnabled(biometricsEnabled);
      } catch (error) {
        console.error('Unable to restore device security:', error);

        if (!active) {
          return;
        }

        setPinCreated(false);

        setBiometricEnabled(false);
      } finally {
        if (active) {
          setIsDeviceSecurityReady(true);
        }
      }
    };

    void restoreDeviceSecurity();

    return () => {
      active = false;
    };
  }, [isSessionReady, user?.id]);

  /*
   * ---------------------------------------------------
   * APPLICATION BACKGROUND LOCK
   * ---------------------------------------------------
   *
   * This does NOT log the user out.
   *
   * Supabase remains authenticated.
   * We only set isAppUnlocked = false.
   *
   * When TabsLayout sees that state it
   * redirects the user to UnlockPinScreen.
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousAppState = appStateRef.current;

      /*
       * User is leaving StockWave.
       *
       * iOS frequently goes:
       *
       * active
       * → inactive
       * → background
       */
      const isLeavingApp =
        previousAppState === 'active' &&
        (nextAppState === 'inactive' || nextAppState === 'background');

      if (isLeavingApp && isAuthenticated && pinCreated) {
        backgroundedAtRef.current = Date.now();
      }

      /*
       * User has returned to StockWave.
       */
      const isReturningToApp =
        nextAppState === 'active' &&
        (previousAppState === 'inactive' || previousAppState === 'background');

      if (isReturningToApp) {
        const backgroundedAt = backgroundedAtRef.current;

        backgroundedAtRef.current = null;

        if (
          !DEV_BYPASS_APP_LOCK &&
          isAuthenticated &&
          pinCreated &&
          backgroundedAt
        ) {
          const timeAway = Date.now() - backgroundedAt;

          /*
           * Only lock after the user has
           * been away long enough.
           */
          if (timeAway >= APP_LOCK_GRACE_PERIOD_MS) {
            setIsAppUnlocked(false);
          }
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, pinCreated]);

  const signIn = async (email: string, password: string) => {
    const data = await signInWithEmail(email, password);

    syncSession(data.session);

    /*
     * Email/password authentication itself
     * counts as fresh authentication.
     */
    setIsAppUnlocked(true);
  };

  const signUp = async (payload: SignUpPayload) => {
    const data = await signUpWithEmail(payload);

    syncSession(data.session);

    setHasCompletedVerification(false);

    setIsAppUnlocked(true);
  };

  const saveRegistrationPhone = async (phone: string, countryCode: string) => {
    const data = await saveRegistrationPhoneMetadata(phone, countryCode);

    const currentSession = session;

    if (currentSession && data.user) {
      syncSession({
        ...currentSession,

        user: data.user,
      });

      return;
    }

    const { data: sessionData, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    syncSession(sessionData.session);
  };

  const startVerification = async () => {
    return startInAppVerification();
  };

  const verifyVerificationCode = async (code: string) => {
    await verifyInAppVerification(code);

    setHasCompletedVerification(true);
  };

  const completeWelcome = async () => {
    await markWelcomeSeen();

    setHasSeenWelcome(true);
  };

  const createPin = async (pin: string) => {
    if (!user) {
      throw new Error('An authenticated user is required to create a PIN.');
    }

    await saveDevicePin(user.id, pin);

    setPinCreated(true);

    setIsAppUnlocked(true);
  };

  const verifyPin = async (pin: string) => {
    if (!user) {
      return false;
    }

    return verifyDevicePin(user.id, pin);
  };

  const unlockApp = () => {
    setIsAppUnlocked(true);
  };

  const lockApp = () => {
    setIsAppUnlocked(false);
  };

  const enableBiometrics = async () => {
    if (!user) {
      throw new Error(
        'An authenticated user is required to enable biometrics.',
      );
    }

    await setDeviceBiometricsEnabled(user.id, true);

    setBiometricEnabled(true);
  };

  /*
   * ---------------------------------------------------
   * PASSWORD RECOVERY
   * ---------------------------------------------------
   */

  const startPasswordReset = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error('Email address is required.');
    }

    const challenge = await startInAppPasswordRecovery(normalizedEmail);

    const expiresAt = new Date(challenge.expiresAt).getTime();

    if (!Number.isFinite(expiresAt)) {
      throw new Error('Unable to determine password recovery code expiry.');
    }

    setResetPasswordEmail(normalizedEmail);

    setResetPasswordVerified(false);

    setPasswordResetChallengeToken(challenge.challengeToken);

    setPasswordResetPreviewCode(challenge.code);

    setPasswordResetCodeExpiresAt(expiresAt);

    setPasswordResetToken('');
  };

  const resendPasswordResetCode = async () => {
    if (!resetPasswordEmail) {
      throw new Error('No password reset is currently in progress.');
    }

    const challenge = await startInAppPasswordRecovery(resetPasswordEmail);

    const expiresAt = new Date(challenge.expiresAt).getTime();

    if (!Number.isFinite(expiresAt)) {
      throw new Error('Unable to determine password recovery code expiry.');
    }

    setPasswordResetChallengeToken(challenge.challengeToken);

    setPasswordResetPreviewCode(challenge.code);

    setPasswordResetCodeExpiresAt(expiresAt);

    setResetPasswordVerified(false);

    setPasswordResetToken('');
  };

  const verifyPasswordResetCode = async (code: string) => {
    if (!resetPasswordEmail) {
      throw new Error('No password reset is currently in progress.');
    }

    if (!passwordResetChallengeToken || !passwordResetCodeExpiresAt) {
      throw new Error('No verification code is currently active.');
    }

    if (Date.now() >= passwordResetCodeExpiresAt) {
      setPasswordResetPreviewCode('');

      setPasswordResetCodeExpiresAt(null);

      setPasswordResetChallengeToken('');

      setResetPasswordVerified(false);

      throw new Error(
        'The verification code has expired. Generate a new code.',
      );
    }

    const verification = await verifyInAppPasswordRecovery(
      passwordResetChallengeToken,
      code,
    );

    setPasswordResetPreviewCode('');

    setPasswordResetCodeExpiresAt(null);

    setPasswordResetToken(verification.resetToken);

    setResetPasswordVerified(true);
  };

  const completePasswordReset = async (password: string) => {
    if (!resetPasswordVerified || !passwordResetToken) {
      throw new Error('Password recovery has not been verified.');
    }

    await completeInAppPasswordRecovery(passwordResetToken, password);

    setResetPasswordEmail('');
    setResetPasswordVerified(false);
    setPasswordResetPreviewCode('');
    setPasswordResetCodeExpiresAt(null);
    setPasswordResetChallengeToken('');
    setPasswordResetToken('');

    setIsAppUnlocked(false);
  };

  /*
   * ---------------------------------------------------
   * SIGN OUT
   * ---------------------------------------------------
   *
   * Normal sign-out preserves the PIN and
   * biometric configuration stored for the user.
   */
  const signOutCurrentDevice = async () => {
    const { error } = await supabase.auth.signOut({
      scope: 'local',
    });

    if (error) {
      throw error;
    }

    syncSession(null);

    setPinCreated(false);

    setBiometricEnabled(false);

    setIsAppUnlocked(false);

    setIsDeviceSecurityReady(true);

    setIsVerificationReady(true);

    backgroundedAtRef.current = null;
  };

  /*
   * ---------------------------------------------------
   * FULL RESET / ACCOUNT DELETION
   * ---------------------------------------------------
   *
   * Unlike normal sign-out this intentionally
   * removes persisted PIN and biometric data.
   */
  const resetSession = async () => {
    const userId = user?.id;

    if (userId) {
      await clearDeviceSecurity(userId);
    }

    const { error } = await supabase.auth.signOut({
      scope: 'local',
    });

    if (error) {
      console.warn('Unable to complete remote sign out during reset:', error);
    }

    syncSession(null);

    setPinCreated(false);

    setBiometricEnabled(false);

    setIsAppUnlocked(false);

    setResetPasswordEmail('');

    setResetPasswordVerified(false);

    setPasswordResetPreviewCode('');

    setPasswordResetCodeExpiresAt(null);

    setPasswordResetChallengeToken('');

    setPasswordResetToken('');

    setIsDeviceSecurityReady(true);

    setIsVerificationReady(true);

    backgroundedAtRef.current = null;
  };

  return (
    <AppSessionContext.Provider
      value={{
        session,
        user,

        isSessionReady,
        isAuthenticated,

        hasRegistrationPhone,
        hasSeenWelcome,

        hasCompletedVerification,
        isVerificationReady,

        signIn,
        signUp,

        saveRegistrationPhone,

        startVerification,
        verifyVerificationCode,

        completeWelcome,

        isDeviceSecurityReady,
        biometricEnabled,
        pinCreated,
        isAppUnlocked,

        shouldRequireAppUnlock,

        createPin,
        verifyPin,

        unlockApp,
        lockApp,

        enableBiometrics,

        resetPasswordEmail,
        resetPasswordVerified,
        passwordResetPreviewCode,
        passwordResetCodeExpiresAt,

        startPasswordReset,
        resendPasswordResetCode,
        verifyPasswordResetCode,
        completePasswordReset,

        signOutCurrentDevice,
        resetSession,
      }}
    >
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error('useAppSession must be used inside AppSessionProvider');
  }

  return context;
}
