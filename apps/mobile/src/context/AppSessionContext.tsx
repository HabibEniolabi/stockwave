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
  getInAppVerificationStatus,
  markWelcomeSeen,
  requestPasswordReset,
  saveRegistrationPhone as saveRegistrationPhoneMetadata,
  signInWithEmail,
  signUpWithEmail,
  startInAppVerification,
  updateRecoveredPassword,
  verifyInAppVerification,
  verifyPasswordRecoveryCode,
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

  signIn: (
    email: string,
    password: string,
  ) => Promise<void>;

  signUp: (
    payload: SignUpPayload,
  ) => Promise<void>;

  saveRegistrationPhone: (
    phone: string,
    countryCode: string,
  ) => Promise<void>;

  startVerification:
    () => Promise<VerificationChallenge>;

  verifyVerificationCode: (
    code: string,
  ) => Promise<void>;

  completeWelcome: () => Promise<void>;

  isDeviceSecurityReady: boolean;
  biometricEnabled: boolean;
  pinCreated: boolean;
  isAppUnlocked: boolean;

  createPin: (
    pin: string,
  ) => Promise<void>;

  verifyPin: (
    pin: string,
  ) => Promise<boolean>;

  unlockApp: () => void;
  lockApp: () => void;

  enableBiometrics: () => Promise<void>;

  resetPasswordEmail: string;
  resetPasswordVerified: boolean;

  startPasswordReset: (
    email: string,
  ) => Promise<void>;

  resendPasswordResetCode:
    () => Promise<void>;

  verifyPasswordResetCode: (
    code: string,
  ) => Promise<void>;

  completePasswordReset: (
    password: string,
  ) => Promise<void>;

  signOutCurrentDevice: () => Promise<void>;

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
  const [session, setSession] =
    useState<Session | null>(null);

  const [
    isSessionReady,
    setIsSessionReady,
  ] = useState(false);

  const [
    hasSeenWelcome,
    setHasSeenWelcome,
  ] = useState(false);

  const [
    hasCompletedVerification,
    setHasCompletedVerification,
  ] = useState(false);

  const [
    isVerificationReady,
    setIsVerificationReady,
  ] = useState(false);

  const [
    isDeviceSecurityReady,
    setIsDeviceSecurityReady,
  ] = useState(false);

  const [
    biometricEnabled,
    setBiometricEnabled,
  ] = useState(false);

  const [
    pinCreated,
    setPinCreated,
  ] = useState(false);

  const [
    isAppUnlocked,
    setIsAppUnlocked,
  ] = useState(false);

  const [
    resetPasswordEmail,
    setResetPasswordEmail,
  ] = useState('');

  const [
    resetPasswordVerified,
    setResetPasswordVerified,
  ] = useState(false);

  const user =
    session?.user ?? null;

  const isAuthenticated =
    Boolean(session);

  const hasRegistrationPhone =
    Boolean(
      user?.user_metadata
        ?.registration_phone,
    );

  const syncSession = (
    nextSession: Session | null,
  ) => {
    setSession(nextSession);

    const nextUser =
      nextSession?.user ?? null;

    if (!nextUser) {
      setHasSeenWelcome(false);
      setHasCompletedVerification(false);

      return;
    }

    setHasSeenWelcome(
      Boolean(
        nextUser.user_metadata
          ?.has_seen_welcome,
      ),
    );
  };

  useEffect(() => {
    let mounted = true;

    const restoreSession =
      async () => {
        const { data, error } =
          await supabase.auth.getSession();

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

        setIsAppUnlocked(false);
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

  useEffect(() => {
    let active = true;

    const restoreVerificationState =
      async () => {
        if (!isSessionReady) {
          return;
        }

        setIsVerificationReady(false);

        if (!user) {
          if (!active) {
            return;
          }

          setHasCompletedVerification(
            false,
          );

          setIsVerificationReady(true);

          return;
        }

        try {
          const verified =
            await getInAppVerificationStatus(
              user.id,
            );

          if (!active) {
            return;
          }

          setHasCompletedVerification(
            verified,
          );
        } catch (error) {
          console.error(
            'Unable to restore verification state:',
            error,
          );

          if (active) {
            setHasCompletedVerification(
              false,
            );
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
  }, [
    isSessionReady,
    user?.id,
  ]);

  useEffect(() => {
    let active = true;

    const restoreDeviceSecurity =
      async () => {
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

          setIsDeviceSecurityReady(
            true,
          );

          return;
        }

        try {
          const [
            hasPin,
            biometricsEnabled,
          ] = await Promise.all([
            hasDevicePin(user.id),
            getDeviceBiometricsEnabled(
              user.id,
            ),
          ]);

          if (!active) {
            return;
          }

          setPinCreated(hasPin);

          setBiometricEnabled(
            biometricsEnabled,
          );
        } catch (error) {
          console.error(
            'Unable to restore device security:',
            error,
          );

          if (!active) {
            return;
          }

          setPinCreated(false);
          setBiometricEnabled(false);
        } finally {
          if (active) {
            setIsDeviceSecurityReady(
              true,
            );
          }
        }
      };

    void restoreDeviceSecurity();

    return () => {
      active = false;
    };
  }, [
    isSessionReady,
    user?.id,
  ]);

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

    setIsAppUnlocked(true);
  };

  const signUp = async (
    payload: SignUpPayload,
  ) => {
    const data =
      await signUpWithEmail(payload);

    syncSession(data.session);

    setHasCompletedVerification(false);
    setIsAppUnlocked(true);
  };

  const saveRegistrationPhone =
    async (
      phone: string,
      countryCode: string,
    ) => {
      const data =
        await saveRegistrationPhoneMetadata(
          phone,
          countryCode,
        );

      const currentSession =
        session;

      if (
        currentSession &&
        data.user
      ) {
        syncSession({
          ...currentSession,
          user: data.user,
        });

        return;
      }

      const {
        data: sessionData,
        error,
      } =
        await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      syncSession(
        sessionData.session,
      );
    };

  const startVerification =
    async () => {
      return startInAppVerification();
    };

  const verifyVerificationCode =
    async (
      code: string,
    ) => {
      await verifyInAppVerification(
        code,
      );

      setHasCompletedVerification(
        true,
      );
    };

  const completeWelcome =
    async () => {
      await markWelcomeSeen();

      setHasSeenWelcome(true);
    };

  const createPin = async (
    pin: string,
  ) => {
    if (!user) {
      throw new Error(
        'An authenticated user is required to create a PIN.',
      );
    }

    await saveDevicePin(
      user.id,
      pin,
    );

    setPinCreated(true);
    setIsAppUnlocked(true);
  };

  const verifyPin = async (
    pin: string,
  ) => {
    if (!user) {
      return false;
    }

    return verifyDevicePin(
      user.id,
      pin,
    );
  };

  const unlockApp = () => {
    setIsAppUnlocked(true);
  };

  const lockApp = () => {
    setIsAppUnlocked(false);
  };

  const enableBiometrics =
    async () => {
      if (!user) {
        throw new Error(
          'An authenticated user is required to enable biometrics.',
        );
      }

      await setDeviceBiometricsEnabled(
        user.id,
        true,
      );

      setBiometricEnabled(true);
    };

  const startPasswordReset =
    async (
      email: string,
    ) => {
      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      if (!normalizedEmail) {
        throw new Error(
          'Email address is required.',
        );
      }

      await requestPasswordReset(
        normalizedEmail,
      );

      setResetPasswordEmail(
        normalizedEmail,
      );

      setResetPasswordVerified(
        false,
      );
    };

  const resendPasswordResetCode =
    async () => {
      if (!resetPasswordEmail) {
        throw new Error(
          'No password reset is currently in progress.',
        );
      }

      await requestPasswordReset(
        resetPasswordEmail,
      );
    };

  const verifyPasswordResetCode =
    async (
      code: string,
    ) => {
      if (!resetPasswordEmail) {
        throw new Error(
          'No password reset is currently in progress.',
        );
      }

      await verifyPasswordRecoveryCode(
        resetPasswordEmail,
        code,
      );

      setResetPasswordVerified(true);
    };

  const completePasswordReset =
    async (
      password: string,
    ) => {
      if (!resetPasswordVerified) {
        throw new Error(
          'Password recovery has not been verified.',
        );
      }

      await updateRecoveredPassword(
        password,
      );

      setResetPasswordEmail('');

      setResetPasswordVerified(
        false,
      );

      setIsAppUnlocked(false);
    };

  const signOutCurrentDevice =
  async () => {
    const {
      error,
    } =
      await supabase.auth
        .signOut({
          scope: 'local',
        });

    if (error) {
      throw error;
    }

    /*
     * IMPORTANT:
     *
     * Do not call clearDeviceSecurity()
     * here.
     *
     * Ordinary logout should preserve the
     * PIN/biometric configuration belonging
     * to this user on this installation.
     */
    syncSession(null);

    /*
     * Clear in-memory state because there
     * is currently no authenticated user.
     *
     * The persisted PIN/biometric values
     * have NOT been deleted.
     */
    setPinCreated(false);

    setBiometricEnabled(
      false,
    );

    setIsAppUnlocked(false);

    setIsDeviceSecurityReady(
      true,
    );

    setIsVerificationReady(
      true,
    );
  };

  const resetSession =
  async () => {
    const userId =
      user?.id;

    /*
     * This IS destructive cleanup.
     *
     * Used after account deletion or
     * a genuine full local reset.
     */
    if (userId) {
      await clearDeviceSecurity(
        userId,
      );
    }

    /*
     * Account deletion may already have
     * invalidated the backend session.
     *
     * We still need to ensure the client
     * removes its local Supabase session.
     */
    const {
      error,
    } =
      await supabase.auth
        .signOut({
          scope: 'local',
        });

    if (error) {
      console.warn(
        'Unable to complete remote sign out during reset:',
        error,
      );
    }

    /*
     * Always reset application state even
     * if the deleted session is already
     * invalid server-side.
     */
    syncSession(null);

    setPinCreated(false);

    setBiometricEnabled(
      false,
    );

    setIsAppUnlocked(false);

    setResetPasswordEmail('');

    setResetPasswordVerified(
      false,
    );

    setIsDeviceSecurityReady(
      true,
    );

    setIsVerificationReady(
      true,
    );
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
  const context =
    useContext(AppSessionContext);

  if (!context) {
    throw new Error(
      'useAppSession must be used inside AppSessionProvider',
    );
  }

  return context;
}