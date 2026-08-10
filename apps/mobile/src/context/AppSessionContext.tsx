import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type AppSessionContextValue = {
  isAuthenticated: boolean;
  isPhoneVerified: boolean;
  hasSeenWelcome: boolean;

  biometricEnabled: boolean;
  biometricPromptDismissed: boolean;

  pinCreated: boolean;

  completePhoneVerification: () => void;
  completeSignIn: () => void;
  completeWelcome: () => void;

  enableBiometrics: () => void;
  dismissBiometricPrompt: () => void;

  completePinSetup: () => void;

  resetSession: () => void;
};

const AppSessionContext = createContext<
  AppSessionContextValue | undefined
>(undefined);

type AppSessionProviderProps = {
  children: ReactNode;
};

export function AppSessionProvider({
  children,
}: AppSessionProviderProps) {
  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [isPhoneVerified, setIsPhoneVerified] =
    useState(false);

  const [hasSeenWelcome, setHasSeenWelcome] =
    useState(false);

  const [biometricEnabled, setBiometricEnabled] =
    useState(false);

  const [
    biometricPromptDismissed,
    setBiometricPromptDismissed,
  ] = useState(false);

  const [pinCreated, setPinCreated] =
    useState(false);

  /**
   * Registration OTP has been successfully verified.
   */
  const completePhoneVerification = () => {
    setIsAuthenticated(true);
    setIsPhoneVerified(true);
  };

  /**
   * Dummy successful login.
   *
   * Returning users don't need to see the registration
   * welcome screen again.
   */
  const completeSignIn = () => {
    setIsAuthenticated(true);
    setIsPhoneVerified(true);
    setHasSeenWelcome(true);
  };

  const completeWelcome = () => {
    setHasSeenWelcome(true);
  };

  const enableBiometrics = () => {
    setBiometricEnabled(true);
    setBiometricPromptDismissed(false);
  };

  const dismissBiometricPrompt = () => {
    setBiometricPromptDismissed(true);
  };

  const completePinSetup = () => {
    setPinCreated(true);
  };

  const resetSession = () => {
    setIsAuthenticated(false);
    setIsPhoneVerified(false);
    setHasSeenWelcome(false);

    setBiometricEnabled(false);
    setBiometricPromptDismissed(false);

    setPinCreated(false);
  };

  return (
    <AppSessionContext.Provider
      value={{
        isAuthenticated,
        isPhoneVerified,
        hasSeenWelcome,

        biometricEnabled,
        biometricPromptDismissed,

        pinCreated,

        completePhoneVerification,
        completeSignIn,
        completeWelcome,

        enableBiometrics,
        dismissBiometricPrompt,

        completePinSetup,

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
    throw new Error(
      'useAppSession must be used inside AppSessionProvider',
    );
  }

  return context;
}