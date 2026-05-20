import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, ShoppingCart, ReceiptText, ChefHat,
  Package, UtensilsCrossed, BarChart3, Bell, Settings,
  Search, ChevronsLeft, ChevronsRight, Sparkles,
  TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight,
  Plus, Command, CircleUserRound, Dot, Check
} from 'lucide-react';

/* =========================================================================
   LEGACYAPOS — PHASE 1
   Design System + Layout Shell
   -------------------------------------------------------------------------
   This file is the foundation for all subsequent phases.
   Architecture is router-ready (Zustand + React Router) but uses local
   state here to remain a self-contained artifact preview.
   ========================================================================= */

/* -------------------------------------------------------------------------
   DESIGN TOKENS
   ------------------------------------------------------------------------- */
const tokens = {
  color: {
    primary:     '#4A7FA7',
    primarySoft: '#DCEAF5',
    primaryDeep: '#3A6588',
    bg:          '#F6F9FC',
    card:        '#FFFFFF',
    textMain:    '#1E293B',
    textSoft:    '#64748B',
    textMuted:   '#94A3B8',
    border:      '#E2E8F0',
    borderSoft:  '#EEF2F7',
    success:     '#22C55E',
    successSoft: '#DCFCE7',
    warning:     '#F59E0B',
    warningSoft: '#FEF3C7',
    danger:      '#EF4444',
    dangerSoft:  '#FEE2E2',
  },
  radius:  { sm: '8px', md: '12px', lg: '16px', xl: '20px' },
  shadow:  {
    sm: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
    md: '0 4px 12px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
    lg: '0 12px 32px -8px rgb(15 23 42 / 0.10), 0 4px 8px -4px rgb(15 23 42 / 0.05)',
  },
};

/* -------------------------------------------------------------------------
   MOCK DATA — shapes match the brief, reusable across phases
   ------------------------------------------------------------------------- */
const mockOrders = [
  { id: 'ORD-1042', tableNumber: 7,  status: 'cooking', items: [{ menuId: 'm01', name: 'Chicken Mentai Bowl', qty: 2, price: 58000 }], total: 116000, createdAt: '2026-05-20T11:42:00', paymentMethod: 'qris' },
  { id: 'ORD-1041', tableNumber: 3,  status: 'pending', items: [{ menuId: 'm04', name: 'Beef Yakiniku', qty: 1, price: 72000 }], total: 72000,  createdAt: '2026-05-20T11:38:00', paymentMethod: 'cash' },
  { id: 'ORD-1040', tableNumber: 12, status: 'done',    items: [{ menuId: 'm02', name: 'Salmon Aburi', qty: 3, price: 85000 }], total: 255000, createdAt: '2026-05-20T11:30:00', paymentMethod: 'card' },
];

const mockInsights = [
  { id: 1, category: 'Sales',     headline: 'Chicken Mentai Bowl trending up 34% this week.', detail: '127 sold vs 95 last week',         confidence: 'high',  trend: 'up'   },
  { id: 2, category: 'Traffic',   headline: 'Peak hours 7PM–9PM. Staff up +2 crew recommended.', detail: 'Avg 18 orders / hour at peak',    confidence: 'med',   trend: 'up'   },
  { id: 3, category: 'Inventory', headline: 'Burger bun may deplete in ~2 days at current rate.', detail: 'Stock 48 units · 24/day burn',  confidence: 'high',  trend: 'down' },
];

const mockNotifications = [
  { id: 1, type: 'alert',   message: 'Burger bun stock critical (8 units left)',   timestamp: '2m ago',  isRead: false },
  { id: 2, type: 'success', message: 'Daily target reached: Rp 4.2M',               timestamp: '1h ago',  isRead: false },
  { id: 3, type: 'info',    message: 'Weekly report ready for review',              timestamp: '3h ago',  isRead: true  },
];

/* -------------------------------------------------------------------------
   NAVIGATION
   ------------------------------------------------------------------------- */
const navGroups = [
  {
    label: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard, path: '/' },
      { id: 'pos',       label: 'POS Cashier',     icon: ShoppingCart,    path: '/pos' },
      { id: 'orders',    label: 'Orders',          icon: ReceiptText,     path: '/orders',    badge: 3 },
      { id: 'kitchen',   label: 'Kitchen Display', icon: ChefHat,         path: '/kitchen' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { id: 'inventory', label: 'Inventory',       icon: Package,         path: '/inventory', alert: true },
      { id: 'menu',      label: 'Menu',            icon: UtensilsCrossed, path: '/menu' },
      { id: 'analytics', label: 'Analytics',       icon: BarChart3,       path: '/analytics' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell,     path: '/notifications', badge: 2 },
      { id: 'settings',      label: 'Settings',      icon: Settings, path: '/settings' },
    ],
  },
];

/* -------------------------------------------------------------------------
   BASE COMPONENTS
   ------------------------------------------------------------------------- */

const Button = ({ variant = 'primary', size = 'md', icon: Icon, children, className = '', ...rest }) => {
  const sizes = {
    sm: 'h-8 px-3 text-[13px] gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-5 text-[15px] gap-2',
  };
  const variants = {
    primary:   'bg-[#4A7FA7] text-white hover:bg-[#3A6588] shadow-sm',
    secondary: 'bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-[#F6F9FC]',
    ghost:     'bg-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]',
    soft:      'bg-[#DCEAF5] text-[#3A6588] hover:bg-[#C9DEF0]',
    danger:    'bg-[#EF4444] text-white hover:bg-[#DC2626]',
  };
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 active:scale-[0.98] ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.2} />}
      {children}
    </button>
  );
};

const Badge = ({ tone = 'neutral', children, dot = false }) => {
  const tones = {
    neutral: 'bg-[#F1F5F9] text-[#475569]',
    primary: 'bg-[#DCEAF5] text-[#3A6588]',
    success: 'bg-[#DCFCE7] text-[#15803D]',
    warning: 'bg-[#FEF3C7] text-[#B45309]',
    danger:  'bg-[#FEE2E2] text-[#B91C1C]',
  };
  const dotColors = {
    neutral: 'bg-slate-400', primary: 'bg-[#4A7FA7]',
    success: 'bg-[#22C55E]', warning: 'bg-[#F59E0B]', danger: 'bg-[#EF4444]',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${tones[tone]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[tone]}`} />}
      {children}
    </span>
  );
};

const Card = ({ children, className = '', as: As = 'div', ...rest }) => (
  <As
    {...rest}
    className={`bg-white border border-[#E2E8F0] rounded-2xl ${className}`}
    style={{ boxShadow: tokens.shadow.sm }}
  >
    {children}
  </As>
);

const StatCard = ({ label, value, delta, deltaTone = 'success', helper }) => (
  <Card className="p-5">
    <div className="flex items-center justify-between">
      <p className="text-[12px] font-medium text-[#64748B] uppercase tracking-wider">{label}</p>
      {delta && (
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
          deltaTone === 'success' ? 'text-[#15803D]' : 'text-[#B91C1C]'
        }`}>
          {deltaTone === 'success' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {delta}
        </span>
      )}
    </div>
    <p className="mt-3 text-[28px] font-bold text-[#1E293B] tabular-nums tracking-tight leading-none">
      {value}
    </p>
    {helper && <p className="mt-1.5 text-[12px] text-[#94A3B8]">{helper}</p>}
  </Card>
);

const InsightCard = ({ insight }) => {
  const categoryStyles = {
    Sales:     { tone: 'primary', icon: TrendingUp },
    Traffic:   { tone: 'warning', icon: ArrowUpRight },
    Inventory: { tone: 'danger',  icon: AlertTriangle },
  };
  const meta = categoryStyles[insight.category];
  const Icon = meta.icon;
  return (
    <div className="flex gap-3 p-4 rounded-xl hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer group">
      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
        meta.tone === 'primary' ? 'bg-[#DCEAF5] text-[#3A6588]' :
        meta.tone === 'warning' ? 'bg-[#FEF3C7] text-[#B45309]' :
        'bg-[#FEE2E2] text-[#B91C1C]'
      }`}>
        <Icon size={16} strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone={meta.tone}>{insight.category}</Badge>
          <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-medium">
            {insight.confidence === 'high' ? 'High confidence' : 'Medium confidence'}
          </span>
        </div>
        <p className="text-[13.5px] font-semibold text-[#1E293B] leading-snug">{insight.headline}</p>
        <p className="text-[12.5px] text-[#64748B] mt-0.5 tabular-nums">{insight.detail}</p>
      </div>
      <ArrowUpRight size={16} className="text-[#CBD5E1] group-hover:text-[#4A7FA7] transition-colors shrink-0 mt-1" />
    </div>
  );
};

/* -------------------------------------------------------------------------
   LOGO MARK
   ------------------------------------------------------------------------- */
const Logo = ({ collapsed }) => (
  <div className="flex items-center gap-2.5">
    <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center shrink-0"
         style={{ boxShadow: '0 4px 12px -2px rgb(74 127 167 / 0.35)' }}>
      <div className="absolute inset-0.5 rounded-[10px] border border-white/15" />
      <span className="text-white font-bold text-[15px]" style={{ fontFamily: 'Plus Jakarta Sans' }}>L</span>
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#22C55E] border-2 border-white" />
    </div>
    {!collapsed && (
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-bold tracking-tight text-[#1E293B]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Legacya<span className="text-[#4A7FA7]">Pos</span>
        </span>
        <span className="text-[10px] text-[#94A3B8] mt-0.5 tracking-wider font-medium uppercase">Restaurant OS</span>
      </div>
    )}
  </div>
);

/* -------------------------------------------------------------------------
   SIDEBAR
   ------------------------------------------------------------------------- */
const Sidebar = ({ activePage, setActivePage, collapsed, setCollapsed }) => (
  <aside
    className="relative bg-white border-r border-[#E2E8F0] flex flex-col transition-all duration-200 ease-out shrink-0"
    style={{ width: collapsed ? 76 : 248 }}
  >
    {/* Brand */}
    <div className="h-16 flex items-center px-4 border-b border-[#EEF2F7]">
      <Logo collapsed={collapsed} />
    </div>

    {/* Nav */}
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {navGroups.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#DCEAF5] text-[#3A6588]'
                      : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[#4A7FA7]" />
                  )}
                  <Icon size={18} strokeWidth={isActive ? 2.4 : 2} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 h-[18px] min-w-[18px] inline-flex items-center justify-center rounded-md bg-[#4A7FA7] text-white text-[10px] font-bold tabular-nums">
                          {item.badge}
                        </span>
                      )}
                      {item.alert && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                      )}
                    </>
                  )}
                  {collapsed && (item.badge || item.alert) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] border-2 border-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>

    {/* Profile chip */}
    <div className="p-3 border-t border-[#EEF2F7]">
      <div className={`flex items-center gap-2.5 rounded-xl p-2 hover:bg-[#F8FAFC] transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center text-white font-semibold text-[13px] shrink-0">
          AR
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#1E293B] truncate">Arif Rahman</p>
            <p className="text-[11px] text-[#94A3B8] truncate">Owner · Cabang Kemang</p>
          </div>
        )}
      </div>
    </div>

    {/* Collapse toggle */}
    <button
      onClick={() => setCollapsed(!collapsed)}
      className="absolute -right-3 top-[58px] w-6 h-6 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center hover:border-[#4A7FA7] hover:text-[#4A7FA7] text-[#64748B] transition-colors z-10"
      style={{ boxShadow: tokens.shadow.sm }}
    >
      {collapsed ? <ChevronsRight size={12} strokeWidth={2.5} /> : <ChevronsLeft size={12} strokeWidth={2.5} />}
    </button>
  </aside>
);

/* -------------------------------------------------------------------------
   TOPBAR
   ------------------------------------------------------------------------- */
const Topbar = ({ pageTitle, pageMeta }) => (
  <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center px-6 gap-4 shrink-0">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 text-[12px] text-[#94A3B8]">
        <span>LegacyaPos</span>
        <Dot size={14} className="text-[#CBD5E1]" />
        <span>Foundation</span>
      </div>
      <h1 className="text-[18px] font-bold text-[#1E293B] tracking-tight leading-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
        {pageTitle}
        {pageMeta && <span className="ml-2 text-[12px] font-medium text-[#94A3B8]">{pageMeta}</span>}
      </h1>
    </div>

    {/* Search */}
    <div className="relative w-80 max-w-[40vw] hidden md:block">
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
      <Button variant="ghost" size="sm" icon={Plus}>New Order</Button>
      <button className="relative w-9 h-9 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:text-[#1E293B] transition-colors">
        <Bell size={16} strokeWidth={2.2} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] border-2 border-white" />
      </button>
      <div className="w-px h-6 bg-[#E2E8F0] mx-1" />
      <div className="flex items-center gap-2 pr-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center text-white font-semibold text-[12px]">
          AR
        </div>
      </div>
    </div>
  </header>
);

/* -------------------------------------------------------------------------
   DESIGN SYSTEM SHOWCASE (Phase 1 deliverable view)
   ------------------------------------------------------------------------- */
const DesignSystemView = () => (
  <div className="space-y-6">
    {/* Hero */}
    <Card className="p-6 overflow-hidden relative">
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#DCEAF5] opacity-50" />
      <div className="absolute -bottom-20 -right-4 w-32 h-32 rounded-full bg-[#DCEAF5] opacity-30" />
      <div className="relative">
        <Badge tone="primary" dot>Phase 1 · Foundation</Badge>
        <h2 className="mt-3 text-[24px] font-bold text-[#1E293B] tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Design system & layout shell — ready.
        </h2>
        <p className="mt-1.5 text-[14px] text-[#64748B] max-w-2xl leading-relaxed">
          Tokens, typography, base components, and the navigation shell are wired up.
          Next: Dashboard, POS Cashier, Orders, and Kitchen Display screens in Phase 2.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary" icon={Sparkles}>Begin Phase 2</Button>
          <Button variant="secondary">View handoff specs</Button>
        </div>
      </div>
    </Card>

    {/* Stat preview row — proves tokens work for dashboard-style data */}
    <section>
      <SectionHeader title="Stat cards" hint="Numbers use tabular-nums for clean alignment" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Revenue Today"    value="Rp 4.28M"  delta="+12.4%" deltaTone="success" helper="vs yesterday Rp 3.81M" />
        <StatCard label="Orders"           value="142"       delta="+8 today" deltaTone="success" helper="Avg 5.9 / hour" />
        <StatCard label="Avg Order Value"  value="Rp 30.1K"  delta="-2.1%"  deltaTone="danger"  helper="Target Rp 32K" />
        <StatCard label="Pending Kitchen"  value="6"         helper="2 over 8 minutes" />
      </div>
    </section>

    {/* AI insights — defines the pattern for the dashboard */}
    <section>
      <SectionHeader title="AI Insight panel" hint="Cohesive list — not isolated cards" />
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF2F7]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-[13.5px] font-semibold text-[#1E293B]">Insights for today</p>
              <p className="text-[11px] text-[#94A3B8]">Updated 2 minutes ago</p>
            </div>
          </div>
          <Badge tone="success" dot>Live</Badge>
        </div>
        <div className="p-2 divide-y divide-[#F1F5F9]">
          {mockInsights.map((i) => <InsightCard key={i.id} insight={i} />)}
        <
