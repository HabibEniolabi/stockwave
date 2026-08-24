import { supabase } from '../lib/supabase';

export type SignUpPayload = {
  username: string;
  email: string;
  password: string;
};

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

export async function signUpWithEmail({
  username,
  email,
  password,
}: SignUpPayload) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();

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

  /*
   * Our current StockWave registration flow
   * requires an authenticated session immediately.
   *
   * If Supabase email confirmation is enabled,
   * signUp may return a user but no session.
   */
  if (!data.session) {
    throw new Error(
      'Registration requires an active session. Disable email confirmation for the current StockWave signup flow.',
    );
  }

  return data;
}

export async function requestPhoneVerification(
  phone: string,
) {
  const normalizedPhone = phone.trim();

  const { data, error } =
    await supabase.auth.updateUser({
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

  /*
   * We no longer need the temporary
   * registration phone metadata.
   */
  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      registration_phone: null,
    },
  });

  if (metadataError) {
    console.warn(
      'Unable to clear registration phone metadata:',
      metadataError.message,
    );
  }

  return data;
}

export async function resendPhoneChangeOtp(phone: string) {
  const { error } = await supabase.auth.resend({
    type: 'phone_change',
    phone,
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
