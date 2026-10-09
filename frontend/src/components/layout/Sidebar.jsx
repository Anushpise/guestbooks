import React, { useState } from 'react';
import {
  HiOutlineSquares2X2,
  HiOutlineBolt,
  HiOutlineUserPlus,
  HiOutlineCircleStack,
  HiOutlineUsers,
  HiOutlineReceiptPercent,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineShieldCheck,
  HiOutlineBuildingOffice2,
  HiOutlineLockClosed,
  HiOutlineChevronDown,
  HiOutlineChevronRight
} from 'react-icons/hi2';
import logoImg from '../../assets/logo.png';

export default function Sidebar({
  user,
  hotel,
  activeTab,
  setActiveTab,
  occupiedCount = 0,
  totalRooms = 15,
  showPoliceOption = false
}) {
  const role = user?.role || 'HOTEL';
  const [openWorkflow, setOpenWorkflow] = useState(true);
  const [openRecords, setOpenRecords] = useState(true);
  const [openControls, setOpenControls] = useState(true);

  const NavItem = ({ tab, icon: Icon, label }) => {
    const active = activeTab === tab;

    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`group flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm transition-all duration-150 cursor-pointer ${
          active
            ? 'bg-zinc-800 text-white font-extrabold shadow-sm'
            : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 font-semibold'
        }`}
      >
        <Icon className={`h-5 w-5 shrink-0 transition-colors ${active ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
        <span className="truncate font-heading tracking-tight text-left text-xs sm:text-sm">{label}</span>
        {active && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />}
      </button>
    );
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex w-72 flex-col bg-black text-white border-r border-zinc-800 select-none">
      
      {/* Sleek Brand Header */}
      <div className="flex items-center gap-3 px-6 h-20 border-b border-zinc-800 shrink-0">
        <img 
          src={logoImg} 
          alt="Guestbooks Logo" 
          className="h-10 w-auto object-contain"
        />
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-tight text-white leading-tight font-heading">
            GUESTBOOKS
          </span>
          <span className="text-xs font-bold text-emerald-400 tracking-widest font-heading uppercase mt-0.5">
            Digital Stay Ledger
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

        {/* HOTEL OWNER WORKFLOW */}
        {role === 'HOTEL' && (
          <>
            {/* Guest Workflow */}
            <div className="space-y-1.5">
              <div 
                onClick={() => setOpenWorkflow(!openWorkflow)} 
                className="flex items-center justify-between px-3 py-1.5 text-xs font-black uppercase tracking-wider text-zinc-400 font-heading cursor-pointer hover:text-zinc-200"
              >
                <span>Guest Workflow</span>
                {openWorkflow ? <HiOutlineChevronDown className="h-4 w-4" /> : <HiOutlineChevronRight className="h-4 w-4" />}
              </div>
              {openWorkflow && (
                <div className="space-y-1">
                  <NavItem tab="dashboard" icon={HiOutlineSquares2X2} label="Live Rooms Matrix" />
                  <NavItem tab="express-checkin" icon={HiOutlineBolt} label="Express Check-In" />
                  <NavItem tab="new-checkin" icon={HiOutlineUserPlus} label="New Guest Registration" />
                </div>
              )}
            </div>

            {/* Records & Ledger */}
            <div className="space-y-1.5">
              <div 
                onClick={() => setOpenRecords(!openRecords)} 
                className="flex items-center justify-between px-3 py-1.5 text-xs font-black uppercase tracking-wider text-zinc-400 font-heading cursor-pointer hover:text-zinc-200"
              >
                <span>Records & Ledger</span>
                {openRecords ? <HiOutlineChevronDown className="h-4 w-4" /> : <HiOutlineChevronRight className="h-4 w-4" />}
              </div>
              {openRecords && (
                <div className="space-y-1">
                  <NavItem tab="database" icon={HiOutlineCircleStack} label="Guest Database" />
                  <NavItem tab="ledger" icon={HiOutlineUsers} label="Frequent Guest Ledger" />
                  <NavItem tab="billing" icon={HiOutlineReceiptPercent} label="Billing & Receipts" />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-1.5">
              <div 
                onClick={() => setOpenControls(!openControls)} 
                className="flex items-center justify-between px-3 py-1.5 text-xs font-black uppercase tracking-wider text-zinc-400 font-heading cursor-pointer hover:text-zinc-200"
              >
                <span>System Controls</span>
                {openControls ? <HiOutlineChevronDown className="h-4 w-4" /> : <HiOutlineChevronRight className="h-4 w-4" />}
              </div>
              {openControls && (
                <div className="space-y-1">
                  <NavItem tab="room-mgmt" icon={HiOutlineAdjustmentsHorizontal} label="Room Status & Tariffs" />
                  {showPoliceOption && (
                    <NavItem tab="police-log" icon={HiOutlineShieldCheck} label="Police Log Archive" />
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* POLICE ROLE */}
        {role === 'POLICE' && (
          <div className="space-y-1.5">
            <div className="px-3 py-1.5 text-xs font-black uppercase tracking-wider text-zinc-400 font-heading">
              Police Inspection
            </div>
            <NavItem tab="police-portal" icon={HiOutlineBuildingOffice2} label="Area Occupancy Ledger" />
          </div>
        )}

        {/* ADMIN ROLE */}
        {role === 'ADMIN' && (
          <div className="space-y-1.5">
            <div className="px-3 py-1.5 text-xs font-black uppercase tracking-wider text-zinc-400 font-heading">
              Super Admin
            </div>
            <NavItem tab="admin-approvals" icon={HiOutlineLockClosed} label="Guestbooks Approvals" />
          </div>
        )}
      </div>

      {/* Minimal Bottom Footer */}
      <div className="px-5 py-4 border-t border-zinc-800 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-zinc-100 font-heading leading-tight">
            {hotel?.name || user?.name || 'Guestbooks Hotel'}
          </p>
          <p className="text-xs text-zinc-400 font-semibold truncate mt-0.5 font-mono">
            {hotel?.id || 'HTL-101'}
          </p>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-2" />
      </div>

    </aside>
  );
}
