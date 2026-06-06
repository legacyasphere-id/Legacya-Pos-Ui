import React from 'react';

export const Textarea = ({ label, hint, rows = 3, ...rest }) => (
  <div>
    {label && (
      <label className="block text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
        {label}
      </label>
    )}
    <textarea
      {...rest}
      rows={rows}
      className="w-full p-3 rounded-lg bg-card border border-line text-[13.5px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition-all resize-none"
    />
    {hint && <p className="mt-1 text-[11.5px] text-ink-muted">{hint}</p>}
  </div>
);
