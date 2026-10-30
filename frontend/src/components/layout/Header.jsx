import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Zap, QrCode, Bell, Clock, AlertTriangle, CheckCircle2, ChevronRight, X, Menu } from 'lucide-react';
import { getStayExpiryStatus } from '../../lib/dateUtils';

export default function Header({
  user,
  hotel,
  onLogout,
  activeTab,
  openExpressModal,
  openCounterQRModal,
  activeStays = [],
  onCheckOut,
  onToggleSidebar,
}) {
  const role = user?.role || 'HOTEL';
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    }
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

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

  // Analyze active stays for checkout time notifications
  const staysWithStatus = (activeStays || []).map(stay => ({
    stay,
    status: getStayExpiryStatus(stay),
  }));

  const overdueList = staysWithStatus.filter(s => s.status.isOverdue);
  const dueSoonList = staysWithStatus.filter(s => s.status.isDueSoon);
  const alertCount = overdueList.length + dueSoonList.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-3.5 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white/95 backdrop-blur-md select-none">
      {/* Current Page Title & Responsive Sidebar Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0 active:scale-95"
          aria-label="Toggle navigation menu"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5 text-[#0b3c33]" />
        </button>

        <h1 className="text-sm sm:text-base lg:text-xl font-extrabold text-slate-900 font-heading tracking-tight truncate">
          {tabTitle}
        </h1>
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-[#0b3c33] shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {hotel?.id || 'HTL-101'}
        </span>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {role === 'HOTEL' && (
          <>
            {/* Real-time Checkout Expiry Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`relative flex items-center justify-center h-9 w-9 rounded-xl border transition-all cursor-pointer ${
                  overdueList.length > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-xs'
                    : dueSoonList.length > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title={
                  overdueList.length > 0
                    ? `${overdueList.length} Room(s) Checkout Time Expired!`
                    : dueSoonList.length > 0
                    ? `${dueSoonList.length} Room(s) Checkout Due Soon`
                    : 'Checkout Notifications'
                }
              >
                <Bell className={`h-4 w-4 ${overdueList.length > 0 ? 'animate-bounce text-rose-600' : ''}`} />
                {overdueList.length > 0 ? (
                  <>
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[9.5px] font-black text-white ring-2 ring-white">
                      {overdueList.length}
                    </span>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 rounded-full bg-rose-500 opacity-75 animate-ping" />
                  </>
                ) : dueSoonList.length > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-[9.5px] font-black text-white ring-2 ring-white">
                    {dueSoonList.length}
                  </span>
                ) : null}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/80">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#0b3c33]" />
                      <span className="font-heading text-xs font-bold text-slate-900">
                        Checkout Expiry Alerts
                      </span>
                      {alertCount > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                          overdueList.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {alertCount}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Dropdown List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {alertCount === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                        <p className="font-bold text-slate-700">All Rooms On Schedule</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          No rooms have exceeded their stay time period.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Overdue Checkouts */}
                        {overdueList.map(({ stay, status }) => (
                          <div
                            key={stay.id}
                            className="p-3.5 bg-rose-50/40 hover:bg-rose-50/70 transition-colors flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs px-2 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-200">
                                  RM-{stay.roomNumber}
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                  {stay.primaryGuest?.name || 'Guest'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span>{status.statusBadgeText}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Package: {stay.stayType || 'Stay'} • Due: {status.expectedFormatted}
                              </div>
                            </div>

                            {onCheckOut && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNotificationsOpen(false);
                                  onCheckOut(stay.id);
                                }}
                                className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
                              >
                                Check Out
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Due Soon Checkouts */}
                        {dueSoonList.map(({ stay, status }) => (
                          <div
                            key={stay.id}
                            className="p-3.5 bg-amber-50/30 hover:bg-amber-50/60 transition-colors flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200">
                                  RM-{stay.roomNumber}
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                  {stay.primaryGuest?.name || 'Guest'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>{status.statusBadgeText}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Package: {stay.stayType || 'Stay'} • Due: {status.expectedFormatted}
                              </div>
                            </div>

                            {onCheckOut && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNotificationsOpen(false);
                                  onCheckOut(stay.id);
                                }}
                                className="shrink-0 bg-slate-900 hover:bg-black text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                Check Out
                              </button>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={openExpressModal}
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-[#0b3c33] hover:bg-[#072620] px-2.5 sm:px-4 py-2 text-xs font-extrabold text-white transition-all cursor-pointer shadow-xs font-heading active:scale-95 shrink-0"
            >
              <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300 shrink-0" />
              <span className="hidden sm:inline">Express Check-In</span>
              <span className="sm:hidden">Express</span>
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
