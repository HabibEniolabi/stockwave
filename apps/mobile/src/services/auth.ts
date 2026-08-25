import { supabase } from '../lib/supabase';

export type SignUpPayload = {
  username: string;
  email: string;
  password: string;
};

export type PhoneAuthMode = 'sign-in' | 'sign-up';

export async function signUpWithEmail({
  username,
  email,
  password,
}: SignUpPayload) {
  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        username: normalizedUsername,
        has_seen_welcome: false,
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error('Unable to start your session after registration.');
  }

  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function requestPhoneAuth(phone: string, mode: PhoneAuthMode) {
  const { error } = await supabase.auth.signInWithOtp({
    phone: phone.trim(),

    options: {
      shouldCreateUser: mode === 'sign-up',
    },
  });

  if (error) {
    throw error;
  }
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);

  if (error) {
    throw error;
  }
}

export async function verifyPasswordRecoveryCode(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'recovery',
  });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error('Unable to start password recovery session.');
  }

  return data;
}

export async function updateRecoveredPassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }

  const { error: signOutError } = await supabase.auth.signOut({
    scope: 'global',
  });

  if (signOutError) {
    throw signOutError;
  }
}

export async function requestPhoneVerification(phone: string) {
  const normalizedPhone = phone.trim();

  const { data, error } = await supabase.auth.updateUser({
    phone: normalizedPhone,

    data: {
      /*
       * Temporarily save this so the OTP
       * flow can recover it if necessary.
       */
      registration_phone: normalizedPhone,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function verifyPhoneChange(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone.trim(),
    token: token.trim(),
    type: 'phone_change',
  });

  if (error) {
    throw error;
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      registration_phone: null,
    },
  });

  if (metadataError) {
    console.warn(
      'Unable to clear temporary phone metadata:',
      metadataError.message,
    );
  }

  return data;
}

export async function resendPhoneVerification(phone: string) {
  const { error } = await supabase.auth.resend({
    type: 'phone_change',
    phone: phone.trim(),
  });

  if (error) {
    throw error;
  }
}

export async function markWelcomeSeen() {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      has_seen_welcome: true,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function verifyPhoneAuthOtp(
  phone: string,
  token: string,
) {
  const {
    data,
    error,
  } =
    await supabase.auth
      .verifyOtp({
        phone:
          phone.trim(),

        token:
          token.trim(),

        type: 'sms',
      });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error(
      'Unable to start phone authentication session.',
    );
  }

  return data;
}

export async function completePhoneSignUpProfile(
  username: string,
) {
  const {
    data,
    error,
  } =
    await supabase.auth
      .updateUser({
        data: {
          username:
            username.trim(),

          has_seen_welcome:
            false,
        },
      });

  if (error) {
    throw error;
  }

  return data;
}