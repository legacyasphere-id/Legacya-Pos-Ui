import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Command, Plus, Dot } from 'lucide-react';
import { Button } from '../ui/Button';
import { routeMeta } from '../../data/routeMeta';
import { useNotificationsStore } from '../../store/notifications.store';

export const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const page = routeMeta[location.pathname] ?? { breadcrumb: 'LegacyaPos', title: '' };
  const unreadCount = useNotificationsStore((state) =>
    state.items.filter((n) => !n.isRead).length
  );

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center px-6 gap-4 shrink-0">
      {/* Breadcrumb + title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[12px] text-[#94A3B8]">
          <span>LegacyaPos</span>
          <Dot size={14} className="text-[#CBD5E1]" />
          <span>{page.breadcrumb}</span>
        </div>
        <h1
          className="text-[18px] font-bold text-[#1E293B] tracking-tight leading-tight"
          style={{ fontFamily: 'Plus Jakarta Sans' }}
        >
          {page.title}
          {page.meta && (
            <span className="ml-1.5 text-[12px] font-medium text-[#94A3B8]">{page.meta}</span>
          )}
        </h1>
      </div>

      {/* Search */}
      <div className="relative w-72 max-w-[35vw] hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search orders, menu, customers…"
          className="w-full h-9 pl-9 pr-16 rounded-lg bg-[#F6F9FC] border border-transparent text-[13px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4A7FA7] focus:bg-white transition-all"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 px-1.5 h-5 rounded bg-white border border-[#E2E8F0] text-[10px] font-semibold text-[#64748B]">
          <Command size={9} /> K
        </kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" icon={Plus} onClick={() => navigate('/cashier')}>
          New Order
        </Button>
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-9 h-9 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:text-[#1E293B] transition-colors"
        >
          <Bell size={16} strokeWidth={2.2} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] border-2 border-white" />
          )}
        </button>
        <div className="w-px h-6 bg-[#E2E8F0] mx-1" />
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center text-white font-semibold text-[12px]">
          AR
        </div>
      </div>
    </header>
  );
};
