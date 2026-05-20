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

        <Card className="p-4">
          <p className="text-[13px] font-bold text-[#1E293B] mb-1.5" style={{ fontFamily:'Plus Jakarta Sans' }}>Quiet hours</p>
          <p className="text-[11.5px] text-[#94A3B8] mb-3">Suppress non-critical alerts</p>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
            <span className="text-[12.5px] font-semibold text-[#1E293B] tabular-nums">23:00 – 07:00</span>
            <Switch checked={true} onChange={()=>{}}/>
          </div>
        </Card>
      </div>
    </div>
  );
};

const ChannelRow = ({ icon:Icon, label, enabled:initial }) => {
  const [on, setOn] = useState(initial);
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={13} className={on ? 'text-[#3A6588]' : 'text-[#CBD5E1]'} strokeWidth={2.2}/>
        <span className={`text-[12.5px] font-medium ${on ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`}>{label}</span>
      </div>
      <Switch checked={on} onChange={setOn} size="sm"/>
    </div>
  );
};

/* =========================================================================
   SETTINGS
   ========================================================================= */

const settingsSections = [
  { id:'store',         label:'Store profile',   icon:Store,        group:'Business' },
  { id:'payment',       label:'Payment methods', icon:CreditCard,   group:'Business' },
  { id:'receipt',       label:'Receipt',         icon:Receipt,      group:'Business' },
  { id:'team',          label:'Team & roles',    icon:Users,        group:'Operations' },
  { id:'devices',       label:'Devices',         icon:Smartphone,   group:'Operations' },
  { id:'integrations',  label:'Integrations',    icon:Plug,         group:'Operations' },
  { id:'account',       label:'Account',         icon:CircleUserRound, group:'Account' },
  { id:'security',      label:'Security',        icon:ShieldCheck,  group:'Account' },
];

const teamMembers = [
  { id:1, name:'Arif Rahman',     email:'arif@legacya.co',    role:'Owner',    branch:'Kemang',     status:'active', avatar:'AR', avatarBg:'from-[#4A7FA7] to-[#3A6588]' },
  { id:2, name:'Sari Wijaya',     email:'sari@legacya.co',    role:'Manager',  branch:'Kemang',     status:'active', avatar:'SW', avatarBg:'from-[#F59E0B] to-[#B45309]' },
  { id:3, name:'Dewi Lestari',    email:'dewi@legacya.co',    role:'Cashier',  branch:'Kemang',     status:'active', avatar:'DL', avatarBg:'from-[#22C55E] to-[#15803D]' },
  { id:4, name:'Rizki Pratama',   email:'rizki@legacya.co',   role:'Cashier',  branch:'Kemang',     status:'active', avatar:'RP', avatarBg:'from-[#7AA9CC] to-[#3A6588]' },
  { id:5, name:'Budi Santoso',    email:'budi@legacya.co',    role:'Kitchen',  branch:'Kemang',     status:'active', avatar:'BS', avatarBg:'from-[#EF4444] to-[#B91C1C]' },
  { id:6, name:'Indah Permata',   email:'indah@legacya.co',   role:'Kitchen',  branch:'Kemang',     status:'inactive', avatar:'IP', avatarBg:'from-[#94A3B8] to-[#64748B]' },
];

const roleMeta = {
  Owner:   { tone:'primary' },
  Manager: { tone:'warning' },
  Cashier: { tone:'success' },
  Kitchen: { tone:'danger' },
};

const StoreProfileSection = ({ form, setForm }) => (
  <div className="space-y-4">
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <Building2 size={16} className="text-[#3A6588]"/>
        <h3 className="text-[14px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Business information</h3>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Business name" value={form.businessName} onChange={e=>setForm({...form, businessName:e.target.value})} />
          <Input label="Brand handle" prefix="@" value={form.handle} onChange={e=>setForm({...form, handle:e.target.value})} />
        </div>
        <Input label="Address" value={form.address} onChange={e=>setForm({...form, address:e.target.value})} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Phone"    prefix="+62" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
          <Input label="Email"    value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          <Input label="Website"  value={form.website} onChange={e=>setForm({...form, website:e.target.value})} />
        </div>
      </div>
    </Card>

    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <Clock size={16} className="text-[#3A6588]"/>
        <h3 className="text-[14px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Hours & locale</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Opens at"   suffix="WIB" value="10:00" onChange={()=>{}} />
        <Input label="Closes at"  suffix="WIB" value="22:00" onChange={()=>{}} />
        <div>
          <label className="block text-[11.5px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Currency</label>
          <button className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#E2E8F0] text-[13.5px] text-[#1E293B] font-medium flex items-center justify-between hover:bg-[#F6F9FC]">
            IDR — Indonesian Rupiah <ChevronRight size={14} className="text-[#94A3B8]"/>
          </button>
        </div>
      </div>
    </Card>

    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <Receipt size={16} className="text-[#3A6588]"/>
        <h3 className="text-[14px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Tax & service</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Tax rate"     suffix="%" value="10" onChange={()=>{}} />
        <Input label="Service charge" suffix="%" value="5"  onChange={()=>{}} />
      </div>
      <div className="mt-4 p-3 rounded-lg bg-[#F6F9FC] flex items-start gap-2.5">
        <Info size={14} className="text-[#94A3B8] mt-0.5"/>
        <p className="text-[12px] text-[#64748B] leading-relaxed">
          Tax and service charges will be calculated automatically on each order. PPN is set per Indonesian regulation.
        </p>
      </div>
    </Card>
  </div>
);

const PaymentSection = () => {
  const [methods, setMethods] = useState([
    { id:'qris', label:'QRIS',     icon:QrCode,     fee:0.7, enabled:true,  description:'All Indonesian e-wallet & bank QR' },
    { id:'card', label:'Debit/Credit Card', icon:CreditCard, fee:2.5, enabled:true,  description:'Visa, Mastercard, JCB via card terminal' },
    { id:'cash', label:'Cash',     icon:Banknote,   fee:0,   enabled:true,  description:'Physical cash with change calculator' },
    { id:'ewal', label:'E-Wallet', icon:Wallet,     fee:1.5, enabled:true,  description:'GoPay, OVO, DANA direct integration' },
    { id:'bank', label:'Bank Transfer', icon:Building2, fee:0, enabled:false, description:'Manual transfer verification' },
  ]);

  const toggle = (id) => setMethods(prev => prev.map(m => m.id===id ? { ...m, enabled:!m.enabled } : m));

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-[#EEF2F7] flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Accepted payment methods</h3>
          <p className="text-[11.5px] text-[#94A3B8] mt-0.5">Enable methods customers can use at checkout</p>
        </div>
        <Badge tone="success" dot>{methods.filter(m=>m.enabled).length} active</Badge>
      </div>
      <div className="divide-y divide-[#F1F5F9]">
        {methods.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#F8FAFC] transition-colors">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${m.enabled ? 'bg-[#DCEAF5] text-[#3A6588]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                <Icon size={18} strokeWidth={2.2}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-[14px] font-bold ${m.enabled ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`}>{m.label}</p>
                  {m.fee > 0 && <Badge tone="neutral" size="sm">{m.fee}% fee</Badge>}
                  {m.fee === 0 && <Badge tone="success" size="sm">No fee</Badge>}
                </div>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">{m.description}</p>
              </div>
              <Switch checked={m.enabled} onChange={()=>toggle(m.id)}/>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const ReceiptSection = ({ form, setForm }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {/* Form */}
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <Pencil size={16} className="text-[#3A6588]"/>
          <h3 className="text-[14px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Receipt content</h3>
        </div>
        <div className="space-y-4">
          <Input label="Header line 1" value={form.receiptHeader1} onChange={e=>setForm({...form, receiptHeader1:e.target.value})}/>
          <Input label="Header line 2" value={form.receiptHeader2} onChange={e=>setForm({...form, receiptHeader2:e.target.value})}/>
          <Textarea label="Footer message" hint="Shown at the bottom of every receipt" rows={3}
            value={form.receiptFooter} onChange={e=>setForm({...form, receiptFooter:e.target.value})}/>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={16} className="text-[#3A6588]"/>
          <h3 className="text-[14px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Display options</h3>
        </div>
        <div className="space-y-3">
          <OptionRow label="Show logo"          desc="Print store logo on receipt" checked={form.showLogo}     onChange={v=>setForm({...form, showLogo:v})}/>
          <OptionRow label="Show tax breakdown" desc="Itemize PPN on each receipt"  checked={form.showTax}     onChange={v=>setForm({...form, showTax:v})}/>
          <OptionRow label="Show QR feedback"   desc="QR code linking to review form" checked={form.showQR}    onChange={v=>setForm({...form, showQR:v})}/>
          <OptionRow label="Auto-print"         desc="Print receipt automatically after payment" checked={form.autoPrint} onChange={v=>setForm({...form, autoPrint:v})}/>
        </div>
      </Card>
    </div>

    {/* Live preview — signature detail */}
    <div className="lg:sticky lg:top-6 self-start">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-[#3A6588]"/>
            <h3 className="text-[13px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Live preview</h3>
          </div>
          <Badge tone="primary" dot size="sm">Updates instantly</Badge>
        </div>

        {/* Thermal receipt mock */}
        <div className="relative bg-[#FAFAF7] rounded-xl p-1" style={{ boxShadow:'inset 0 1px 0 0 #fff, 0 2px 12px -2px rgb(0 0 0 / 0.08)' }}>
          {/* Receipt paper */}
          <div className="bg-white px-6 py-5 font-mono text-[11px] text-[#1E293B] leading-relaxed" style={{ fontFamily:'ui-monospace, monospace' }}>
            {form.showLogo && (
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center text-white font-bold text-[14px]">L</div>
              </div>
            )}
            <p className="text-center font-bold text-[13px] tracking-wide">{form.receiptHeader1 || ' '}</p>
            <p className="text-center text-[10px] text-[#64748B] mb-2">{form.receiptHeader2 || ' '}</p>

            <div className="border-t border-dashed border-[#94A3B8] my-2"/>
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>ORD-1052</span>
              <span>Table 7</span>
            </div>
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>20 May 2026</span>
              <span>11:48 WIB</span>
            </div>
            <div className="border-t border-dashed border-[#94A3B8] my-2"/>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>2× Chicken Mentai Bowl</span>
                <span className="tabular-nums">116,000</span>
              </div>
              <div className="flex justify-between">
                <span>1× Iced Matcha Latte</span>
                <span className="tabular-nums">27,000</span>
              </div>
            </div>

            <div className="border-t border-dashed border-[#94A3B8] my-2"/>
            <div className="flex justify-between text-[10px]"><span>Subtotal</span><span className="tabular-nums">143,000</span></div>
            {form.showTax && <div className="flex justify-between text-[10px]"><span>PPN 10%</span><span className="tabular-nums">14,300</span></div>}
            <div className="flex justify-between text-[10px]"><span>Service 5%</span><span className="tabular-nums">7,150</span></div>
            <div className="border-t border-[#1E293B] my-1.5"/>
            <div className="flex justify-between font-bold text-[13px]"><span>TOTAL</span><span className="tabular-nums">Rp 164,450</span></div>
            <div className="flex justify-between text-[10px] mt-1"><span>QRIS</span><span className="tabular-nums">164,450</span></div>

            <div className="border-t border-dashed border-[#94A3B8] my-2"/>
            <p className="text-center text-[10px] leading-relaxed">{form.receiptFooter || ' '}</p>

            {form.showQR && (
              <div className="flex justify-center mt-3">
                <div className="w-14 h-14 bg-[#1E293B] rounded grid grid-cols-5 grid-rows-5 gap-px p-1">
                  {Array.from({ length:25 }).map((_, i) => (
                    <div key={i} className="bg-white" style={{ opacity: Math.random() > 0.5 ? 1 : 0 }}/>
                  ))}
                </div>
              </div>
            )}
            <p className="text-center text-[9px] text-[#94A3B8] mt-2">Scan to leave a review</p>
          </div>

          {/* Torn edge effect */}
          <div className="h-3 bg-white relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 flex justify-center gap-1 px-2">
              {Array.from({ length:30 }).map((_, i) => <div key={i} className="w-1.5 h-3 bg-[#FAFAF7]" style={{ transform:'translateY(-50%) rotate(45deg)' }}/>)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

const OptionRow = ({ label, desc, checked, onChange }) => (
  <div className="flex items-start justify-between gap-3 py-1">
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-[#1E293B]">{label}</p>
      <p className="text-[11.5px] text-[#94A3B8] mt-0.5">{desc}</p>
    </div>
    <Switch checked={checked} onChange={onChange}/>
  </div>
);

const TeamSection = () => (
  <Card className="overflow-hidden">
    <div className="px-5 py-4 border-b border-[#EEF2F7] flex items-center justify-between">
      <div>
        <h3 className="text-[14px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Team members</h3>
        <p className="text-[11.5px] text-[#94A3B8] mt-0.5">{teamMembers.length} members · {teamMembers.filter(m=>m.status==='active').length} active</p>
      </div>
      <Button variant="primary" size="sm" icon={Plus}>Invite member</Button>
    </div>
    <table className="w-full">
      <thead>
        <tr className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wider bg-[#F8FAFC]">
          <th className="text-left px-5 py-2.5">Member</th>
          <th className="text-left px-3 py-2.5">Role</th>
          <th className="text-left px-3 py-2.5">Branch</th>
          <th className="text-left px-3 py-2.5">Status</th>
          <th className="text-right px-5 py-2.5"></th>
        </tr>
      </thead>
      <tbody>
        {teamMembers.map(m => (
          <tr key={m.id} className="text-[13px] hover:bg-[#F8FAFC] transition-colors border-t border-[#F1F5F9]">
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${m.avatarBg} flex items-center justify-center text-white font-bold text-[12px] shrink-0`}>
                  {m.avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#1E293B] flex items-center gap-1.5">
                    {m.name}
                    {m.role==='Owner' && <Crown size={11} className="text-[#F59E0B]"/>}
                  </p>
                  <p className="text-[11px] text-[#94A3B8] truncate">{m.email}</p>
                </div>
              </div>
            </td>
            <td className="px-3 py-3.5"><Badge tone={roleMeta[m.role].tone}>{m.role}</Badge></td>
            <td className="px-3 py-3.5 text-[#64748B] flex items-center gap-1"><MapPin size={11}/> {m.branch}</td>
            <td className="px-3 py-3.5">
              <Badge tone={m.status==='active'?'success':'neutral'} dot>{m.status==='active'?'Active':'Inactive'}</Badge>
            </td>
            <td className="px-5 py-3.5 text-right">
              <div className="inline-flex items-center gap-1">
                <button className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"><Pencil size={13}/></button>
                <button className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]"><MoreHorizontal size={14}/></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);

const AccountSection = () => (
  <div className="space-y-4">
    {/* Plan card */}
    <Card className="overflow-hidden relative">
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#DCEAF5] opacity-60"/>
      <div className="absolute -bottom-16 -right-4 w-32 h-32 rounded-full bg-[#DCEAF5] opacity-30"/>
      <div className="relative p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Badge tone="primary" dot>Pro Plan</Badge>
            <h3 className="mt-2 text-[20px] font-bold text-[#1E293B] tracking-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>
              Rp 499,000 <span className="text-[14px] font-medium text-[#64748B]">/ month</span>
            </h3>
            <p className="text-[12.5px] text-[#64748B] mt-1">Renews May 28, 2026 · Visa ending 4242</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md">Manage billing</Button>
            <Button variant="primary" size="md">Upgrade plan</Button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <UsageStat label="Branches"   value="1 / 3"      pct={33}/>
          <UsageStat label="Team seats" value="6 / 10"     pct={60}/>
          <UsageStat label="Storage"    value="2.4 / 50 GB" pct={5}/>
          <UsageStat label="API calls"  value="8.2K / 50K"  pct={16}/>
        </div>
      </div>
    </Card>

    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <User size={16} className="text-[#3A6588]"/>
        <h3 className="text-[14px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Profile</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Full name" value="Arif Rahman" onChange={()=>{}}/>
        <Input label="Email"     value="arif@legacya.co" onChange={()=>{}}/>
        <Input label="Phone"     prefix="+62" value="812-3456-7890" onChange={()=>{}}/>
        <div>
          <label className="block text-[11.5px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Language</label>
          <button className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#E2E8F0] text-[13.5px] text-[#1E293B] font-medium flex items-center justify-between hover:bg-[#F6F9FC]">
            🇮🇩 Bahasa Indonesia <ChevronRight size={14} className="text-[#94A3B8]"/>
          </button>
        </div>
      </div>
    </Card>

    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <KeyRound size={16} className="text-[#3A6588]"/>
        <h3 className="text-[14px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Security</h3>
      </div>
      <div className="space-y-3">
        <SecurityRow icon={KeyRound}     title="Password"           desc="Last changed 3 months ago" action="Change"/>
        <SecurityRow icon={ShieldCheck}  title="Two-factor auth"    desc="SMS to •••• 7890"          action="Manage" enabled/>
        <SecurityRow icon={Smartphone}   title="Active sessions"    desc="2 devices currently signed in" action="View all"/>
      </div>
    </Card>
  </div>
);

const UsageStat = ({ label, value, pct }) => (
  <div>
    <p className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">{label}</p>
    <p className="text-[14px] font-bold text-[#1E293B] tabular-nums mb-1.5" style={{ fontFamily:'Plus Jakarta Sans' }}>{value}</p>
    <div className="h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
      <div className="h-full rounded-full bg-[#4A7FA7]" style={{ width:`${pct}%` }}/>
    </div>
  </div>
);

const SecurityRow = ({ icon:Icon, title, desc, action, enabled }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors">
    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[#3A6588] shrink-0">
      <Icon size={15} strokeWidth={2.2}/>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-[#1E293B] flex items-center gap-1.5">
        {title}
        {enabled && <Badge tone="success" size="sm" dot>On</Badge>}
      </p>
      <p className="text-[11.5px] text-[#94A3B8] mt-0.5">{desc}</p>
    </div>
    <button className="text-[12px] font-bold text-[#3A6588] hover:text-[#1E293B] transition-colors">{action} →</button>
  </div>
);

const PlaceholderSettingsSection = ({ section }) => (
  <Card className="p-10 text-center">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#DCEAF5] flex items-center justify-center mb-4">
      <Sparkles size={22} className="text-[#3A6588]"/>
    </div>
    <h3 className="text-[18px] font-bold text-[#1E293B] mb-1.5" style={{ fontFamily:'Plus Jakarta Sans' }}>{section.label}</h3>
    <p className="text-[13.5px] text-[#64748B] leading-relaxed max-w-md mx-auto">This section uses the same patterns as the others — wire up state and forms when you're ready.</p>
  </Card>
);

const SettingsView = () => {
  const [activeSection, setActiveSection] = useState('store');
  const [originalForm] = useState({
    businessName:'Legacya Kemang', handle:'legacya.kemang', address:'Jl. Kemang Raya No. 42, Jakarta Selatan',
    phone:'21-7180-1234', email:'hello@legacya.co', website:'legacya.co',
    receiptHeader1:'LEGACYA KEMANG', receiptHeader2:'Jl. Kemang Raya No. 42 · Jakarta',
    receiptFooter:'Terima kasih atas kunjungan Anda 🙏\\nFollow @legacya.kemang',
    showLogo:true, showTax:true, showQR:true, autoPrint:true,
  });
  const [form, setForm] = useState(originalForm);

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm);

  const sectionsByGroup = useMemo(() => {
    const map = {};
    settingsSections.forEach(s => {
      if (!map[s.group]) map[s.group] = [];
      map[s.group].push(s);
    });
    return map;
  }, []);

  const active = settingsSections.find(s => s.id===activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case 'store':   return <StoreProfileSection form={form} setForm={setForm}/>;
      case 'payment': return <PaymentSection/>;
      case 'receipt': return <ReceiptSection form={form} setForm={setForm}/>;
      case 'team':    return <TeamSection/>;
      case 'account': return <AccountSection/>;
      default:        return <PlaceholderSettingsSection section={active}/>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      {/* Inner sidebar */}
      <aside className="lg:sticky lg:top-6 self-start">
        <nav className="space-y-5">
          {Object.entries(sectionsByGroup).map(([group, sections]) => (
            <div key={group}>
              <p className="px-2 mb-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">{group}</p>
              <div className="space-y-0.5">
                {sections.map(s => {
                  const Icon = s.icon;
                  const isActive = activeSection===s.id;
                  return (
                    <button key={s.id} onClick={()=>setActiveSection(s.id)}
                      className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        isActive ? 'bg-[#DCEAF5] text-[#3A6588]' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                      }`}>
                      {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[#4A7FA7]"/>}
                      <Icon size={15} strokeWidth={isActive?2.4:2}/>
                      <span className="flex-1 text-left">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

            {/* Content */}
      <div className={`min-w-0 ${isDirty ? 'pb-20' : ''}`}>
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-[20px] font-bold text-[#1E293B] tracking-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>
              {active?.label}
            </h2>
            <p className="text-[12.5px] text-[#94A3B8]">Configure {active?.label.toLowerCase()}</p>
          </div>
        </div>
        {renderSection()}
      </div>

      {/* Sticky save bar */}
      {isDirty && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#1E293B] text-white px-4 py-2.5 rounded-2xl"
          style={{ boxShadow:'0 16px 48px -8px rgb(15 23 42 / 0.40)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"/>
            <span className="text-[12.5px] font-semibold">Unsaved changes</span>
          </div>
          <button onClick={()=>setForm(originalForm)} className="text-[12.5px] font-semibold text-white/70 hover:text-white px-2 transition-colors">
            Discard
          </button>
          <Button variant="success" size="sm" icon={Save}>Save changes</Button>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   SHELL
   ========================================================================= */
const Logo = ({ collapsed }) => (
  <div className="flex items-center gap-2.5">
    <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center shrink-0" style={{ boxShadow:'0 4px 12px -2px rgb(74 127 167 / 0.35)' }}>
      <div className="absolute inset-0.5 rounded-[10px] border border-white/15"/>
      <span className="text-white font-bold text-[15px]" style={{ fontFamily:'Plus Jakarta Sans' }}>L</span>
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#22C55E] border-2 border-white"/>
    </div>
    {!collapsed && (
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-bold tracking-tight text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>
          Legacya<span className="text-[#4A7FA7]">Pos</span>
        </span>
        <span className="text-[10px] text-[#94A3B8] mt-0.5 tracking-wider font-medium uppercase">Restaurant OS</span>
      </div>
    )}
  </div>
);

const Sidebar = ({ activePage, setActivePage, collapsed, setCollapsed }) => (
  <aside className="relative bg-white border-r border-[#E2E8F0] flex flex-col transition-all duration-200 ease-out shrink-0" style={{ width: collapsed ? 76 : 248 }}>
    <div className="h-16 flex items-center px-4 border-b border-[#EEF2F7]"><Logo collapsed={collapsed}/></div>
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {navGroups.map(group => (
        <div key={group.label}>
          {!collapsed && <p className="px-3 mb-1.5 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">{group.label}</p>}
          <div className="space-y-0.5">
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button key={item.id} onClick={()=>setActivePage(item.id)} title={collapsed?item.label:undefined}
                  className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-150 ${
                    isActive ? 'bg-[#DCEAF5] text-[#3A6588]' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                  }`}>
                  {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[#4A7FA7]"/>}
                  <Icon size={18} strokeWidth={isActive?2.4:2} className="shrink-0"/>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.badge && <span className="px-1.5 h-[18px] min-w-[18px] inline-flex items-center justify-center rounded-md bg-[#4A7FA7] text-white text-[10px] font-bold tabular-nums">{item.badge}</span>}
                      {item.alert && <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"/>}
                    </>
                  )}
                  {collapsed && (item.badge || item.alert) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] border-2 border-white"/>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
    <div className="p-3 border-t border-[#EEF2F7]">
      <div className={`flex items-center gap-2.5 rounded-xl p-2 hover:bg-[#F8FAFC] transition-colors cursor-pointer ${collapsed?'justify-center':''}`}>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center text-white font-semibold text-[13px] shrink-0">AR</div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#1E293B] truncate">Arif Rahman</p>
            <p className="text-[11px] text-[#94A3B8] truncate">Owner · Cabang Kemang</p>
          </div>
        )}
      </div>
    </div>
    <button onClick={()=>setCollapsed(!collapsed)}
      className="absolute -right-3 top-[58px] w-6 h-6 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center hover:border-[#4A7FA7] hover:text-[#4A7FA7] text-[#64748B] transition-colors z-10"
      style={{ boxShadow: tokens.shadow.sm }}>
      {collapsed ? <ChevronsRight size={12} strokeWidth={2.5}/> : <ChevronsLeft size={12} strokeWidth={2.5}/>}
    </button>
  </aside>
);

const pageTitles = {
  dashboard:     { breadcrumb:'Operations', title:'Dashboard' },
  pos:           { breadcrumb:'Operations', title:'POS Cashier' },
  orders:        { breadcrumb:'Operations', title:'Orders' },
  kitchen:       { breadcrumb:'Operations', title:'Kitchen Display' },
  inventory:     { breadcrumb:'Manage',     title:'Inventory' },
  menu:          { breadcrumb:'Manage',     title:'Menu' },
  analytics:     { breadcrumb:'Manage',     title:'Analytics' },
  notifications: { breadcrumb:'System',     title:'Notifications', meta:'Activity & alerts' },
  settings:      { breadcrumb:'System',     title:'Settings',      meta:'Store configuration' },
};

const Topbar = ({ activePage }) => {
  const page = pageTitles[activePage] ?? { breadcrumb:'—', title:'—' };
  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[12px] text-[#94A3B8]">
          <span>LegacyaPos</span><Dot size={14} className="text-[#CBD5E1]"/><span>{page.breadcrumb}</span>
        </div>
        <h1 className="text-[18px] font-bold text-[#1E293B] tracking-tight leading-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>
          {page.title}
          {page.meta && <span className="ml-1.5 text-[12px] font-medium text-[#94A3B8]">{page.meta}</span>}
        </h1>
      </div>
      <div className="relative w-72 max-w-[35vw] hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"/>
        <input type="text" placeholder="Search…"
          className="w-full h-9 pl-9 pr-16 rounded-lg bg-[#F6F9FC] border border-transparent text-[13px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4A7FA7] focus:bg-white transition-all"/>
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 px-1.5 h-5 rounded bg-white border border-[#E2E8F0] text-[10px] font-semibold text-[#64748B]">
          <Command size={9}/> K
        </kbd>
      </div>
      <div className="flex items-center gap-1">
        <button className="relative w-9 h-9 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:text-[#1E293B] transition-colors">
          <Bell size={16} strokeWidth={2.2}/>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] border-2 border-white"/>
        </button>
        <div className="w-px h-6 bg-[#E2E8F0] mx-1"/>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center text-white font-semibold text-[12px]">AR</div>
      </div>
    </header>
  );
};

const PlaceholderView = ({ page }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Card className="p-10 text-center max-w-md">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#DCEAF5] flex items-center justify-center mb-4">
        <Sparkles size={22} className="text-[#3A6588]"/>
      </div>
      <h3 className="text-[18px] font-bold text-[#1E293B] mb-1.5" style={{ fontFamily:'Plus Jakarta Sans' }}>{page.title}</h3>
      <p className="text-[13.5px] text-[#64748B] leading-relaxed">Built in an earlier phase — switch to Notifications or Settings to see this phase.</p>
    </Card>
  </div>
);

export default function LegacyaPos() {
  const [activePage, setActivePage] = useState('notifications');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (document.getElementById('legacyapos-fonts')) return;
    const link = document.createElement('link');
    link.id = 'legacyapos-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);

  const renderView = () => {
    switch (activePage) {
      case 'notifications': return <NotificationsView/>;
      case 'settings':      return <SettingsView/>;
      default:              return <PlaceholderView page={pageTitles[activePage]}/>;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-[#1E293B] antialiased"
      style={{ background: tokens.color.bg, fontFamily:'Inter, system-ui, sans-serif' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} collapsed={collapsed} setCollapsed={setCollapsed}/>
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar activePage={activePage}/>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1500px] mx-auto px-6 py-6">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
