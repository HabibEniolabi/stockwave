import { supabase } from '../lib/supabase';

export type SignUpPayload = {
  firstName: string;
  lastName: string;
  phone: string;
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
  firstName,
  lastName,
  email,
  password,
  phone,
}: SignUpPayload) {
  const normalizedEmail = email.trim().toLowerCase();

  const normalizedPhone = phone.trim();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),

        /*
         * Keep this until phone verification
         * completes so the OTP flow can survive
         * navigation/session restoration.
         */
        registration_phone: normalizedPhone,

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

  /*
   * Attach the phone number to the authenticated
   * Supabase user.
   *
   * With phone confirmation enabled, Supabase
   * sends an OTP to this number.
   */
  const { error: phoneUpdateError } = await supabase.auth.updateUser({
    phone: normalizedPhone,
  });

  if (phoneUpdateError) {
    throw phoneUpdateError;
  }

  return data;
}

export async function verifyPhoneChange(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
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
