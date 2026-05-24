import React from 'react';

const sizes = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
  xl: 'h-14 px-6 text-base gap-2.5',
};

const variants = {
  primary:   'bg-[#4A7FA7] text-white hover:bg-[#3A6588] shadow-sm',
  secondary: 'bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-[#F6F9FC]',
  ghost:     'bg-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]',
  soft:      'bg-[#DCEAF5] text-[#3A6588] hover:bg-[#C9DEF0]',
  danger:    'bg-[#EF4444] text-white hover:bg-[#DC2626]',
  success:   'bg-[#22C55E] text-white hover:bg-[#16A34A] shadow-sm',
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
