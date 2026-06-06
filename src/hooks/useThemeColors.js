import { useEffect, useState } from 'react';
import { useThemeStore } from '../store/theme.store';

// Charts (Recharts/SVG) take colors as JS string props and can't use Tailwind
// classes. This hook resolves the relevant design tokens from CSS variables
// and re-resolves whenever the active theme changes.
const readVar = (name, fallback) => {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
};

const resolveColors = () => ({
  primary:      readVar('--c-primary', '#4A7FA7'),
  primarySoft:  readVar('--c-primary-soft', '#DCEAF5'),
  primaryDeep:  readVar('--c-primary-deep', '#3A6588'),
  success:      readVar('--c-success', '#22C55E'),
  warning:      readVar('--c-warning', '#F59E0B'),
  danger:       readVar('--c-danger', '#EF4444'),
  grid:         readVar('--c-chart-grid', '#F1F5F9'),
  axis:         readVar('--c-chart-axis', '#94A3B8'),
  compare:      readVar('--c-chart-compare', '#CBD5E1'),
  card:         readVar('--c-card', '#FFFFFF'),
  app:          readVar('--c-app', '#F6F9FC'),
  ink:          readVar('--c-ink', '#1E293B'),
  inkSoft:      readVar('--c-ink-soft', '#64748B'),
  line:         readVar('--c-line', '#E2E8F0'),
  surface:      readVar('--c-surface', '#F1F5F9'),
  // Categorical blue ramp for donut / payment-mix series.
  blues: [
    readVar('--c-chart-b0', '#4A7FA7'),
    readVar('--c-chart-b1', '#7AA9CC'),
    readVar('--c-chart-b2', '#A8C7DD'),
    readVar('--c-chart-b3', '#DCEAF5'),
  ],
});

export function useThemeColors() {
  const resolved = useThemeStore((s) => s.resolved);
  const [colors, setColors] = useState(resolveColors);

  useEffect(() => {
    // Run after the .dark class has been applied for this resolved theme.
    setColors(resolveColors());
  }, [resolved]);

  return colors;
}
