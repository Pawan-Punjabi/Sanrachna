import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
}

/**
 * Creates a Supabase client for a specific request.
 * If an access token is provided, RLS policies apply using auth.uid().
 * Without a token, only public (anon) policies apply.
 */
export function getSupabaseClient(accessToken?: string): SupabaseClient {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {},
    auth: { persistSession: false },
  });
}

/** Anon client for non-auth operations (e.g. checking server health) */
export const supabase = getSupabaseClient();
