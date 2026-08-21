const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if(!supabaseUrl){
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL is not configured'
  ) 
}

if(!supabasePublishableKey){
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured'
  ) 
}

export const env = {
  supabaseUrl,
  supabasePublishableKey
} as const;