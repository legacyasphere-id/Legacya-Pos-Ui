import { createClient } from '@supabase/supabase-js';

// Frontend Supabase client. Reads the project URL + anon (publishable) key from
// Vite env vars (see .env.example). RLS is what protects the data — the anon
// key is public by design.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Guarded so the app still boots before env is wired (pages currently use mock
// data). Accessing the client without configuration throws a clear error.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : new Proxy(
      {},
      {
        get() {
          throw new Error(
            'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).',
          );
        },
      },
    );
