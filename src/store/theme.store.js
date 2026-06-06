import { create } from 'zustand';

const STORAGE_KEY = 'legacyapos-theme';
const VALID = ['light', 'dark', 'system'];

// First-run fallback when nothing is saved. A saved preference always wins.
const DEFAULT_PREFERENCE = 'light';

const systemPrefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const readStored = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return VALID.includes(v) ? v : DEFAULT_PREFERENCE;
  } catch {
    return DEFAULT_PREFERENCE;
  }
};

// Given a preference, return the concrete theme that should render.
export const resolveTheme = (pref) =>
  pref === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : pref;

// Apply (or remove) the `.dark` class on <html>. `animate` enables the
// short color transition; we skip it on the very first paint.
export const applyTheme = (pref, { animate = true } = {}) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const resolved = resolveTheme(pref);

  if (animate) {
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 220);
  }
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
};

export const useThemeStore = create((set, get) => ({
  // The user's stored preference: 'light' | 'dark' | 'system'
  theme: readStored(),
  // The concrete theme currently applied: 'light' | 'dark'
  resolved: resolveTheme(readStored()),

  setTheme: (pref) => {
    if (!VALID.includes(pref)) return;
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* storage unavailable — keep in-memory only */
    }
    applyTheme(pref);
    set({ theme: pref, resolved: resolveTheme(pref) });
  },

  // Cycle order used by the Topbar quick toggle: light → dark → system
  cycleTheme: () => {
    const order = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(get().theme) + 1) % order.length];
    get().setTheme(next);
  },

  // Re-resolve when the OS theme changes (only matters in 'system' mode).
  syncSystem: () => {
    const pref = get().theme;
    applyTheme(pref);
    set({ resolved: resolveTheme(pref) });
  },
}));

// Keep 'system' preference in sync with OS changes for the session's lifetime.
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useThemeStore.getState().theme === 'system') {
      useThemeStore.getState().syncSystem();
    }
  });
}
