import React from 'react';

const sizes = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
  xl: 'h-14 px-6 text-base gap-2.5',
};

const variants = {
  primary:   'bg-primary text-white hover:bg-primary-deep shadow-sm',
  secondary: 'bg-card text-ink border border-line hover:bg-app',
  ghost:     'bg-transparent text-ink-soft hover:bg-surface hover:text-ink',
  soft:      'bg-primary-soft text-primary-text hover:bg-primary-soft-deep',
  danger:    'bg-danger text-white hover:bg-danger-deep',
  success:   'bg-success text-white hover:bg-success-deep shadow-sm',
};

export const Button = ({ variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, children, className = '', ...rest }) => {
  const iconSize = size === 'sm' ? 14 : size === 'xl' ? 20 : 16;
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={iconSize} strokeWidth={2.2} />}
      {children}
      {IconRight && <IconRight size={iconSize} strokeWidth={2.2} />}
    </button>
  );
};
