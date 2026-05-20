import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, ShoppingCart, ReceiptText, ChefHat,
  Package, UtensilsCrossed, BarChart3, Bell, Settings as SettingsIcon,
  Search, ChevronsLeft, ChevronsRight, Sparkles, MoreHorizontal,
  TrendingUp, AlertTriangle, AlertCircle, CheckCircle2, Info,
  Plus, Command, Dot, Check, Clock, ArrowRight, X,
  Store, CreditCard, Receipt, Users, Smartphone, Plug,
  User, ShieldCheck, Wallet, QrCode, Banknote,
  Pencil, Trash2, Save, Eye, Building2, MapPin,
  Phone, Mail, Globe, Image, Printer, ChevronRight,
  CircleUserRound, Crown, KeyRound, BellOff, Volume2, Filter
} from 'lucide-react';

/* =========================================================================
   LEGACYAPOS — FINAL: Notifications + Settings (closeout 9/9)
   ========================================================================= */

const tokens = {
  color: {
    primary:'#4A7FA7', primarySoft:'#DCEAF5', primaryDeep:'#3A6588',
    bg:'#F6F9FC', card:'#FFFFFF',
    textMain:'#1E293B', textSoft:'#64748B', textMuted:'#94A3B8',
    border:'#E2E8F0', success:'#22C55E', warning:'#F59E0B', danger:'#EF4444',
  },
  shadow: {
    sm:'0 1px 2px 0 rgb(15 23 42 / 0.04)',
    md:'0 4px 12px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
    lg:'0 12px 32px -8px rgb(15 23 42 / 0.10), 0 4px 8px -4px rgb(15 23 42 / 0.05)',
  },
};

const fmtIDR = (n) => 'Rp ' + n.toLocaleString('id-ID');

/* -------------------------------------------------------------------------
   NAV
   ------------------------------------------------------------------------- */
const navGroups = [
  { label:'Operations', items:[
    { id:'dashboard', label:'Dashboard',       icon:LayoutDashboard },
    { id:'pos',       label:'POS Cashier',     icon:ShoppingCart },
    { id:'orders',    label:'Orders',          icon:ReceiptText, badge:3 },
    { id:'kitchen',   label:'Kitchen Display', icon:ChefHat, badge:5 },
  ]},
  { label:'Manage', items:[
    { id:'inventory', label:'Inventory',       icon:Package, alert:true },
    { id:'menu',      label:'Menu',            icon:UtensilsCrossed },
    { id:'analytics', label:'Analytics',       icon:BarChart3 },
  ]},
  { label:'System', items:[
    { id:'notifications', label:'Notifications', icon:Bell, badge:4 },
    { id:'settings',      label:'Settings',      icon:SettingsIcon },
  ]},
];

/* -------------------------------------------------------------------------
   BASE COMPONENTS
   ------------------------------------------------------------------------- */
const Button = ({ variant='primary', size='md', icon:Icon, iconRight:IconRight, children, className='', ...rest }) => {
  const sizes = { sm:'h-8 px-3 text-[13px] gap-1.5', md:'h-10 px-4 text-sm gap-2', lg:'h-12 px-5 text-[15px] gap-2' };
  const variants = {
    primary:'bg-[#4A7FA7] text-white hover:bg-[#3A6588] shadow-sm',
    secondary:'bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-[#F6F9FC]',
    ghost:'bg-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]',
    soft:'bg-[#DCEAF5] text-[#3A6588] hover:bg-[#C9DEF0]',
    danger:'bg-[#EF4444] text-white hover:bg-[#DC2626]',
    success:'bg-[#22C55E] text-white hover:bg-[#16A34A] shadow-sm',
  };
  return (
    <button {...rest} className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] ${sizes[size]} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={size==='sm'?14:16} strokeWidth={2.2} />}
      {children}
      {IconRight && <IconRight size={size==='sm'?14:16} strokeWidth={2.2} />}
    </button>
  );
};

const Badge = ({ tone='neutral', children, dot=false, size='md' }) => {
  const tones = {
    neutral:'bg-[#F1F5F9] text-[#475569]', primary:'bg-[#DCEAF5] text-[#3A6588]',
    success:'bg-[#DCFCE7] text-[#15803D]', warning:'bg-[#FEF3C7] text-[#B45309]',
    danger: 'bg-[#FEE2E2] text-[#B91C1C]',
  };
  const dotColors = { neutral:'bg-slate-400', primary:'bg-[#4A7FA7]', success:'bg-[#22C55E]', warning:'bg-[#F59E0B]', danger:'bg-[#EF4444]' };
  const sizes = { sm:'px-1.5 py-0.5 text-[10px]', md:'px-2 py-0.5 text-[11px]', lg:'px-2.5 py-1 text-[12px]' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-semibold ${tones[tone]} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[tone]}`} />}
      {children}
    </span>
  );
};

const Card = ({ children, className='', ...rest }) => (
  <div {...rest} className={`bg-white border border-[#E2E8F0] rounded-2xl ${className}`} style={{ boxShadow: tokens.shadow.sm }}>
    {children}
  </div>
);

const Switch = ({ checked, onChange, size='md' }) => {
  const sizes = {
    sm:{ w:'w-8',  h:'h-[18px]', dot:'w-3.5 h-3.5', shift:'translate-x-[14px]' },
    md:{ w:'w-10', h:'h-[22px]', dot:'w-[18px] h-[18px]', shift:'translate-x-[18px]' },
  };
  const s = sizes[size];
  return (
    <button onClick={() => onChange(!checked)}
      className={`${s.w} ${s.h} relative rounded-full transition-colors duration-200 ${checked ? 'bg-[#22C55E]' : 'bg-[#CBD5E1]'}`}>
      <span className={`absolute top-0.5 left-0.5 ${s.dot} rounded-full bg-white shadow transition-transform duration-200 ${checked ? s.shift : ''}`}/>
    </button>
  );
};

const Input = ({ label, hint, prefix, suffix, ...rest }) => (
  <div>
    {label && <label className="block text-[11.5px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">{label}</label>}
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[13px] font-medium">{prefix}</span>}
      <input {...rest}
        className={`w-full h-10 ${prefix?'pl-9':'pl-3.5'} ${suffix?'pr-12':'pr-3.5'} rounded-lg bg-white border border-[#E2E8F0] text-[13.5px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4A7FA7] focus:ring-2 focus:ring-[#DCEAF5] transition-all`}/>
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[12px] font-medium">{suffix}</span>}
    </div>
    {hint && <p className="mt-1 text-[11.5px] text-[#94A3B8]">{hint}</p>}
  </div>
);

const Textarea = ({ label, hint, rows=3, ...rest }) => (
  <div>
    {label && <label className="block text-[11.5px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">{label}</label>}
    <textarea {...rest} rows={rows}
      className="w-full p-3 rounded-lg bg-white border border-[#E2E8F0] text-[13.5px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4A7FA7] focus:ring-2 focus:ring-[#DCEAF5] transition-all resize-none"/>
    {hint && <p className="mt-1 text-[11.5px] text-[#94A3B8]">{hint}</p>}
  </div>
);

/* =========================================================================
   NOTIFICATIONS
   ========================================================================= */

const allNotifications = [
  { id:1,  type:'danger',  category:'Inventory', title:'Burger Bun stock critical',          message:'Only 8 units left — projected to deplete in ~8 hours at current burn rate.', time:'2m ago', timestamp:'Today 11:46', isRead:false, action:'View inventory' },
  { id:2,  type:'success', category:'Sales',     title:'Daily revenue target reached',        message:'Rp 4.2M crossed before 12 PM — earliest this week.',                          time:'1h ago', timestamp:'Today 10:38', isRead:false, action:'View report' },
  { id:3,  type:'primary', category:'AI Insight',title:'Peak hour staffing recommendation',   message:'7–9 PM forecasted +28% above average. Consider scheduling +2 crew.',          time:'2h ago', timestamp:'Today 09:42', isRead:false, action:'Review schedule' },
  { id:4,  type:'warning', category:'Order',     title:'Refund request pending',              message:'Order ORD-1042 customer requested partial refund for Tom Yum Soup.',         time:'3h ago', timestamp:'Today 08:58', isRead:false, action:'Review request' },
  { id:5,  type:'info',    category:'System',    title:'Weekly report ready',                 message:'Your performance report for May 13–19 is ready to download.',                 time:'5h ago', timestamp:'Today 06:30', isRead:true,  action:'Download' },
  { id:6,  type:'success', category:'Inventory', title:'Restock confirmed',                    message:'Chicken Breast 12kg delivered and added to inventory.',                       time:'Yesterday', timestamp:'Yesterday 18:24', isRead:true, action:'View receipt' },
  { id:7,  type:'primary', category:'AI Insight',title:'Menu pricing opportunity',             message:'Chicken Mentai Bowl elasticity suggests +8% price increase tolerable.',       time:'Yesterday', timestamp:'Yesterday 14:12', isRead:true, action:'Explore' },
  { id:8,  type:'warning', category:'Order',     title:'Order cancellation',                  message:'Table 9 cancelled before payment. Reason: long wait time.',                   time:'Yesterday', timestamp:'Yesterday 13:05', isRead:true, action:'View order' },
  { id:9,  type:'info',    category:'System',    title:'New cashier added',                   message:'Dewi Lestari was added to the team by Arif Rahman.',                          time:'2d ago', timestamp:'May 18, 16:30', isRead:true, action:'Manage team' },
  { id:10, type:'success', category:'Sales',     title:'New menu performing well',            message:'Yuzu Lemonade sold 31 units in 3 days — strong launch.',                      time:'3d ago', timestamp:'May 17, 11:42', isRead:true, action:'View item' },
  { id:11, type:'info',    category:'System',    title:'Software update available',           message:'LegacyaPos v2.4 includes improved kitchen workflow and bug fixes.',           time:'1w ago', timestamp:'May 13, 09:00', isRead:true, action:'Update now' },
];

const typeMeta = {
  danger:  { icon:AlertTriangle, bg:'bg-[#FEE2E2]', color:'text-[#B91C1C]', tone:'danger' },
  warning: { icon:AlertCircle,   bg:'bg-[#FEF3C7]', color:'text-[#B45309]', tone:'warning' },
  success: { icon:CheckCircle2,  bg:'bg-[#DCFCE7]', color:'text-[#15803D]', tone:'success' },
  primary: { icon:Sparkles,      bg:'bg-[#DCEAF5]', color:'text-[#3A6588]', tone:'primary' },
  info:    { icon:Info,          bg:'bg-[#F1F5F9]', color:'text-[#475569]', tone:'neutral' },
};

const NotificationItem = ({ n, onToggleRead, onDismiss }) => {
  const meta = typeMeta[n.type];
  const Icon = meta.icon;
  return (
    <div className={`group relative flex gap-3 px-5 py-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer ${!n.isRead ? 'bg-[#FBFCFE]' : ''}`}>
      {/* Unread indicator strip */}
      {!n.isRead && <span className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r bg-[#4A7FA7]"/>}

      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg}`}>
        <Icon size={17} strokeWidth={2.4} className={meta.color}/>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone={meta.tone}>{n.category}</Badge>
          {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#4A7FA7]"/>}
        </div>
        <p className="text-[13.5px] font-bold text-[#1E293B] leading-snug">{n.title}</p>
        <p className="text-[12.5px] text-[#64748B] mt-0.5 leading-relaxed">{n.message}</p>
        <div className="mt-2 flex items-center gap-3">
          <button className="text-[12px] font-bold text-[#3A6588] hover:text-[#1E293B] transition-colors inline-flex items-center gap-1">
            {n.action} <ArrowRight size={11}/>
          </button>
          <span className="text-[11px] text-[#94A3B8] tabular-nums">{n.timestamp}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
        <button onClick={(e)=>{ e.stopPropagation(); onToggleRead(n.id); }}
          className="w-7 h-7 rounded-md hover:bg-[#E2E8F0] flex items-center justify-center text-[#94A3B8]"
          title={n.isRead ? 'Mark as unread' : 'Mark as read'}>
          {n.isRead ? <Bell size={13}/> : <Check size={13}/>}
        </button>
        <button onClick={(e)=>{ e.stopPropagation(); onDismiss(n.id); }}
          className="w-7 h-7 rounded-md hover:bg-[#FEE2E2] hover:text-[#EF4444] flex items-center justify-center text-[#94A3B8] transition-colors"
          title="Dismiss">
          <X size={13}/>
        </button>
      </div>
    </div>
  );
};

const NotificationsView = () => {
  const [items, setItems] = useState(allNotifications);
  const [filter, setFilter] = useState('all');

  const toggleRead = (id) => setItems(prev => prev.map(n => n.id===id ? { ...n, isRead:!n.isRead } : n));
  const dismiss = (id) => setItems(prev => prev.filter(n => n.id !== id));
  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, isRead:true })));

  const counts = useMemo(() => ({
    all: items.length,
    unread: items.filter(n => !n.isRead).length,
    Inventory: items.filter(n => n.category==='Inventory').length,
    Sales: items.filter(n => n.category==='Sales').length,
    'AI Insight': items.filter(n => n.category==='AI Insight').length,
    Order: items.filter(n => n.category==='Order').length,
    System: items.filter(n => n.category==='System').length,
  }), [items]);

  const filtered = useMemo(() => {
    if (filter==='all') return items;
    if (filter==='unread') return items.filter(n => !n.isRead);
    return items.filter(n => n.category === filter);
  }, [items, filter]);

  // Group by time
  const grouped = useMemo(() => {
    const groups = { 'Today':[], 'Yesterday':[], 'Earlier':[] };
    filtered.forEach(n => {
      if (n.timestamp.startsWith('Today')) groups['Today'].push(n);
      else if (n.timestamp.startsWith('Yesterday')) groups['Yesterday'].push(n);
      else groups['Earlier'].push(n);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
      {/* Main column */}
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF2F7]">
          <div>
            <h2 className="text-[16px] font-bold text-[#1E293B] tracking-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>
              Activity feed
            </h2>
            <p className="text-[11.5px] text-[#94A3B8] mt-0.5">
              {counts.unread > 0 ? <><span className="font-semibold text-[#3A6588]">{counts.unread} unread</span> · {counts.all} total</> : `${counts.all} notifications`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={Check} onClick={markAllRead}>Mark all read</Button>
            <Button variant="ghost" size="sm" icon={SettingsIcon}>Preferences</Button>
          </div>
        </div>

        {/* Filter strip */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-[#EEF2F7] overflow-x-auto">
          {[
            { id:'all',         label:'All',         count:counts.all },
            { id:'unread',      label:'Unread',      count:counts.unread },
            { id:'Inventory',   label:'Inventory',   count:counts.Inventory },
            { id:'Sales',       label:'Sales',       count:counts.Sales },
            { id:'AI Insight',  label:'AI Insights', count:counts['AI Insight'] },
            { id:'Order',       label:'Orders',      count:counts.Order },
            { id:'System',      label:'System',      count:counts.System },
          ].map(t => (
            <button key={t.id} onClick={()=>setFilter(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors ${
                filter===t.id ? 'bg-[#1E293B] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
              }`}>
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tabular-nums ${
                filter===t.id ? 'bg-white/15 text-white' : 'bg-[#E2E8F0] text-[#64748B]'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Grouped list */}
        <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#DCFCE7] flex items-center justify-center mb-3">
                <CheckCircle2 size={24} className="text-[#15803D]"/>
              </div>
              <p className="text-[14px] font-bold text-[#1E293B]">You're all caught up.</p>
              <p className="text-[12.5px] text-[#94A3B8] mt-1">No notifications matching this filter.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={group}>
                  <div className="px-5 py-2 bg-[#FAFBFC] border-y border-[#EEF2F7] flex items-center justify-between">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">{group}</span>
                    <span className="text-[10.5px] text-[#94A3B8] tabular-nums">{list.length}</span>
                  </div>
                  <div className="divide-y divide-[#F1F5F9]">
                    {list.map(n => (
                      <NotificationItem key={n.id} n={n} onToggleRead={toggleRead} onDismiss={dismiss}/>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Side panel — summary + preferences shortcut */}
      <div className="space-y-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center">
              <Sparkles size={13} className="text-white"/>
            </div>
            <p className="text-[13px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Today's digest</p>
          </div>
          <ul className="space-y-2.5 text-[12.5px]">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1.5 shrink-0"/>
              <span className="text-[#1E293B]"><span className="font-semibold">1 critical</span> inventory alert needs action</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mt-1.5 shrink-0"/>
              <span className="text-[#1E293B]">Daily target hit <span className="font-semibold tabular-nums">2h earlier</span> than usual</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A7FA7] mt-1.5 shrink-0"/>
              <span className="text-[#1E293B]"><span className="font-semibold">2 AI insights</span> waiting for review</span>
            </li>
          </ul>
        </Card>

        <Card className="p-4">
          <p className="text-[13px] font-bold text-[#1E293B] mb-3" style={{ fontFamily:'Plus Jakarta Sans' }}>Delivery channels</p>
          <div className="space-y-2.5">
            <ChannelRow icon={Bell}  label="In-app"     enabled={true}/>
            <ChannelRow icon={Mail}  label="Email"      enabled={true}/>
            <ChannelRow icon={Phone} label="SMS"        enabled={false}/>
            <ChannelRow icon={Volume2} label="Push"     enabled={true}/>
          </div>
          <button className="mt-3 w-full h-8 rounded-lg bg-[#F6F9FC] hover:bg-[#EEF2F7] text-[12px] font-semibold text-[#3A6588] transition-colors">
            Configure channels
          </button>
        </Card>

        <Car
