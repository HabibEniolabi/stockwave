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

// export async function verifyPhoneAuthOtp(
//   phone: string,
//   token: string,
// ) {
//   const {
//     data,
//     error,
//   } =
//     await supabase.auth
//       .verifyOtp({
//         phone:
//           phone.trim(),

//         token:
//           token.trim(),

//         type: 'sms',
//       });

//   if (error) {
//     throw error;
//   }

//   if (!data.session) {
//     throw new Error(
//       'Unable to start phone authentication session.',
//     );
//   }

//   return data;
// }

export async function completePhoneSignUpProfile(username: string) {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      username: username.trim(),

      has_seen_welcome: false,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export type InAppVerificationChallenge = {
  code: string;
  expiresAt: string;
};

export async function startInAppVerification(): Promise<InAppVerificationChallenge> {
  const { data, error } = await supabase.rpc('start_in_app_verification');

  if (error) {
    throw error;
  }

  const challenge = Array.isArray(data) ? data[0] : data;

  if (!challenge?.code || !challenge?.expires_at) {
    throw new Error('Unable to create verification challenge.');
  }

  return {
    code: challenge.code,
    expiresAt: challenge.expires_at,
  };
}

export async function verifyInAppVerification(code: string) {
  const { data, error } = await supabase.rpc('verify_in_app_verification', {
    p_code: code.trim(),
  });

  if (error) {
    throw error;
  }

  if (data !== true) {
    throw new Error('The verification code is invalid or has expired.');
  }
}

export async function getInAppVerificationStatus(userId: string) {
  const { data, error } = await supabase
    .from('user_verification_state')
    .select('verification_completed_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.verification_completed_at);
}

export async function saveRegistrationPhone(
  phone: string,
  countryCode: string,
) {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      registration_phone: phone.trim(),
      registration_country_code: countryCode,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export type PasswordResetChallenge = {
  challengeId: string;
  code: string;
  expiresAt: string;
};

export type PasswordResetVerification = {
  resetToken: string;
  resetTokenExpiresAt: string;
};

export async function startInAppPasswordRecovery(
  email: string,
): Promise<PasswordResetChallenge> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.functions.invoke(
    'password-recovery',
    {
      body: {
        action: 'start',
        email: normalizedEmail,
      },
    },
  );

  if (error) {
    throw error;
  }

  if (
    !data?.challengeId ||
    !data?.code ||
    !data?.expiresAt
  ) {
    throw new Error(
      data?.error ?? 'Unable to generate password recovery code.',
    );
  }

  return {
    challengeId: String(data.challengeId),
    code: String(data.code),
    expiresAt: String(data.expiresAt),
  };
}

export async function verifyInAppPasswordRecovery(
  challengeId: string,
  code: string,
): Promise<PasswordResetVerification> {
  const { data, error } = await supabase.functions.invoke(
    'password-recovery',
    {
      body: {
        action: 'verify',
        challengeId,
        code: code.trim(),
      },
    },
  );

  if (error) {
    throw error;
  }

  if (
    !data?.resetToken ||
    !data?.resetTokenExpiresAt
  ) {
    throw new Error(
      data?.error ?? 'Unable to verify password recovery code.',
    );
  }

  return {
    resetToken: String(data.resetToken),
    resetTokenExpiresAt: String(data.resetTokenExpiresAt),
  };
}

export async function completeInAppPasswordRecovery(
  resetToken: string,
  password: string,
) {
  const { data, error } = await supabase.functions.invoke(
    'password-recovery',
    {
      body: {
        action: 'complete',
        resetToken,
        password,
      },
    },
  );

  if (error) {
    throw error;
  }

  if (data?.success !== true) {
    throw new Error(
      data?.error ?? 'Unable to update your password.',
    );
  }

  return data;
}