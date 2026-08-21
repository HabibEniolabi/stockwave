import {
  AppState,
  Platform,
} from 'react-native';

import AsyncStorage from
  '@react-native-async-storage/async-storage';

import {
  createClient,
  processLock,
} from '@supabase/supabase-js';

import 'react-native-url-polyfill/auto';

import { env } from '../config/env';

export const supabase = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey,
  {
    auth: {
      ...(Platform.OS !== 'web'
        ? {
            storage: AsyncStorage,
          }
        : {}),

      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  },
);

/**
 * Keeps Supabase auth tokens refreshed
 * while the application is active.
 *
 * This should only be registered once
 * at the application root.
 */
export function registerSupabaseAuthLifecycle() {
  if (Platform.OS === 'web') {
    return;
  }

  if (AppState.currentState === 'active') {
    supabase.auth.startAutoRefresh();
  }

  const subscription =
    AppState.addEventListener(
      'change',
      state => {
        if (state === 'active') {
          supabase.auth.startAutoRefresh();
          return;
        }

        supabase.auth.stopAutoRefresh();
      },
    );

  return () => {
    subscription.remove();

    supabase.auth.stopAutoRefresh();
  };
}