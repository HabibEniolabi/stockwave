// @ts-nocheck

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  try {
    if (Deno.env.get('DEV_PASSWORD_RECOVERY_ENABLED') !== 'true') {
      return new Response(
        JSON.stringify({
          error: 'Development password recovery is disabled.',
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const { email } = await request.json();

    const normalizedEmail = String(email ?? '')
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      return new Response(
        JSON.stringify({
          error: 'Email address is required.',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    /*
     * IMPORTANT:
     * Only allow explicit development
     * accounts to use this bypass.
     */
    const allowedEmails = (Deno.env.get('DEV_PASSWORD_RECOVERY_EMAILS') ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedEmails.includes(normalizedEmail)) {
      return new Response(
        JSON.stringify({
          error:
            'This account is not enabled for development password recovery.',
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    /*
     * Supabase generates the actual
     * recovery OTP here.
     *
     * No email is sent.
     */
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
    });

    if (error) {
      throw error;
    }

    const code = data.properties?.email_otp;

    if (!code) {
      throw new Error('Supabase did not generate a recovery OTP.');
    }

    return new Response(
      JSON.stringify({
        code,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('DEV PASSWORD RECOVERY ERROR:', error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to start development password recovery.',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
