import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

import {
  completePhoneSignUpProfile,
  markWelcomeSeen,
  requestPasswordReset,
  requestPhoneAuth,
  requestPhoneVerification,
  resendPhoneVerification,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updateRecoveredPassword,
  verifyPasswordRecoveryCode,
  verifyPhoneAuthOtp,
  verifyPhoneChange,
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

type PhoneAuthMode = 'sign-in' | 'sign-up';

type AppSessionContextValue = {
  session: Session | null;
  user: User | null;

  isSessionReady: boolean;
  isAuthenticated: boolean;
  isPhoneVerified: boolean;
  hasSeenWelcome: boolean;

  pendingPhone: string;

  signIn: (email: string, password: string) => Promise<void>;

  signUp: (payload: SignUpPayload) => Promise<void>;

  startPhoneVerification: (phone: string) => Promise<void>;

  verifyPhoneCode: (code: string) => Promise<void>;

  resendPhoneCode: () => Promise<void>;

  startPhoneAuth: (phone: string, mode: PhoneAuthMode) => Promise<void>;

  verifyPhoneAuth: (
    phone: string,
    code: string,
    mode: PhoneAuthMode,
    username?: string,
  ) => Promise<void>;

  completeWelcome: () => Promise<void>;

  isDeviceSecurityReady: boolean;
  biometricEnabled: boolean;
  pinCreated: boolean;
  isAppUnlocked: boolean;

  createPin: (pin: string) => Promise<void>;

  verifyPin: (pin: string) => Promise<boolean>;

  unlockApp: () => void;
  lockApp: () => void;

  enableBiometrics: () => Promise<void>;

  resetPasswordEmail: string;
  resetPasswordVerified: boolean;

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

  const [pendingPhone, setPendingPhone] = useState('');

  const [isDeviceSecurityReady, setIsDeviceSecurityReady] = useState(false);

  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const [pinCreated, setPinCreated] = useState(false);

  const [isAppUnlocked, setIsAppUnlocked] = useState(false);

  const [resetPasswordEmail, setResetPasswordEmail] = useState('');

  const [resetPasswordVerified, setResetPasswordVerified] = useState(false);

  const user = session?.user ?? null;

  const isAuthenticated = Boolean(session);

  const isPhoneVerified = Boolean(user?.phone_confirmed_at);

  const syncSession = (nextSession: Session | null) => {
    setSession(nextSession);

    const nextUser = nextSession?.user ?? null;

    if (!nextUser) {
      setHasSeenWelcome(false);
      setPendingPhone('');

      return;
    }

    setHasSeenWelcome(Boolean(nextUser.user_metadata?.has_seen_welcome));

    const registrationPhone = nextUser.user_metadata?.registration_phone;

    if (typeof registrationPhone === 'string') {
      setPendingPhone(registrationPhone);
    } else {
      setPendingPhone('');
    }
  };

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
       * A restored session does not
       * automatically unlock the app.
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

  const signIn = async (email: string, password: string) => {
    const data = await signInWithEmail(email, password);

    syncSession(data.session);

    setIsAppUnlocked(true);
  };

  const signUp = async (payload: SignUpPayload) => {
    const data = await signUpWithEmail(payload);

    syncSession(data.session);

    setIsAppUnlocked(true);
  };

  const startPhoneVerification = async (phone: string) => {
    const normalizedPhone = phone.trim();

    if (!normalizedPhone) {
      throw new Error('Phone number is required.');
    }

    await requestPhoneVerification(normalizedPhone);

    setPendingPhone(normalizedPhone);
  };

  const verifyPhoneCode = async (code: string) => {
    if (!pendingPhone) {
      throw new Error('No phone number is currently being verified.');
    }

    await verifyPhoneChange(pendingPhone, code);

    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      throw error;
    }

    syncSession(data.session);

    setPendingPhone('');
  };

  const resendPhoneCode = async () => {
    if (!pendingPhone) {
      throw new Error('No phone number is currently being verified.');
    }

    await resendPhoneVerification(pendingPhone);
  };

  const startPhoneAuth = async (phone: string, mode: PhoneAuthMode) => {
    const normalizedPhone = phone.trim();

    if (!normalizedPhone) {
      throw new Error('Phone number is required.');
    }

    await requestPhoneAuth(normalizedPhone, mode);
  };

  const verifyPhoneAuth = async (
    phone: string,
    code: string,
    mode: PhoneAuthMode,
    username?: string,
  ) => {
    const normalizedPhone = phone.trim();

    if (!normalizedPhone) {
      throw new Error('Phone number is required.');
    }

    const data = await verifyPhoneAuthOtp(normalizedPhone, code);

    syncSession(data.session);

    if (mode === 'sign-up') {
      const normalizedUsername = username?.trim();

      if (!normalizedUsername) {
        throw new Error('Username is required.');
      }

      await completePhoneSignUpProfile(normalizedUsername);

      const { data: refreshedSession, error } =
        await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      syncSession(refreshedSession.session);
    }

    setIsAppUnlocked(true);
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

  const startPasswordReset = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error('Email address is required.');
    }

    await requestPasswordReset(normalizedEmail);

    setResetPasswordEmail(normalizedEmail);

    setResetPasswordVerified(false);
  };

  const resendPasswordResetCode = async () => {
    if (!resetPasswordEmail) {
      throw new Error('No password reset is currently in progress.');
    }

    await requestPasswordReset(resetPasswordEmail);
  };

  const verifyPasswordResetCode = async (code: string) => {
    if (!resetPasswordEmail) {
      throw new Error('No password reset is currently in progress.');
    }

    await verifyPasswordRecoveryCode(resetPasswordEmail, code);

    setResetPasswordVerified(true);
  };

  const completePasswordReset = async (password: string) => {
    if (!resetPasswordVerified) {
      throw new Error('Password recovery has not been verified.');
    }

    await updateRecoveredPassword(password);

    setResetPasswordEmail('');

    setResetPasswordVerified(false);

    setIsAppUnlocked(false);
  };

  const signOutCurrentDevice = async () => {
    const userId = user?.id;

    if (userId) {
      await clearDeviceSecurity(userId);
    }

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
  };

  const resetSession = async () => {
    const userId = user?.id;

    if (userId) {
      await clearDeviceSecurity(userId);
    }

    await signOut();

    syncSession(null);

    setPinCreated(false);

    setBiometricEnabled(false);

    setIsAppUnlocked(false);

    setResetPasswordEmail('');

    setResetPasswordVerified(false);
  };

  return (
    <AppSessionContext.Provider
      value={{
        session,
        user,

        isSessionReady,
        isAuthenticated,
        isPhoneVerified,
        hasSeenWelcome,

        pendingPhone,

        signIn,
        signUp,

        startPhoneVerification,
        verifyPhoneCode,
        resendPhoneCode,

        startPhoneAuth,
        verifyPhoneAuth,

        completeWelcome,

        isDeviceSecurityReady,
        biometricEnabled,
        pinCreated,
        isAppUnlocked,

        createPin,
        verifyPin,

        unlockApp,
        lockApp,

        enableBiometrics,

        resetPasswordEmail,
        resetPasswordVerified,

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
