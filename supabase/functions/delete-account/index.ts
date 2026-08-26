import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request: Request) => {
  /*
   * Required for web clients.
   * React Native itself normally won't
   * send this preflight request.
   */
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed.',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  try {
    const authorization = request.headers.get('Authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required.',
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase server environment variables.');

      return new Response(
        JSON.stringify({
          error: 'Server configuration is incomplete.',
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

    /*
     * This client exists ONLY inside
     * the Edge Function.
     *
     * Never place the service-role key
     * inside the React Native app.
     */
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,

        persistSession: false,
      },
    });

    const accessToken = authorization.slice('Bearer '.length);

    /*
     * Verify the token and retrieve the
     * actual authenticated user.
     *
     * Never accept userId from the
     * request body for account deletion.
     */
    const {
      data: { user },
      error: authenticationError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authenticationError || !user) {
      console.error('DELETE ACCOUNT AUTH ERROR', authenticationError);

      return new Response(
        JSON.stringify({
          error: 'Invalid or expired authentication session.',
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    /*
     * Hard delete.
     *
     * Your tables that reference
     * auth.users with ON DELETE CASCADE
     * will be cleaned automatically.
     */
    const { error: deletionError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id,
      false,
    );

    if (deletionError) {
      console.error('DELETE USER ERROR', deletionError);

      throw deletionError;
    }

    return new Response(
      JSON.stringify({
        success: true,
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
    console.error('DELETE ACCOUNT ERROR', error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Unable to delete account.',
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
