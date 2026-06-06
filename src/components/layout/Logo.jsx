import React from 'react';

export const Logo = ({ collapsed }) => (
  <div className="flex items-center gap-2.5">
    <div
      className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center shrink-0"
      style={{ boxShadow: '0 4px 12px -2px rgb(74 127 167 / 0.35)' }}
    >
      <div className="absolute inset-0.5 rounded-[10px] border border-card/15" />
      <span className="text-white font-bold text-[15px]" style={{ fontFamily: 'Plus Jakarta Sans' }}>L</span>
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success border-2 border-card" />
    </div>
    {!collapsed && (
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-bold tracking-tight text-ink" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Legacya<span className="text-primary">Pos</span>
        </span>
        <span className="text-[10px] text-ink-muted mt-0.5 tracking-wider font-medium uppercase">
          Restaurant OS
        </span>
      </div>
    )}
  </div>
);
