import React from 'react';

export const Textarea = ({ label, hint, rows = 3, ...rest }) => (
  <div>
    {label && (
      <label className="block text-[11.5px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
        {label}
      </label>
    )}
    <textarea
      {...rest}
      rows={rows}
      className="w-full p-3 rounded-lg bg-white border border-[#E2E8F0] text-[13.5px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4A7FA7] focus:ring-2 focus:ring-[#DCEAF5] transition-all resize-none"
    />
    {hint && <p className="mt-1 text-[11.5px] text-[#94A3B8]">{hint}</p>}
  </div>
);
