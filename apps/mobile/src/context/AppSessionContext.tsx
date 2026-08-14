import { createContext, useContext, useState, type ReactNode } from 'react';

type AppSessionContextValue = {
  /*
   * Authentication
   */
  isAuthenticated: boolean;
  isPhoneVerified: boolean;
  hasSeenWelcome: boolean;

  /*
   * Device security
   */
  biometricEnabled: boolean;
  pinCreated: boolean;
  isAppUnlocked: boolean;

  createPin: (pin: string) => Promise<void>;

  verifyPin: (pin: string) => Promise<boolean>;

  unlockApp: () => void;
  lockApp: () => void;

  /*
   * Registration / Sign in
   */
  completePhoneVerification: () => void;
  completeSignIn: () => void;
  completeWelcome: () => void;

  /*
   * Biometrics
   */
  enableBiometrics: () => void;

  /*
   * Password reset
   */
  resetPasswordEmail: string;
  resetPasswordCode: string;
  resetPasswordVerified: boolean;

  startPasswordReset: (email: string) => void;

  setResetPasswordCode: (code: string) => void;
  verifyPasswordResetCode: () => void;
  completePasswordReset: () => void;

  /*
   * Development logout/reset
   */
  resetSession: () => void;
};

const AppSessionContext = createContext<AppSessionContextValue | undefined>(
  undefined,
);

type AppSessionProviderProps = {
  children: ReactNode;
};

export function AppSessionProvider({ children }: AppSessionProviderProps) {
  /*
   * Authentication state
   */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  /*
   * Device security state
   */
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinCreated, setPinCreated] = useState(false);
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);

  /*
   * DEVELOPMENT ONLY.
   *
   * This will eventually be replaced by
   * the proper secure storage layer.
   */
  const [devicePin, setDevicePin] = useState<string | null>(null);

  /*
   * Password reset state
   */
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [resetPasswordCode, setResetPasswordCode] = useState('');
  const [resetPasswordVerified, setResetPasswordVerified] = useState(false);

  /*
   * PIN
   */
  const createPin = async (pin: string) => {
    // DEVELOPMENT ONLY
    setDevicePin(pin);
    setPinCreated(true);

    /*
     * The user is already inside an
     * authenticated session while creating
     * the PIN, so the app remains unlocked.
     */
    setIsAppUnlocked(true);
  };

  const verifyPin = async (pin: string) => {
    // DEVELOPMENT ONLY
    return devicePin === pin;
  };

  /*
   * App lock/unlock
   */
  const unlockApp = () => {
    setIsAppUnlocked(true);
  };

  const lockApp = () => {
    setIsAppUnlocked(false);
  };

  /*
   * Registration OTP successfully verified.
   *
   * Registration itself proves the user's
   * identity, so the current app session
   * starts unlocked.
   */
  const completePhoneVerification = () => {
    setIsAuthenticated(true);
    setIsPhoneVerified(true);
    setIsAppUnlocked(true);
  };

  /*
   * Successful full sign in using account
   * credentials.
   *
   * A fresh successful sign in also starts
   * the current app session unlocked.
   */
  const completeSignIn = () => {
    setIsAuthenticated(true);
    setIsPhoneVerified(true);
    setHasSeenWelcome(true);
    setIsAppUnlocked(true);
  };

  const completeWelcome = () => {
    setHasSeenWelcome(true);
  };

  /*
   * Biometrics
   */
  const enableBiometrics = () => {
    setBiometricEnabled(true);
  };

  /*
   * Password reset
   */
  const startPasswordReset = (email: string) => {
    setResetPasswordEmail(email.trim().toLowerCase());
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
   * DEVELOPMENT ONLY.
   *
   * Later this becomes the real logout/
   * session clearing implementation.
   */
  const resetSession = () => {
    setIsAuthenticated(false);
    setIsPhoneVerified(false);
    setHasSeenWelcome(false);
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
        isAuthenticated,
        isPhoneVerified,
        hasSeenWelcome,

        biometricEnabled,
        pinCreated,
        isAppUnlocked,

        createPin,
        verifyPin,

        unlockApp,
        lockApp,

        completePhoneVerification,
        completeSignIn,
        completeWelcome,

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
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error('useAppSession must be used inside AppSessionProvider');
  }

  return context;
}
