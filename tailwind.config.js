/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./artifacts/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces & structure
        app:            'var(--c-app)',
        sidebar:        'var(--c-sidebar)',
        card:           'var(--c-card)',
        surface:        'var(--c-surface)',
        'surface-2':    'var(--c-surface-2)',
        'surface-3':    'var(--c-surface-3)',
        tooltip:        'var(--c-tooltip)',
        track:          'var(--c-track)',

        // Lines
        line:           'var(--c-line)',
        'line-soft':    'var(--c-line-soft)',

        // Ink / text
        ink:            'var(--c-ink)',
        'ink-soft':     'var(--c-ink-soft)',
        'ink-muted':    'var(--c-ink-muted)',
        'ink-strong':   'var(--c-ink-strong)',
        'ink-faint':    'var(--c-ink-faint)',

        // Primary (brand)
        primary:             'var(--c-primary)',
        'primary-deep':      'var(--c-primary-deep)',
        'primary-text':      'var(--c-primary-text)',
        'primary-soft':      'var(--c-primary-soft)',
        'primary-soft-deep': 'var(--c-primary-soft-deep)',
        'primary-light':     'var(--c-primary-light)',

        // Success
        success:          'var(--c-success)',
        'success-deep':   'var(--c-success-deep)',
        'success-text':   'var(--c-success-text)',
        'success-soft':   'var(--c-success-soft)',
        'success-border': 'var(--c-success-border)',
        'success-faint':  'var(--c-success-faint)',

        // Warning
        warning:          'var(--c-warning)',
        'warning-text':   'var(--c-warning-text)',
        'warning-soft':   'var(--c-warning-soft)',
        'warning-faint':  'var(--c-warning-faint)',
        'warning-border': 'var(--c-warning-border)',
        'warning-accent': 'var(--c-warning-accent)',

        // Danger
        danger:          'var(--c-danger)',
        'danger-deep':   'var(--c-danger-deep)',
        'danger-text':   'var(--c-danger-text)',
        'danger-soft':   'var(--c-danger-soft)',
        'danger-faint':  'var(--c-danger-faint)',
        'danger-border': 'var(--c-danger-border)',
        'danger-accent': 'var(--c-danger-accent)',
      },
      boxShadow: {
        'token-sm': 'var(--shadow-sm)',
        'token-md': 'var(--shadow-md)',
        'token-lg': 'var(--shadow-lg)',
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
