import React from 'react';

export const Input = ({ label, hint, prefix, suffix, ...rest }) => (
  <div>
    {label && (
      <label className="block text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
        {label}
      </label>
    )}
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-[13px] font-medium">
          {prefix}
        </span>
      )}
      <input
        {...rest}
        className={`w-full h-10 ${prefix ? 'pl-9' : 'pl-3.5'} ${suffix ? 'pr-12' : 'pr-3.5'} rounded-lg bg-card border border-line text-[13.5px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition-all`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted text-[12px] font-medium">
          {suffix}
        </span>
      )}
    </div>
    {hint && <p className="mt-1 text-[11.5px] text-ink-muted">{hint}</p>}
  </div>
);
