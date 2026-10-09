import React, { useState, useEffect } from 'react';
import { Building2, LayoutDashboard, Users, Zap, UserPlus, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  openExpressModal, 
  openNewCheckInModal, 
  openPoliceModal,
  occupancyStats 
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-bold tracking-tight text-slate-900">StayLog</h1>
              <Badge variant="indigo" className="font-mono text-[10px] tracking-wider uppercase">PRO</Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium">Hotel Guest & Police Verification Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button 
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard className="h-4 w-4" /> Live Rooms Dashboard
          </button>
          <button 
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'ledger' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('ledger')}
          >
            <Users className="h-4 w-4" /> Repeat Guests Ledger
          </button>
        </div>

        {/* Action Buttons & Clock */}
        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end rounded-lg bg-slate-50 px-3 py-1 border border-slate-200 md:flex">
            <span className="font-mono text-xs font-bold text-slate-800">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[10px] text-slate-500">
              {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <Button variant="express" onClick={openExpressModal} className="animate-pulse">
            <Zap className="h-4 w-4" /> Express Check-In (&lt;10s)
          </Button>

          <Button variant="primary" onClick={openNewCheckInModal}>
            <UserPlus className="h-4 w-4" /> New Guest
          </Button>

          <Button variant="police" onClick={openPoliceModal}>
            <ShieldAlert className="h-4 w-4 text-emerald-400" /> Police Register
          </Button>
        </div>
      </div>
    </header>
  );
}
