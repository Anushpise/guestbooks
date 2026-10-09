import React from 'react';
import { LogOut, Zap, QrCode } from 'lucide-react';

export default function Header({
  user,
  hotel,
  onLogout,
  activeTab,
  openExpressModal,
  openCounterQRModal,
}) {
  const role = user?.role || 'HOTEL';

  const TAB_TITLES = {
    'dashboard':       'Live Rooms Matrix',
    'express-checkin': 'Express Check-In',
    'new-checkin':     'New Guest Registration',
    'ledger':          'Frequent Guest Ledger',
    'police-log':      'Police Log Archive',
    'billing':         'Billing & Receipts',
    'room-mgmt':       'Room Status & Tariffs',
    'admin-approvals': 'Super Admin Approvals',
    'police-portal':   'Police Inspection Portal',
  };

  const tabTitle = TAB_TITLES[activeTab] || 'Dashboard';
  const displayName = hotel?.name || user?.name || 'Hotel Management';
  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : 'HM';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-6 sm:px-8 border-b border-slate-200/80 bg-white/95 backdrop-blur-md select-none">
      {/* Current Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 font-heading tracking-tight">
          {tabTitle}
        </h1>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-[#0b3c33]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {hotel?.id || 'HTL-101'}
        </span>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {role === 'HOTEL' && (
          <>
            <button
              onClick={openExpressModal}
              className="flex items-center gap-2 rounded-xl bg-[#0b3c33] hover:bg-[#072620] px-4 py-2 text-xs font-extrabold text-white transition-all cursor-pointer shadow-xs font-heading active:scale-95"
            >
              <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
              <span>Express Check-In</span>
            </button>

            <button
              onClick={openCounterQRModal}
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 px-3 py-2 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              title="Front-Desk QR Code"
            >
              <QrCode className="h-3.5 w-3.5 text-[#0b3c33]" />
              <span>Desk QR</span>
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
          </>
        )}

        {/* User Badge */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full font-bold text-white text-[10px] bg-[#0b3c33]">
            {initials}
          </div>
          <span className="text-xs font-bold text-slate-800 max-w-[130px] truncate font-heading">
            {displayName}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
          title="Logout"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}


