import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Logo } from './Logo';
import { navGroups } from '../../data/navGroups';
import { useUiStore } from '../../store/ui.store';
import { useNotificationsStore } from '../../store/notifications.store';
import { useAuthStore, initialsOf } from '../../store/auth.store';
import { tokens } from '../../data/tokens';

export const Sidebar = () => {
  const { sidebarCollapsed: collapsed, toggleSidebar } = useUiStore();
  const location = useLocation();
  const unreadCount = useNotificationsStore((state) =>
    state.items.filter((n) => !n.isRead).length
  );
  const { session, profile } = useAuthStore();

  return (
    <aside
      className="relative bg-sidebar border-r border-line flex flex-col transition-all duration-200 ease-out shrink-0"
      style={{ width: collapsed ? 76 : 248 }}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-line-soft">
        <Logo collapsed={collapsed} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const badge = item.id === 'notifications' ? unreadCount : item.badge;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-primary-soft text-primary-text'
                        : 'text-ink-soft hover:bg-surface hover:text-ink'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary" />
                    )}
                    <Icon size={18} strokeWidth={isActive ? 2.4 : 2} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {badge > 0 && (
                          <span className="px-1.5 h-[18px] min-w-[18px] inline-flex items-center justify-center rounded-md bg-primary text-white text-[10px] font-bold tabular-nums">
                            {badge}
                          </span>
                        )}
                        {item.alert && (
                          <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                        )}
                      </>
                    )}
                    {collapsed && (badge > 0 || item.alert) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger border-2 border-sidebar" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile chip */}
      <div className="p-3 border-t border-line-soft">
        <div
          className={`flex items-center gap-2.5 rounded-xl p-2 hover:bg-surface-2 transition-colors cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center text-white font-semibold text-[13px] shrink-0">
            {initialsOf(profile, session)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-ink truncate">
                {profile?.full_name || session?.user?.email || 'Account'}
              </p>
              <p className="text-[11px] text-ink-muted truncate capitalize">
                {profile?.role || 'Member'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[58px] w-6 h-6 rounded-full bg-card border border-line flex items-center justify-center hover:border-primary hover:text-primary text-ink-soft transition-colors z-10"
        style={{ boxShadow: tokens.shadow.sm }}
      >
        {collapsed
          ? <ChevronsRight size={12} strokeWidth={2.5} />
          : <ChevronsLeft size={12} strokeWidth={2.5} />}
      </button>
    </aside>
  );
};
