import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Command, Plus, Dot, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { routeMeta } from '../../data/routeMeta';
import { useNotificationsStore } from '../../store/notifications.store';
import { useAuthStore, initialsOf } from '../../store/auth.store';

export const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const page = routeMeta[location.pathname] ?? { breadcrumb: 'LegacyaPos', title: '' };
  const unreadCount = useNotificationsStore((state) =>
    state.items.filter((n) => !n.isRead).length
  );
  const { session, profile, signOut } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-card border-b border-line flex items-center px-6 gap-4 shrink-0">
      {/* Breadcrumb + title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[12px] text-ink-muted">
          <span>LegacyaPos</span>
          <Dot size={14} className="text-ink-faint" />
          <span>{page.breadcrumb}</span>
        </div>
        <h1
          className="text-[18px] font-bold text-ink tracking-tight leading-tight"
          style={{ fontFamily: 'Plus Jakarta Sans' }}
        >
          {page.title}
          {page.meta && (
            <span className="ml-1.5 text-[12px] font-medium text-ink-muted">{page.meta}</span>
          )}
        </h1>
      </div>

      {/* Search */}
      <div className="relative w-72 max-w-[35vw] hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          placeholder="Search orders, menu, customers…"
          className="w-full h-9 pl-9 pr-16 rounded-lg bg-app border border-transparent text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-card transition-all"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 px-1.5 h-5 rounded bg-card border border-line text-[10px] font-semibold text-ink-soft">
          <Command size={9} /> K
        </kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" icon={Plus} onClick={() => navigate('/cashier')}>
          New Order
        </Button>
        <ThemeToggle />
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-9 h-9 rounded-lg hover:bg-surface flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
        >
          <Bell size={16} strokeWidth={2.2} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger border-2 border-card" />
          )}
        </button>
        <div className="w-px h-6 bg-line mx-1" />
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            title={session?.user?.email}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center text-white font-semibold text-[12px]"
          >
            {initialsOf(profile, session)}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 z-20 rounded-xl bg-card border border-line shadow-token-lg p-1">
                <div className="px-3 py-2 border-b border-line-soft">
                  <p className="text-[12.5px] font-semibold text-ink truncate">
                    {profile?.full_name || 'Account'}
                  </p>
                  <p className="text-[11px] text-ink-muted truncate">{session?.user?.email}</p>
                  {profile?.role && (
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider font-semibold text-primary-text">
                      {profile.role}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-ink-soft hover:bg-surface hover:text-danger transition-colors"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
