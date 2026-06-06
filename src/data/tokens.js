// Design tokens — values resolve through CSS variables defined in
// src/index.css (:root for light, .dark for dark). Consumers that use
// inline styles (shadows, dynamic colors) automatically follow the theme.
export const tokens = {
  color: {
    primary:     'var(--c-primary)',
    primarySoft: 'var(--c-primary-soft)',
    primaryDeep: 'var(--c-primary-deep)',
    bg:          'var(--c-app)',
    card:        'var(--c-card)',
    textMain:    'var(--c-ink)',
    textSoft:    'var(--c-ink-soft)',
    textMuted:   'var(--c-ink-muted)',
    border:      'var(--c-line)',
    borderSoft:  'var(--c-line-soft)',
    success:     'var(--c-success)',
    successSoft: 'var(--c-success-soft)',
    warning:     'var(--c-warning)',
    warningSoft: 'var(--c-warning-soft)',
    danger:      'var(--c-danger)',
    dangerSoft:  'var(--c-danger-soft)',
  },
  radius: { sm: '8px', md: '12px', lg: '16px', xl: '20px' },
  shadow: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  },
};
