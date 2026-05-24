import React from 'react';

const sizeDefs = {
  sm: { w: 'w-8',  h: 'h-[18px]', dot: 'w-3.5 h-3.5',      shift: 'translate-x-[14px]' },
  md: { w: 'w-10', h: 'h-[22px]', dot: 'w-[18px] h-[18px]', shift: 'translate-x-[18px]' },
};

export const Switch = ({ checked, onChange, size = 'md' }) => {
  const s = sizeDefs[size];
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`${s.w} ${s.h} relative rounded-full transition-colors duration-200 ${checked ? 'bg-[#22C55E]' : 'bg-[#CBD5E1]'}`}
    >
      <span className={`absolute top-0.5 left-0.5 ${s.dot} rounded-full bg-white shadow transition-transform duration-200 ${checked ? s.shift : ''}`} />
    </button>
  );
};
