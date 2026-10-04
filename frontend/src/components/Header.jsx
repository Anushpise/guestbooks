import React from 'react';
import { LogOut, Zap, UserPlus, ShieldCheck, ChevronRight } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Header({
  user,
  onLogout,
  activeTab,
  setActiveTab,
  openExpressModal,
  openNewCheckInModal,
  openPoliceModal,
  showPoliceOption = false
}) {
  const role = user?.role || 'HOTEL';

  const ROLE_CONFIG = {
    ADMIN:  { label: 'Super Admin',         bg: 'bg-amber-500',   dot: 'bg-amber-400' },
    POLICE: { label: 'Police Inspector',    bg: 'bg-indigo-600',  dot: 'bg-indigo-400' },
    HOTEL:  { label: 'Property Owner',      bg: 'bg-emerald-600', dot: 'bg-emerald-400' },
  };

  const TAB_TITLES = {
    'dashboard':       'Live Rooms Matrix',
    'express-checkin': 'Express Check-In',
    'new-checkin':     'New Guest Registration',
    'ledger':          'Frequent Guest Ledger',
    'police-log':      'Police Log',
    'billing':         'Billing & Receipts',
    'room-mgmt':       'Room Status & Tariffs',
    'admin-approvals': 'Guestbooks Document Approvals',
    'police-portal':   'Police Station Portal',
  };

  const { label: roleLabel, bg: roleBg, dot: roleDot } = ROLE_CONFIG[role] || ROLE_CONFIG.HOTEL;
  const tabTitle = TAB_TITLES[activeTab] || 'Portal';
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'US';

  return (
    <header
      className="sticky top-0 z-30 flex h-14 w-full items-center justify-between px-6 border-b"
      style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(16px)',
        borderColor: 'rgba(226,232,240,0.8)',
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
      }}
    >
      {/* Brand + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <img 
          src={logoImg} 
          alt="Guestbooks Logo" 
          className="h-8 w-auto object-contain bg-white rounded-lg p-0.5 border border-slate-200"
        />

        <div className="flex items-center gap-2">
          <h1
            className="text-base font-black tracking-tight text-teal-900"
            style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.04em' }}
          >
            GUESTBOOKS
          </h1>
          {/* Role pill */}
          <span className={`${roleBg} text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1`}>
            <span className={`h-1.5 w-1.5 rounded-full ${roleDot} animate-pulse`} />
            {roleLabel}
          </span>
        </div>

        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

        {/* Current page breadcrumb */}
        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
          {tabTitle}
        </span>
      </div>

      {/* Actions + User */}
      <div className="flex items-center gap-2">
        {role === 'HOTEL' && (
          <>
            <button
              onClick={openExpressModal}
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-slate-900 transition-all active:scale-95 shadow-sm"
            >
              <Zap className="h-3.5 w-3.5" /> Express
            </button>
            <button
              onClick={openNewCheckInModal}
              className="hidden md:flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-[11px] font-bold text-white transition-all active:scale-95 shadow-sm shadow-indigo-200"
            >
              <UserPlus className="h-3.5 w-3.5" /> New Guest
            </button>
            {showPoliceOption && (
              <button
                onClick={openPoliceModal}
                className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700 transition-all"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" /> Police Log
              </button>
            )}
            <div className="mx-1 h-5 w-px bg-slate-200" />
          </>
        )}

        {/* User / Hotel Name pill */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 pl-1 pr-3.5 py-1 shadow-xs">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full font-black text-white text-[11px] shadow-2xs"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #059669)' }}
          >
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold text-slate-900 max-w-[160px] truncate leading-tight">
              {user?.name || 'Hotel Management'}
            </span>
            {user?.stationName && (
              <span className="text-[9px] font-semibold text-indigo-600 truncate">{user.stationName}</span>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-lg p-1.5 text-[11px] font-bold text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

