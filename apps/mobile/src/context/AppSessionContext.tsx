import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type {
  Session,
  User,
} from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

import {
  markWelcomeSeen,
  resendPhoneChangeOtp,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  type SignUpPayload,
  verifyPhoneChange,
} from '../services/auth';

type AppSessionContextValue = {
  /*
   * Supabase authentication
   */
  session: Session | null;
  user: User | null;

  isSessionReady: boolean;
  isAuthenticated: boolean;
  isPhoneVerified: boolean;
  hasSeenWelcome: boolean;

  pendingPhone: string;

  signIn: (
    email: string,
    password: string,
  ) => Promise<void>;

  signUp: (
    payload: SignUpPayload,
  ) => Promise<void>;

  verifyPhoneCode: (
    code: string,
    phone?: string,
  ) => Promise<void>;

  resendPhoneCode: (
    phone?: string,
  ) => Promise<void>;

  completeWelcome: () => Promise<void>;

  /*
   * Device security
   */
  biometricEnabled: boolean;
  pinCreated: boolean;
  isAppUnlocked: boolean;

  createPin: (pin: string) => Promise<void>;

  verifyPin: (
    pin: string,
  ) => Promise<boolean>;

  unlockApp: () => void;
  lockApp: () => void;

  enableBiometrics: () => void;

  /*
   * Password reset
   *
   * Still temporary. We will wire Supabase
   * password recovery separately.
   */
  resetPasswordEmail: string;
  resetPasswordCode: string;
  resetPasswordVerified: boolean;

  startPasswordReset: (
    email: string,
  ) => void;

  setResetPasswordCode: (
    code: string,
  ) => void;

  verifyPasswordResetCode: () => void;

  completePasswordReset: () => void;

  /*
   * Logout / development reset
   */
  resetSession: () => Promise<void>;
};

const AppSessionContext =
  createContext<
    AppSessionContextValue | undefined
  >(undefined);

type AppSessionProviderProps = {
  children: ReactNode;
};

export function AppSessionProvider({
  children,
}: AppSessionProviderProps) {
  /*
   * Supabase session
   */
  const [session, setSession] =
    useState<Session | null>(null);

  const [isSessionReady, setIsSessionReady] =
    useState(false);

  const [hasSeenWelcome, setHasSeenWelcome] =
    useState(false);

  const [pendingPhone, setPendingPhone] =
    useState('');

  /*
   * Device security
   *
   * Still local development state.
   * We'll persist this properly after
   * authentication is stable.
   */
  const [biometricEnabled, setBiometricEnabled] =
    useState(false);

  const [pinCreated, setPinCreated] =
    useState(false);

  const [isAppUnlocked, setIsAppUnlocked] =
    useState(false);

  const [devicePin, setDevicePin] =
    useState<string | null>(null);

  /*
   * Password reset temporary state
   */
  const [
    resetPasswordEmail,
    setResetPasswordEmail,
  ] = useState('');

  const [
    resetPasswordCode,
    setResetPasswordCode,
  ] = useState('');

  const [
    resetPasswordVerified,
    setResetPasswordVerified,
  ] = useState(false);

  const user = session?.user ?? null;

  const isAuthenticated = Boolean(session);

  const isPhoneVerified = Boolean(
    user?.phone_confirmed_at,
  );

  /*
   * Sync context state from whatever
   * Supabase says the current session is.
   */
  const syncSession = (
    nextSession: Session | null,
  ) => {
    setSession(nextSession);

    const nextUser =
      nextSession?.user ?? null;

    if (!nextUser) {
      setHasSeenWelcome(false);
      setPendingPhone('');
      return;
    }

    setHasSeenWelcome(
      Boolean(
        nextUser.user_metadata
          ?.has_seen_welcome,
      ),
    );

    const registrationPhone =
      nextUser.user_metadata
        ?.registration_phone;

    if (
      typeof registrationPhone === 'string'
    ) {
      setPendingPhone(
        registrationPhone,
      );
    } else {
      setPendingPhone('');
    }
  };

  /*
   * Restore persisted Supabase session
   * when StockWave launches.
   */
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const {
        data,
        error,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          'Unable to restore Supabase session:',
          error.message,
        );
      }

      syncSession(data.session);
      setIsSessionReady(true);
    };

    void restoreSession();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, nextSession) => {
          if (!mounted) {
            return;
          }

          syncSession(nextSession);
          setIsSessionReady(true);
        },
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * Email/password sign in
   */
  const signIn = async (
    email: string,
    password: string,
  ) => {
    const data =
      await signInWithEmail(
        email,
        password,
      );

    syncSession(data.session);

    /*
     * Full credential authentication starts
     * the current device session unlocked.
     */
    setIsAppUnlocked(true);
  };

  /*
   * Email/password registration
   */
  const signUp = async (
    payload: SignUpPayload,
  ) => {
    setPendingPhone(
      payload.phone.trim(),
    );

    const data =
      await signUpWithEmail(payload);

    syncSession(data.session);

    setIsAppUnlocked(true);
  };

  /*
   * Phone verification
   */
  const verifyPhoneCode = async (
    code: string,
    explicitPhone?: string,
  ) => {
    const phone =
      explicitPhone?.trim() ||
      pendingPhone.trim();

    if (!phone) {
      throw new Error(
        'No phone number is available for verification.',
      );
    }

    await verifyPhoneChange(
      phone,
      code,
    );

    /*
     * Refresh the session so user.phone and
     * phone_confirmed_at immediately reflect
     * the successful verification.
     */
    const { data, error } =
      await supabase.auth.refreshSession();

    if (error) {
      throw error;
    }

    syncSession(data.session);

    setPendingPhone('');
  };

  const resendPhoneCode = async (
    explicitPhone?: string,
  ) => {
    const phone =
      explicitPhone?.trim() ||
      pendingPhone.trim();

    if (!phone) {
      throw new Error(
        'No phone number is available for verification.',
      );
    }

    await resendPhoneChangeOtp(phone);
  };

  /*
   * Welcome completion
   */
  const completeWelcome = async () => {
    await markWelcomeSeen();

    /*
     * Set immediately so navigation does not
     * race the Supabase USER_UPDATED event.
     */
    setHasSeenWelcome(true);
  };

  /*
   * PIN
   *
   * Development implementation.
   */
  const createPin = async (
    pin: string,
  ) => {
    setDevicePin(pin);
    setPinCreated(true);
    setIsAppUnlocked(true);
  };

  const verifyPin = async (
    pin: string,
  ) => {
    return devicePin === pin;
  };

  const unlockApp = () => {
    setIsAppUnlocked(true);
  };

  const lockApp = () => {
    setIsAppUnlocked(false);
  };

  const enableBiometrics = () => {
    setBiometricEnabled(true);
  };

  /*
   * Password reset
   *
   * Still temporary.
   */
  const startPasswordReset = (
    email: string,
  ) => {
    setResetPasswordEmail(
      email.trim().toLowerCase(),
    );

    setResetPasswordCode('');
    setResetPasswordVerified(false);
  };

  const verifyPasswordResetCode = () => {
    setResetPasswordVerified(true);
  };

  const completePasswordReset = () => {
    setResetPasswordEmail('');
    setResetPasswordCode('');
    setResetPasswordVerified(false);
  };

  /*
   * Supabase logout + local device state reset.
   */
  const resetSession = async () => {
    await signOut();

    syncSession(null);

    setBiometricEnabled(false);
    setPinCreated(false);
    setIsAppUnlocked(false);
    setDevicePin(null);

    setResetPasswordEmail('');
    setResetPasswordCode('');
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

        verifyPhoneCode,
        resendPhoneCode,

        completeWelcome,

        biometricEnabled,
        pinCreated,
        isAppUnlocked,

        createPin,
        verifyPin,

        unlockApp,
        lockApp,

        enableBiometrics,

        resetPasswordEmail,
        resetPasswordCode,
        resetPasswordVerified,

        startPasswordReset,
        setResetPasswordCode,
        verifyPasswordResetCode,
        completePasswordReset,

        resetSession,
      }}
    >
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const context =
    useContext(AppSessionContext);

  if (!context) {
    throw new Error(
      'useAppSession must be used inside AppSessionProvider',
    );
  }

  return context;
}