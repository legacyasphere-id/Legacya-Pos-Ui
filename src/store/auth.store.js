import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Auth + current-user profile (role) state, backed by Supabase Auth.
export const useAuthStore = create((set, get) => ({
  session: null,
  profile: null,        // row from public.profiles (includes role)
  loading: true,
  configured: isSupabaseConfigured,

  init: async () => {
    if (!isSupabaseConfigured) {
      set({ loading: false });
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    set({ session });
    if (session) await get().loadProfile();
    set({ loading: false });

    supabase.auth.onAuthStateChange((_event, newSession) => {
      set({ session: newSession });
      if (newSession) get().loadProfile();
      else set({ profile: null });
    });
  },

  loadProfile: async () => {
    const uid = get().session?.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url')
      .eq('id', uid)
      .maybeSingle();
    set({ profile: data ?? null });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signOut: async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));

// Derive initials for the avatar chip from the profile/email.
export const initialsOf = (profile, session) => {
  const name = profile?.full_name || session?.user?.email || '';
  const parts = name.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
};
