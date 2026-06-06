import React, { useState, useMemo } from 'react';
import {
  Store, CreditCard, Receipt, Users, Smartphone, Plug,
  CircleUserRound, ShieldCheck, Building2, Clock, Pencil, Eye,
  ChevronRight, Info, MapPin, Crown, KeyRound, Save, Plus, MoreHorizontal,
  QrCode, Banknote, Wallet,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';

const settingsSections = [
  { id:'store',        label:'Store profile',   icon:Store,           group:'Business' },
  { id:'payment',      label:'Payment methods', icon:CreditCard,      group:'Business' },
  { id:'receipt',      label:'Receipt',         icon:Receipt,         group:'Business' },
  { id:'team',         label:'Team & roles',    icon:Users,           group:'Operations' },
  { id:'devices',      label:'Devices',         icon:Smartphone,      group:'Operations' },
  { id:'integrations', label:'Integrations',    icon:Plug,            group:'Operations' },
  { id:'account',      label:'Account',         icon:CircleUserRound, group:'Account' },
  { id:'security',     label:'Security',        icon:ShieldCheck,     group:'Account' },
];

const teamMembers = [
  { id:1, name:'Arif Rahman',   email:'arif@legacya.co',  role:'Owner',   branch:'Kemang', status:'active',   avatar:'AR', avatarBg:'from-primary to-primary-deep' },
  { id:2, name:'Sari Wijaya',   email:'sari@legacya.co',  role:'Manager', branch:'Kemang', status:'active',   avatar:'SW', avatarBg:'from-warning to-warning-text' },
  { id:3, name:'Dewi Lestari',  email:'dewi@legacya.co',  role:'Cashier', branch:'Kemang', status:'active',   avatar:'DL', avatarBg:'from-success to-success-text' },
  { id:4, name:'Rizki Pratama', email:'rizki@legacya.co', role:'Cashier', branch:'Kemang', status:'active',   avatar:'RP', avatarBg:'from-primary-light to-primary-deep' },
  { id:5, name:'Budi Santoso',  email:'budi@legacya.co',  role:'Kitchen', branch:'Kemang', status:'active',   avatar:'BS', avatarBg:'from-danger to-danger-text' },
  { id:6, name:'Indah Permata', email:'indah@legacya.co', role:'Kitchen', branch:'Kemang', status:'inactive', avatar:'IP', avatarBg:'from-ink-muted to-ink-soft' },
];

const roleMeta = {
  Owner:   { tone:'primary' },
  Manager: { tone:'warning' },
  Cashier: { tone:'success' },
  Kitchen: { tone:'danger' },
};

const OptionRow = ({ label, desc, checked, onChange }) => (
  <div className="flex items-start justify-between gap-3 py-1">
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-ink">{label}</p>
      <p className="text-[11.5px] text-ink-muted mt-0.5">{desc}</p>
    </div>
    <Switch checked={checked} onChange={onChange}/>
  </div>
);

const UsageStat = ({ label, value, pct }) => (
  <div>
    <p className="text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider mb-1">{label}</p>
    <p className="text-[14px] font-bold text-ink tabular-nums mb-1.5" style={{ fontFamily:'Plus Jakarta Sans' }}>{value}</p>
    <div className="h-1.5 rounded-full bg-surface overflow-hidden">
      <div className="h-full rounded-full bg-primary" style={{ width:`${pct}%` }}/>
    </div>
  </div>
);

const SecurityRow = ({ icon:Icon, title, desc, action, enabled }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 hover:bg-surface transition-colors">
    <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center text-primary-text shrink-0">
      <Icon size={15} strokeWidth={2.2}/>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
        {title}
        {enabled && <Badge tone="success" size="sm" dot>On</Badge>}
      </p>
      <p className="text-[11.5px] text-ink-muted mt-0.5">{desc}</p>
    </div>
    <button className="text-[12px] font-bold text-primary-text hover:text-ink transition-colors">{action} →</button>
  </div>
);

const StoreProfileSection = ({ form, setForm }) => (
  <div className="space-y-4">
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <Building2 size={16} className="text-primary-text"/>
        <h3 className="text-[14px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Business information</h3>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Business name" value={form.businessName} onChange={e => setForm({ ...form, businessName:e.target.value })}/>
          <Input label="Brand handle" prefix="@" value={form.handle} onChange={e => setForm({ ...form, handle:e.target.value })}/>
        </div>
        <Input label="Address" value={form.address} onChange={e => setForm({ ...form, address:e.target.value })}/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Phone"   prefix="+62" value={form.phone}   onChange={e => setForm({ ...form, phone:e.target.value })}/>
          <Input label="Email"   value={form.email}   onChange={e => setForm({ ...form, email:e.target.value })}/>
          <Input label="Website" value={form.website} onChange={e => setForm({ ...form, website:e.target.value })}/>
        </div>
      </div>
    </Card>

    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <Clock size={16} className="text-primary-text"/>
        <h3 className="text-[14px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Hours & locale</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Opens at"  suffix="WIB" value="10:00" onChange={() => {}}/>
        <Input label="Closes at" suffix="WIB" value="22:00" onChange={() => {}}/>
        <div>
          <label className="block text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Currency</label>
          <button className="w-full h-10 px-3.5 rounded-lg bg-card border border-line text-[13.5px] text-ink font-medium flex items-center justify-between hover:bg-app">
            IDR — Indonesian Rupiah <ChevronRight size={14} className="text-ink-muted"/>
          </button>
        </div>
      </div>
    </Card>

    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <Receipt size={16} className="text-primary-text"/>
        <h3 className="text-[14px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Tax & service</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Tax rate"       suffix="%" value="10" onChange={() => {}}/>
        <Input label="Service charge" suffix="%" value="5"  onChange={() => {}}/>
      </div>
      <div className="mt-4 p-3 rounded-lg bg-app flex items-start gap-2.5">
        <Info size={14} className="text-ink-muted mt-0.5"/>
        <p className="text-[12px] text-ink-soft leading-relaxed">
          Tax and service charges will be calculated automatically on each order. PPN is set per Indonesian regulation.
        </p>
      </div>
    </Card>
  </div>
);

const PaymentSection = () => {
  const [methods, setMethods] = useState([
    { id:'qris', label:'QRIS',           icon:QrCode,     fee:0.7, enabled:true,  description:'All Indonesian e-wallet & bank QR' },
    { id:'card', label:'Debit/Credit',   icon:CreditCard, fee:2.5, enabled:true,  description:'Visa, Mastercard, JCB via card terminal' },
    { id:'cash', label:'Cash',           icon:Banknote,   fee:0,   enabled:true,  description:'Physical cash with change calculator' },
    { id:'ewal', label:'E-Wallet',       icon:Wallet,     fee:1.5, enabled:true,  description:'GoPay, OVO, DANA direct integration' },
    { id:'bank', label:'Bank Transfer',  icon:Building2,  fee:0,   enabled:false, description:'Manual transfer verification' },
  ]);
  const toggle = (id) => setMethods(prev => prev.map(m => m.id===id ? { ...m, enabled:!m.enabled } : m));

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-line-soft flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Accepted payment methods</h3>
          <p className="text-[11.5px] text-ink-muted mt-0.5">Enable methods customers can use at checkout</p>
        </div>
        <Badge tone="success" dot>{methods.filter(m => m.enabled).length} active</Badge>
      </div>
      <div className="divide-y divide-surface">
        {methods.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2 transition-colors">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${m.enabled ? 'bg-primary-soft text-primary-text' : 'bg-surface text-ink-muted'}`}>
                <Icon size={18} strokeWidth={2.2}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-[14px] font-bold ${m.enabled ? 'text-ink' : 'text-ink-muted'}`}>{m.label}</p>
                  {m.fee > 0  && <Badge tone="neutral" size="sm">{m.fee}% fee</Badge>}
                  {m.fee === 0 && <Badge tone="success" size="sm">No fee</Badge>}
                </div>
                <p className="text-[12px] text-ink-muted mt-0.5">{m.description}</p>
              </div>
              <Switch checked={m.enabled} onChange={() => toggle(m.id)}/>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const ReceiptSection = ({ form, setForm }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <Pencil size={16} className="text-primary-text"/>
          <h3 className="text-[14px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Receipt content</h3>
        </div>
        <div className="space-y-4">
          <Input label="Header line 1" value={form.receiptHeader1} onChange={e => setForm({ ...form, receiptHeader1:e.target.value })}/>
          <Input label="Header line 2" value={form.receiptHeader2} onChange={e => setForm({ ...form, receiptHeader2:e.target.value })}/>
          <Textarea label="Footer message" hint="Shown at the bottom of every receipt" rows={3}
            value={form.receiptFooter} onChange={e => setForm({ ...form, receiptFooter:e.target.value })}/>
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={16} className="text-primary-text"/>
          <h3 className="text-[14px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Display options</h3>
        </div>
        <div className="space-y-3">
          <OptionRow label="Show logo"          desc="Print store logo on receipt"            checked={form.showLogo}    onChange={v => setForm({ ...form, showLogo:v })}/>
          <OptionRow label="Show tax breakdown" desc="Itemize PPN on each receipt"            checked={form.showTax}     onChange={v => setForm({ ...form, showTax:v })}/>
          <OptionRow label="Show QR feedback"   desc="QR code linking to review form"         checked={form.showQR}      onChange={v => setForm({ ...form, showQR:v })}/>
          <OptionRow label="Auto-print"         desc="Print receipt automatically after payment" checked={form.autoPrint} onChange={v => setForm({ ...form, autoPrint:v })}/>
        </div>
      </Card>
    </div>

    <div className="lg:sticky lg:top-6 self-start">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-primary-text"/>
            <h3 className="text-[13px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Live preview</h3>
          </div>
          <Badge tone="primary" dot size="sm">Updates instantly</Badge>
        </div>
        <div className="relative bg-surface-3 rounded-xl p-1" style={{ boxShadow:'var(--shadow-md)' }}>
          <div className="bg-card px-6 py-5 font-mono text-[11px] text-ink leading-relaxed" style={{ fontFamily:'ui-monospace, monospace' }}>
            {form.showLogo && (
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center text-white font-bold text-[14px]">L</div>
              </div>
            )}
            <p className="text-center font-bold text-[13px] tracking-wide">{form.receiptHeader1 || ' '}</p>
            <p className="text-center text-[10px] text-ink-soft mb-2">{form.receiptHeader2 || ' '}</p>
            <div className="border-t border-dashed border-ink-muted my-2"/>
            <div className="flex justify-between text-[10px] text-ink-soft">
              <span>ORD-1052</span><span>Table 7</span>
            </div>
            <div className="flex justify-between text-[10px] text-ink-soft">
              <span>20 May 2026</span><span>11:48 WIB</span>
            </div>
            <div className="border-t border-dashed border-ink-muted my-2"/>
            <div className="space-y-1">
              <div className="flex justify-between"><span>2× Chicken Mentai Bowl</span><span className="tabular-nums">116,000</span></div>
              <div className="flex justify-between"><span>1× Iced Matcha Latte</span><span className="tabular-nums">27,000</span></div>
            </div>
            <div className="border-t border-dashed border-ink-muted my-2"/>
            <div className="flex justify-between text-[10px]"><span>Subtotal</span><span className="tabular-nums">143,000</span></div>
            {form.showTax && <div className="flex justify-between text-[10px]"><span>PPN 10%</span><span className="tabular-nums">14,300</span></div>}
            <div className="flex justify-between text-[10px]"><span>Service 5%</span><span className="tabular-nums">7,150</span></div>
            <div className="border-t border-tooltip my-1.5"/>
            <div className="flex justify-between font-bold text-[13px]"><span>TOTAL</span><span className="tabular-nums">Rp 164,450</span></div>
            <div className="border-t border-dashed border-ink-muted my-2"/>
            <p className="text-center text-[10px] leading-relaxed">{form.receiptFooter || ' '}</p>
            {form.showQR && (
              <div className="flex justify-center mt-3">
                <div className="w-14 h-14 bg-tooltip rounded grid grid-cols-5 grid-rows-5 gap-px p-1">
                  {Array.from({ length:25 }).map((_, i) => (
                    <div key={i} className="bg-card" style={{ opacity: (i * 7 + 3) % 2 === 0 ? 1 : 0 }}/>
                  ))}
                </div>
              </div>
            )}
            <p className="text-center text-[9px] text-ink-muted mt-2">Scan to leave a review</p>
          </div>
          <div className="h-3 bg-card relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 flex justify-center gap-1 px-2">
              {Array.from({ length:30 }).map((_, i) => <div key={i} className="w-1.5 h-3 bg-surface-3" style={{ transform:'translateY(-50%) rotate(45deg)' }}/>)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

const TeamSection = () => (
  <Card className="overflow-hidden">
    <div className="px-5 py-4 border-b border-line-soft flex items-center justify-between">
      <div>
        <h3 className="text-[14px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Team members</h3>
        <p className="text-[11.5px] text-ink-muted mt-0.5">{teamMembers.length} members · {teamMembers.filter(m => m.status==='active').length} active</p>
      </div>
      <Button variant="primary" size="sm" icon={Plus}>Invite member</Button>
    </div>
    <table className="w-full">
      <thead>
        <tr className="text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
          <th className="text-left px-5 py-2.5">Member</th>
          <th className="text-left px-3 py-2.5">Role</th>
          <th className="text-left px-3 py-2.5">Branch</th>
          <th className="text-left px-3 py-2.5">Status</th>
          <th className="text-right px-5 py-2.5"></th>
        </tr>
      </thead>
      <tbody>
        {teamMembers.map(m => (
          <tr key={m.id} className="text-[13px] hover:bg-surface-2 transition-colors border-t border-surface">
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${m.avatarBg} flex items-center justify-center text-white font-bold text-[12px] shrink-0`}>
                  {m.avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink flex items-center gap-1.5">
                    {m.name}
                    {m.role==='Owner' && <Crown size={11} className="text-warning"/>}
                  </p>
                  <p className="text-[11px] text-ink-muted truncate">{m.email}</p>
                </div>
              </div>
            </td>
            <td className="px-3 py-3.5"><Badge tone={roleMeta[m.role].tone}>{m.role}</Badge></td>
            <td className="px-3 py-3.5 text-ink-soft">
              <span className="flex items-center gap-1"><MapPin size={11}/> {m.branch}</span>
            </td>
            <td className="px-3 py-3.5">
              <Badge tone={m.status==='active' ? 'success' : 'neutral'} dot>{m.status==='active' ? 'Active' : 'Inactive'}</Badge>
            </td>
            <td className="px-5 py-3.5 text-right">
              <div className="inline-flex items-center gap-1">
                <button className="w-7 h-7 rounded-md hover:bg-surface flex items-center justify-center text-ink-soft"><Pencil size={13}/></button>
                <button className="w-7 h-7 rounded-md hover:bg-surface flex items-center justify-center text-ink-muted"><MoreHorizontal size={14}/></button>
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
    <Card className="overflow-hidden relative">
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary-soft opacity-60"/>
      <div className="absolute -bottom-16 -right-4 w-32 h-32 rounded-full bg-primary-soft opacity-30"/>
      <div className="relative p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Badge tone="primary" dot>Pro Plan</Badge>
            <h3 className="mt-2 text-[20px] font-bold text-ink tracking-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>
              Rp 499,000 <span className="text-[14px] font-medium text-ink-soft">/ month</span>
            </h3>
            <p className="text-[12.5px] text-ink-soft mt-1">Renews May 28, 2026 · Visa ending 4242</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md">Manage billing</Button>
            <Button variant="primary"   size="md">Upgrade plan</Button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <UsageStat label="Branches"   value="1 / 3"       pct={33}/>
          <UsageStat label="Team seats" value="6 / 10"      pct={60}/>
          <UsageStat label="Storage"    value="2.4 / 50 GB" pct={5}/>
          <UsageStat label="API calls"  value="8.2K / 50K"  pct={16}/>
        </div>
      </div>
    </Card>

    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <CircleUserRound size={16} className="text-primary-text"/>
        <h3 className="text-[14px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Profile</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Full name" value="Arif Rahman"    onChange={() => {}}/>
        <Input label="Email"     value="arif@legacya.co" onChange={() => {}}/>
        <Input label="Phone"     prefix="+62" value="812-3456-7890" onChange={() => {}}/>
        <div>
          <label className="block text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Language</label>
          <button className="w-full h-10 px-3.5 rounded-lg bg-card border border-line text-[13.5px] text-ink font-medium flex items-center justify-between hover:bg-app">
            🇮🇩 Bahasa Indonesia <ChevronRight size={14} className="text-ink-muted"/>
          </button>
        </div>
      </div>
    </Card>

    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <KeyRound size={16} className="text-primary-text"/>
        <h3 className="text-[14px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Security</h3>
      </div>
      <div className="space-y-3">
        <SecurityRow icon={KeyRound}    title="Password"        desc="Last changed 3 months ago"           action="Change"/>
        <SecurityRow icon={ShieldCheck} title="Two-factor auth" desc="SMS to •••• 7890"                    action="Manage" enabled/>
        <SecurityRow icon={Smartphone}  title="Active sessions" desc="2 devices currently signed in"       action="View all"/>
      </div>
    </Card>
  </div>
);

const PlaceholderSection = ({ section }) => (
  <Card className="p-10 text-center">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-soft flex items-center justify-center mb-4">
      <section.icon size={22} className="text-primary-text" strokeWidth={2}/>
    </div>
    <h3 className="text-[18px] font-bold text-ink mb-1.5" style={{ fontFamily:'Plus Jakarta Sans' }}>{section.label}</h3>
    <p className="text-[13.5px] text-ink-soft leading-relaxed max-w-md mx-auto">This section uses the same patterns — wire up state and forms when ready.</p>
  </Card>
);

const SettingsView = () => {
  const [activeSection, setActiveSection] = useState('store');

  const [originalForm] = useState({
    businessName:'Legacya Kemang', handle:'legacya.kemang',
    address:'Jl. Kemang Raya No. 42, Jakarta Selatan',
    phone:'21-7180-1234', email:'hello@legacya.co', website:'legacya.co',
    receiptHeader1:'LEGACYA KEMANG', receiptHeader2:'Jl. Kemang Raya No. 42 · Jakarta',
    receiptFooter:'Terima kasih atas kunjungan Anda\nFollow @legacya.kemang',
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
      default:        return <PlaceholderSection section={active}/>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      <aside className="lg:sticky lg:top-6 self-start">
        <nav className="space-y-5">
          {Object.entries(sectionsByGroup).map(([group, sections]) => (
            <div key={group}>
              <p className="px-2 mb-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider">{group}</p>
              <div className="space-y-0.5">
                {sections.map(s => {
                  const Icon = s.icon;
                  const isActive = activeSection===s.id;
                  return (
                    <button key={s.id} onClick={() => setActiveSection(s.id)}
                      className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        isActive ? 'bg-primary-soft text-primary-text' : 'text-ink-soft hover:bg-surface hover:text-ink'
                      }`}>
                      {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary"/>}
                      <Icon size={15} strokeWidth={isActive ? 2.4 : 2}/>
                      <span className="flex-1 text-left">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className={`min-w-0 ${isDirty ? 'pb-20' : ''}`}>
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-[20px] font-bold text-ink tracking-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>
              {active?.label}
            </h2>
            <p className="text-[12.5px] text-ink-muted">Configure {active?.label.toLowerCase()}</p>
          </div>
        </div>
        {renderSection()}
      </div>

      {isDirty && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-tooltip text-white px-4 py-2.5 rounded-2xl"
          style={{ boxShadow:'var(--shadow-lg)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse"/>
            <span className="text-[12.5px] font-semibold">Unsaved changes</span>
          </div>
          <button onClick={() => setForm(originalForm)} className="text-[12.5px] font-semibold text-white/70 hover:text-white px-2 transition-colors">
            Discard
          </button>
          <Button variant="success" size="sm" icon={Save}>Save changes</Button>
        </div>
      )}
    </div>
  );
};

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <SettingsView />
      </div>
    </div>
  );
}
