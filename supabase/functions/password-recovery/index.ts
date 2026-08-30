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

type RequestBody = {
  action?: 'start' | 'verify' | 'complete';

  email?: string;

  challengeToken?: string;
  code?: string;

  resetToken?: string;
  password?: string;
};

type ChallengePayload = {
  type: 'challenge';
  userId: string;
  codeHash: string;
  expiresAt: number;
};

type ResetPayload = {
  type: 'reset';
  userId: string;
  expiresAt: number;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,

    headers: {
      ...corsHeaders,

      'Content-Type': 'application/json',
    },
  });
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const generateOtp = () => {
  const values = new Uint32Array(1);

  crypto.getRandomValues(values);

  return (100000 + (values[0] % 900000)).toString();
};

const sha256 = async (value: string) => {
  const encoded = new TextEncoder().encode(value);

  const digest = await crypto.subtle.digest('SHA-256', encoded);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
};

const toBase64Url = (bytes: Uint8Array) => {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');

  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  const binary = atob(padded);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const createSignature = async (payload: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',

    new TextEncoder().encode(secret),

    {
      name: 'HMAC',

      hash: 'SHA-256',
    },

    false,

    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',

    key,

    new TextEncoder().encode(payload),
  );

  return toBase64Url(new Uint8Array(signature));
};

const createToken = async (
  payload: ChallengePayload | ResetPayload,

  secret: string,
) => {
  const encodedPayload = toBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );

  const signature = await createSignature(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
};

const verifyToken = async <T extends ChallengePayload | ResetPayload>(
  token: string,
  secret: string,
): Promise<T | null> => {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await createSignature(encodedPayload, secret);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const json = new TextDecoder().decode(fromBase64Url(encodedPayload));

    return JSON.parse(json) as T;
  } catch {
    return null;
  }
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
    return jsonResponse(
      {
        error: 'Password recovery service is not configured.',
      },
      500,
    );
  }

  /*
   * We derive the signing secret
   * from the server-only service
   * role key.
   *
   * Nothing secret is sent to the app.
   */
  const signingSecret = await sha256(
    `stockwave-password-recovery:${serviceRoleKey}`,
  );

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,

      persistSession: false,

      detectSessionInUrl: false,
    },
  });

  try {
    const body = (await request.json()) as RequestBody;

    /*
     * ==========================
     * START
     * ==========================
     */
    if (body.action === 'start') {
      const email = normalizeEmail(body.email ?? '');

      if (!email) {
        return jsonResponse(
          {
            error: 'Email address is required.',
          },
          400,
        );
      }

      let userId: string | null = null;

      let page = 1;

      const perPage = 1000;

      while (!userId) {
        const { data, error } = await admin.auth.admin.listUsers({
          page,
          perPage,
        });

        if (error) {
          console.error('LIST USERS ERROR:', error);

          throw error;
        }

        const user = data.users.find(
          (item) => item.email?.trim().toLowerCase() === email,
        );

        if (user) {
          userId = user.id;

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

      const code = generateOtp();

      const codeHash = await sha256(code);

      const expiresAt = Date.now() + OTP_DURATION_MS;

      const challengeToken = await createToken(
        {
          type: 'challenge',

          userId,

          codeHash,

          expiresAt,
        },

        signingSecret,
      );

      return jsonResponse({
        code,

        challengeToken,

        expiresAt: new Date(expiresAt).toISOString(),
      });
    }

    /*
     * ==========================
     * VERIFY
     * ==========================
     */
    if (body.action === 'verify') {
      const challengeToken = body.challengeToken?.trim();

      const code = body.code?.trim();

      if (!challengeToken || !code) {
        return jsonResponse(
          {
            error: 'Verification code is required.',
          },
          400,
        );
      }

      const challenge = await verifyToken<ChallengePayload>(
        challengeToken,
        signingSecret,
      );

      if (!challenge || challenge.type !== 'challenge') {
        return jsonResponse(
          {
            error: 'Password recovery challenge is invalid.',
          },
          401,
        );
      }

      if (Date.now() >= challenge.expiresAt) {
        return jsonResponse(
          {
            error: 'The verification code has expired. Generate a new code.',
          },
          400,
        );
      }

      const submittedHash = await sha256(code);

      if (submittedHash !== challenge.codeHash) {
        return jsonResponse(
          {
            error: 'The verification code is incorrect.',
          },
          400,
        );
      }

      const resetExpiresAt = Date.now() + RESET_TOKEN_DURATION_MS;

      const resetToken = await createToken(
        {
          type: 'reset',

          userId: challenge.userId,

          expiresAt: resetExpiresAt,
        },

        signingSecret,
      );

      return jsonResponse({
        resetToken,

        resetTokenExpiresAt: new Date(resetExpiresAt).toISOString(),
      });
    }

    /*
     * ==========================
     * COMPLETE
     * ==========================
     */
    if (body.action === 'complete') {
      const resetToken = body.resetToken?.trim();

      const password = body.password ?? '';

      if (!resetToken) {
        return jsonResponse(
          {
            error: 'Password reset authorization is missing.',
          },
          401,
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

      const resetPayload = await verifyToken<ResetPayload>(
        resetToken,
        signingSecret,
      );

      if (!resetPayload || resetPayload.type !== 'reset') {
        return jsonResponse(
          {
            error: 'Password reset authorization is invalid.',
          },
          401,
        );
      }

      if (Date.now() >= resetPayload.expiresAt) {
        return jsonResponse(
          {
            error: 'Password reset authorization has expired. Start again.',
          },
          401,
        );
      }

      const { error } = await admin.auth.admin.updateUserById(
        resetPayload.userId,
        {
          password,
        },
      );

      if (error) {
        console.error('PASSWORD UPDATE ERROR:', error);

        throw error;
      }

      return jsonResponse({
        success: true,
      });
    }

    return jsonResponse(
      {
        error: 'Invalid recovery action.',
      },
      400,
    );
  } catch (error) {
    console.error('PASSWORD RECOVERY ERROR:', error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
