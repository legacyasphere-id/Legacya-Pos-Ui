import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../store/theme.store';

const meta = {
  light:  { Icon: Sun,     label: 'Light',  next: 'Dark' },
  dark:   { Icon: Moon,    label: 'Dark',   next: 'System' },
  system: { Icon: Monitor, label: 'System', next: 'Light' },
};

// Compact quick toggle that cycles Light → Dark → System.
export const ThemeToggle = () => {
  const theme = useThemeStore((s) => s.theme);
  const cycleTheme = useThemeStore((s) => s.cycleTheme);
  const { Icon, label, next } = meta[theme] ?? meta.light;

  return (
    <button
      onClick={cycleTheme}
      title={`Theme: ${label} · click for ${next}`}
      aria-label={`Theme: ${label}. Switch to ${next}.`}
      className="relative w-9 h-9 rounded-lg hover:bg-surface flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
    >
      <Icon size={16} strokeWidth={2.2} />
    </button>
  );
};
