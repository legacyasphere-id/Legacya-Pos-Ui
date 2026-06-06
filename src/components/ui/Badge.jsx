import React from 'react';

const tones = {
  neutral: 'bg-surface text-ink-strong',
  primary: 'bg-primary-soft text-primary-text',
  success: 'bg-success-soft text-success-text',
  warning: 'bg-warning-soft text-warning-text',
  danger:  'bg-danger-soft text-danger-text',
};

const dotColors = {
  neutral: 'bg-ink-muted',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
};

const sizes = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-[11px]',
  lg: 'px-2.5 py-1 text-[12px]',
};

export const Badge = ({ tone = 'neutral', children, dot = false, size = 'md', className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-md font-semibold ${tones[tone]} ${sizes[size]} ${className}`}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[tone]}`} />}
    {children}
  </span>
);
