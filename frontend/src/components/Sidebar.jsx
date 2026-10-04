import React, { useState } from 'react';
import {
  LayoutDashboard, Zap, UserPlus, ShieldAlert, Users, Receipt,
  FileCheck, Building2, ChevronDown, ChevronRight, SlidersHorizontal,
  Lock, BedDouble, TrendingUp, Menu, Database, Settings
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Sidebar({
  user,
  hotel,
  activeTab,
  setActiveTab,
  openExpressModal,
  openNewCheckInModal,
  openPoliceModal,
  occupiedCount = 0,
  totalRooms = 15,
  showPoliceOption = false
}) {
  const role = user?.role || 'HOTEL';
  const [openWorkflow,   setOpenWorkflow]   = useState(true);
  const [openRecords,    setOpenRecords]    = useState(true);
  const [openCompliance, setOpenCompliance] = useState(true);

  // occupancy percentage ring colour
  const pct = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  const NavItem = ({ tab, icon: Icon, label, badge, accent = 'indigo' }) => {
    const active = activeTab === tab;
    const accentMap = {
      indigo:  { bg: 'bg-indigo-600',  text: 'text-indigo-400',  glow: 'shadow-indigo-900/60' },
      emerald: { bg: 'bg-emerald-600', text: 'text-emerald-400', glow: 'shadow-emerald-900/60' },
      amber:   { bg: 'bg-amber-600',   text: 'text-amber-400',   glow: 'shadow-amber-900/60' },
    };
    const { bg, text, glow } = accentMap[accent] || accentMap.indigo;

    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`nav-item group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
          active
            ? `${bg} text-white shadow-lg ${glow} ${active ? 'active' : ''}`
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-white' : text}`} />
          <span className="truncate font-[550]">{label}</span>
        </div>
        {badge && (
          <span className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${
            active ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'
          }`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  const SectionHeader = ({ icon: Icon, label, open, onToggle, color = 'text-indigo-400' }) => (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span>{label}</span>
      </div>
      {open
        ? <ChevronDown className="h-3 w-3" />
        : <ChevronRight className="h-3 w-3" />
      }
    </button>
  );

  return (
    <aside className="fixed left-0 top-14 bottom-0 z-40 flex w-64 flex-col sidebar-glow-accent" style={{
      background: 'linear-gradient(160deg, #0d0d1a 0%, #0f0f23 60%, #0b1120 100%)',
      borderRight: '1px solid rgba(99,102,241,0.12)'
    }}>

      {/* Brand Header with Logo */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-3 border-b border-white/5 bg-white/[0.02]">
        <img 
          src={logoImg} 
          alt="Guestbooks Logo" 
          className="h-9 w-auto object-contain bg-white p-1 rounded-xl shadow-md"
        />
        <div>
          <span className="text-sm font-black tracking-tight text-white block leading-none font-heading">
            GUESTBOOKS
          </span>
          <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest mt-1 block">
            Stay & Guest Registry
          </span>
        </div>
      </div>

      {/* Occupancy pill at top */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-indigo-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Occupancy</p>
              <p className="text-base font-black text-white leading-none">
                {occupiedCount}
                <span className="text-sm font-semibold text-slate-500">/{totalRooms}</span>
              </p>
            </div>
          </div>
          {/* Mini ring indicator */}
          <div className="relative h-10 w-10">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={pct > 80 ? '#f43f5e' : pct > 50 ? '#f59e0b' : '#6366f1'}
                strokeWidth="3.5"
                strokeDasharray={`${pct * 0.942} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">

        {/* PROPERTY OWNER */}
        {role === 'HOTEL' && (
          <>
            {/* Guest Workflow */}
            <div className="space-y-0.5">
              <SectionHeader icon={Zap} label="Guest Workflow" open={openWorkflow} onToggle={() => setOpenWorkflow(!openWorkflow)} color="text-indigo-400" />
              {openWorkflow && (
                <div className="space-y-0.5 pl-1">
                  <NavItem tab="dashboard"       icon={LayoutDashboard} label="Live Rooms Matrix" badge={`${occupiedCount}/${totalRooms}`} accent="indigo" />
                  <NavItem tab="express-checkin" icon={Zap}             label="Express Check-In"  badge="<10s" accent="indigo" />
                  <NavItem tab="new-checkin"     icon={UserPlus}        label="New Guest Registration" accent="indigo" />
                </div>
              )}
            </div>

            <div className="h-px bg-white/5 mx-2" />

            {/* Records */}
            <div className="space-y-0.5">
              <SectionHeader icon={Users} label="Records & Ledger" open={openRecords} onToggle={() => setOpenRecords(!openRecords)} color="text-emerald-400" />
              {openRecords && (
                <div className="space-y-0.5 pl-1">
                  <NavItem tab="database" icon={Database} label="Guest Database" badge="SQL" accent="emerald" />
                  <NavItem tab="ledger"   icon={Users}    label="Frequent Guest Ledger" accent="emerald" />
                  <NavItem tab="billing"  icon={Receipt}  label="Billing & Receipts"    accent="emerald" />
                </div>
              )}
            </div>

            <div className="h-px bg-white/5 mx-2" />

            {/* Controls */}
            <div className="space-y-0.5">
              <SectionHeader icon={Settings} label="Room & System Controls" open={openCompliance} onToggle={() => setOpenCompliance(!openCompliance)} color="text-amber-400" />
              {openCompliance && (
                <div className="space-y-0.5 pl-1">
                  <NavItem tab="room-mgmt"  icon={SlidersHorizontal} label="Room Status & Tariffs" accent="indigo" />
                  {showPoliceOption && (
                    <NavItem tab="police-log" icon={FileCheck} label="Police Log (Secret)" accent="indigo" />
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* POLICE */}
        {role === 'POLICE' && (
          <div className="space-y-0.5">
            <div className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5" />
              Police Inspection Portal
            </div>
            <NavItem tab="police-portal" icon={Building2} label="Area Guestbooks & Occupancy" accent="indigo" />
          </div>
        )}

        {/* ADMIN */}
        {role === 'ADMIN' && (
          <div className="space-y-0.5">
            <div className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              Super Admin Controls
            </div>
            <NavItem tab="admin-approvals" icon={Lock} label="Guestbooks Approvals" accent="amber" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white leading-none">{hotel?.name || user?.name || 'Guestbooks'}</p>
            <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
              {role === 'HOTEL' ? (hotel?.id ? `${hotel.id} • ${hotel.ownerName}` : 'Property Owner') : role === 'POLICE' ? 'Police Inspector' : 'Super Admin'}
            </p>
          </div>
          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}

