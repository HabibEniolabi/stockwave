//@ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const OTP_DURATION_MS = 5 * 60 * 1000;

const RESET_TOKEN_DURATION_MS = 10 * 60 * 1000;

const MAX_OTP_ATTEMPTS = 5;

type PasswordRecoveryAction = 'start' | 'verify' | 'complete';

type PasswordRecoveryRequest = {
  action?: PasswordRecoveryAction;

  email?: string;

  challengeId?: string;
  code?: string;

  resetToken?: string;
  password?: string;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,

    headers: {
      ...corsHeaders,

      'Content-Type': 'application/json',
    },
  });

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const generateOtp = () => {
  const values = new Uint32Array(1);

  crypto.getRandomValues(values);

  return (100000 + (values[0] % 900000)).toString();
};

const generateResetToken = () => {
  const bytes = new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
};

const sha256 = async (value: string) => {
  const encoded = new TextEncoder().encode(value);

  const digest = await crypto.subtle.digest('SHA-256', encoded);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse(
      {
        error: 'Method not allowed.',
      },
      405,
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Password recovery environment is not configured.');

    return jsonResponse(
      {
        error: 'Password recovery service is unavailable.',
      },
      500,
    );
  }

  /*
   * IMPORTANT:
   *
   * This client has privileged access.
   * It must exist ONLY inside the
   * Edge Function.
   *
   * Never expose the service-role key
   * to the React Native application.
   */
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,

      autoRefreshToken: false,

      detectSessionInUrl: false,
    },
  });

  try {
    const body = (await request.json()) as PasswordRecoveryRequest;

    const action = body.action;

    /*
     * ------------------------------------------------
     * START
     * ------------------------------------------------
     *
     * Email
     *   ↓
     * find account
     *   ↓
     * generate our own OTP
     *   ↓
     * store hash
     *   ↓
     * return actual code to the app
     *
     * No Supabase OTP is involved.
     */
    if (action === 'start') {
      const email = normalizeEmail(body.email ?? '');

      if (!email) {
        return jsonResponse(
          {
            error: 'Email address is required.',
          },
          400,
        );
      }

      /*
       * Find the matching Auth user.
       *
       * This uses the server-only Admin
       * API. It must never run on the
       * React Native client.
       */
      let userId: string | null = null;

      let page = 1;

      const perPage = 1000;

      while (!userId) {
        const { data, error } = await admin.auth.admin.listUsers({
          page,
          perPage,
        });

        if (error) {
          throw error;
        }

        const matchingUser = data.users.find(
          (user) => user.email?.trim().toLowerCase() === email,
        );

        if (matchingUser) {
          userId = matchingUser.id;

          break;
        }

        if (data.users.length < perPage) {
          break;
        }

        page += 1;
      }

      if (!userId) {
        return jsonResponse(
          {
            error: 'No account was found for this email address.',
          },
          404,
        );
      }

      /*
       * Invalidate any previous active
       * password-recovery challenges
       * belonging to this user.
       */
      const { error: invalidateError } = await admin
        .from('password_recovery_challenges')
        .update({
          used_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .is('used_at', null);

      if (invalidateError) {
        throw invalidateError;
      }

      const code = generateOtp();

      const codeHash = await sha256(code);

      const expiresAt = new Date(Date.now() + OTP_DURATION_MS).toISOString();

      const { data: challenge, error: insertError } = await admin
        .from('password_recovery_challenges')
        .insert({
          user_id: userId,

          email,

          code_hash: codeHash,

          expires_at: expiresAt,

          attempts: 0,
        })
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      /*
       * This is intentionally returned
       * because your current recovery
       * design displays the OTP inside
       * OtpPreviewModal.
       */
      return jsonResponse({
        challengeId: challenge.id,

        code,

        expiresAt,
      });
    }

    /*
     * ------------------------------------------------
     * VERIFY
     * ------------------------------------------------
     */
    if (action === 'verify') {
      const challengeId = body.challengeId?.trim();

      const code = body.code?.trim();

      if (!challengeId || !code) {
        return jsonResponse(
          {
            error: 'Challenge ID and verification code are required.',
          },
          400,
        );
      }

      const { data: challenge, error: challengeError } = await admin
        .from('password_recovery_challenges')
        .select(
          `
                id,
                user_id,
                code_hash,
                expires_at,
                attempts,
                verified_at,
                used_at
              `,
        )
        .eq('id', challengeId)
        .maybeSingle();

      if (challengeError) {
        throw challengeError;
      }

      if (!challenge || challenge.used_at) {
        return jsonResponse(
          {
            error: 'This verification code is no longer valid.',
          },
          400,
        );
      }

      if (challenge.verified_at) {
        return jsonResponse(
          {
            error: 'This verification code has already been used.',
          },
          400,
        );
      }

      if (Date.now() >= new Date(challenge.expires_at).getTime()) {
        await admin
          .from('password_recovery_challenges')
          .update({
            used_at: new Date().toISOString(),
          })
          .eq('id', challengeId);

        return jsonResponse(
          {
            error: 'The verification code has expired. Generate a new code.',
          },
          400,
        );
      }

      const attempts = Number(challenge.attempts ?? 0);

      if (attempts >= MAX_OTP_ATTEMPTS) {
        return jsonResponse(
          {
            error: 'Too many incorrect attempts. Generate a new code.',
          },
          429,
        );
      }

      const submittedHash = await sha256(code);

      if (submittedHash !== challenge.code_hash) {
        const nextAttempts = attempts + 1;

        await admin
          .from('password_recovery_challenges')
          .update({
            attempts: nextAttempts,

            /*
             * Burn the challenge once
             * the maximum number of
             * attempts is reached.
             */
            used_at:
              nextAttempts >= MAX_OTP_ATTEMPTS
                ? new Date().toISOString()
                : null,
          })
          .eq('id', challengeId);

        return jsonResponse(
          {
            error:
              nextAttempts >= MAX_OTP_ATTEMPTS
                ? 'Too many incorrect attempts. Generate a new code.'
                : 'The verification code is incorrect.',
          },
          nextAttempts >= MAX_OTP_ATTEMPTS ? 429 : 400,
        );
      }

      /*
       * OTP is correct.
       *
       * Generate a separate random
       * reset token. The password
       * screen receives this token,
       * never administrative Supabase
       * credentials.
       */
      const resetToken = generateResetToken();

      const resetTokenHash = await sha256(resetToken);

      const resetTokenExpiresAt = new Date(
        Date.now() + RESET_TOKEN_DURATION_MS,
      ).toISOString();

      const { error: verificationError } = await admin
        .from('password_recovery_challenges')
        .update({
          verified_at: new Date().toISOString(),

          reset_token_hash: resetTokenHash,

          reset_token_expires_at: resetTokenExpiresAt,
        })
        .eq('id', challengeId);

      if (verificationError) {
        throw verificationError;
      }

      return jsonResponse({
        resetToken,

        resetTokenExpiresAt,
      });
    }

    /*
     * ------------------------------------------------
     * COMPLETE
     * ------------------------------------------------
     *
     * Reset token
     *   ↓
     * validate server-side
     *   ↓
     * admin password change
     *   ↓
     * challenge consumed
     */
    if (action === 'complete') {
      const resetToken = body.resetToken?.trim();

      const password = body.password ?? '';

      if (!resetToken) {
        return jsonResponse(
          {
            error: 'Password reset authorization is missing.',
          },
          400,
        );
      }

      if (password.length < 8) {
        return jsonResponse(
          {
            error: 'Password must be at least 8 characters.',
          },
          400,
        );
      }

      const resetTokenHash = await sha256(resetToken);

      const { data: challenge, error: challengeError } = await admin
        .from('password_recovery_challenges')
        .select(
          `
                id,
                user_id,
                verified_at,
                reset_token_expires_at,
                used_at
              `,
        )
        .eq('reset_token_hash', resetTokenHash)
        .maybeSingle();

      if (challengeError) {
        throw challengeError;
      }

      if (!challenge || !challenge.verified_at || challenge.used_at) {
        return jsonResponse(
          {
            error: 'Password reset authorization is invalid.',
          },
          401,
        );
      }

      if (
        !challenge.reset_token_expires_at ||
        Date.now() >= new Date(challenge.reset_token_expires_at).getTime()
      ) {
        await admin
          .from('password_recovery_challenges')
          .update({
            used_at: new Date().toISOString(),
          })
          .eq('id', challenge.id);

        return jsonResponse(
          {
            error: 'Password reset authorization has expired. Start again.',
          },
          401,
        );
      }

      /*
       * THIS is the part that fixes
       * "Auth session missing".
       *
       * updateUserById() runs with the
       * server-side admin client and
       * therefore does not require a
       * recovery session in the app.
       */
      const { error: passwordError } = await admin.auth.admin.updateUserById(
        challenge.user_id,
        {
          password,
        },
      );

      if (passwordError) {
        throw passwordError;
      }

      /*
       * Prevent the reset token from
       * ever being reused.
       */
      const { error: consumeError } = await admin
        .from('password_recovery_challenges')
        .update({
          used_at: new Date().toISOString(),

          reset_token_hash: null,
        })
        .eq('id', challenge.id);

      if (consumeError) {
        console.error(
          'Password changed but recovery challenge could not be consumed:',
          consumeError,
        );
      }

      return jsonResponse({
        success: true,
      });
    }

    return jsonResponse(
      {
        error: 'Invalid password recovery action.',
      },
      400,
    );
  } catch (error) {
    console.error('Password recovery failed:', error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to process password recovery.',
      },
      500,
    );
  }
});
