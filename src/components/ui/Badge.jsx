import React from 'react';

const tones = {
  neutral: 'bg-[#F1F5F9] text-[#475569]',
  primary: 'bg-[#DCEAF5] text-[#3A6588]',
  success: 'bg-[#DCFCE7] text-[#15803D]',
  warning: 'bg-[#FEF3C7] text-[#B45309]',
  danger:  'bg-[#FEE2E2] text-[#B91C1C]',
};

const dotColors = {
  neutral: 'bg-slate-400',
  primary: 'bg-[#4A7FA7]',
  success: 'bg-[#22C55E]',
  warning: 'bg-[#F59E0B]',
  danger:  'bg-[#EF4444]',
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
