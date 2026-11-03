import React, { useState } from 'react';
import { getStayExpiryStatus } from '../../lib/dateUtils';
import AddRoomChargeModal from '../modals/AddRoomChargeModal';
import { 
  Clock,
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  UserCheck,
  Sparkles,
  Search, 
  Receipt, 
  KeyRound,
  Plus,
  Phone,
  LayoutGrid,
  List,
  User,
  Users
} from 'lucide-react';

export default function Dashboard({ 
  rooms = [], 
  activeStays = [], 
  onCheckOut, 
  openExpressModal, 
  onRoomStatusChange,
  onViewReceipt,
  refreshData
}) {
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('hotel_dashboard_view_mode') || 'grid';
    } catch (_) {
      return 'grid';
    }
  });

  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'VACANT', 'OCCUPIED', 'CLEANING'
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddChargeModalOpen, setIsAddChargeModalOpen] = useState(false);
  const [stayForCharge, setStayForCharge] = useState(null);

  const handleOpenAddCharge = (stayObj) => {
    setStayForCharge(stayObj);
    setIsAddChargeModalOpen(true);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('hotel_dashboard_view_mode', mode);
    } catch (_) {}
  };

  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED').length;
  const vacantCount = rooms.filter(r => r.status === 'VACANT').length;
  const cleaningCount = rooms.filter(r => r.status === 'CLEANING').length;

  // Filter logic (all rooms shown together, no pagination on live room matrix)
  const filteredRooms = rooms.filter(room => {
    if (filterStatus !== 'ALL' && room.status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const stay = activeStays.find(s => s.roomNumber === room.number);
      const matchRoom = String(room.number).toLowerCase().includes(q) || (room.type || '').toLowerCase().includes(q);
      const matchGuest = stay && (
        (stay.primaryGuest?.name || '').toLowerCase().includes(q) || 
        (stay.primaryGuest?.phone || '').includes(q)
      );
      return matchRoom || matchGuest;
    }

    return true;
  });

  return (
    <div className="space-y-4 pb-12 select-none">
      
      {/* STICKY TOP STATS & CONTROLS BAR */}
      <div className="sticky top-16 z-20 bg-slate-50/95 backdrop-blur-md pt-2 pb-3 space-y-3 -mx-2 px-2 border-b border-slate-200/80">
        
        {/* 4 Interactive Stat Filter Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          
          {/* Card 1: ALL ROOMS */}
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`flex items-center justify-between rounded-xl px-4 py-2.5 transition-all cursor-pointer border ${
              filterStatus === 'ALL'
                ? 'bg-[#0b3c33] text-white border-[#0b3c33] shadow-xs'
                : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BedDouble className={`h-4.5 w-4.5 shrink-0 ${filterStatus === 'ALL' ? 'text-emerald-300' : 'text-[#0b3c33]'}`} />
              <span className={`text-xs sm:text-sm font-extrabold font-heading ${filterStatus === 'ALL' ? 'text-emerald-200' : 'text-slate-700'}`}>
                All Rooms
              </span>
            </div>
            <span className={`text-lg font-black font-heading font-mono ${filterStatus === 'ALL' ? 'text-white' : 'text-slate-900'}`}>
              {totalRooms}
            </span>
          </button>

          {/* Card 2: VACANT */}
          <button
            onClick={() => setFilterStatus('VACANT')}
            className={`flex items-center justify-between rounded-xl px-4 py-2.5 transition-all cursor-pointer border ${
              filterStatus === 'VACANT'
                ? 'bg-[#0b3c33] text-white border-[#0b3c33] shadow-xs'
                : 'bg-white text-slate-800 border-slate-200/90 hover:border-emerald-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className={`h-4.5 w-4.5 shrink-0 ${filterStatus === 'VACANT' ? 'text-emerald-300' : 'text-[#0b3c33]'}`} />
              <span className={`text-xs sm:text-sm font-extrabold font-heading ${filterStatus === 'VACANT' ? 'text-emerald-200' : 'text-[#0b3c33]'}`}>
                Vacant
              </span>
            </div>
            <span className={`text-lg font-black font-heading font-mono ${filterStatus === 'VACANT' ? 'text-white' : 'text-[#0b3c33]'}`}>
              {vacantCount}
            </span>
          </button>

          {/* Card 3: OCCUPIED */}
          <button
            onClick={() => setFilterStatus('OCCUPIED')}
            className={`flex items-center justify-between rounded-xl px-4 py-2.5 transition-all cursor-pointer border ${
              filterStatus === 'OCCUPIED'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-800 border-slate-200/90 hover:border-amber-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UserCheck className={`h-4.5 w-4.5 shrink-0 ${filterStatus === 'OCCUPIED' ? 'text-white' : 'text-amber-600'}`} />
              <span className={`text-xs sm:text-sm font-extrabold font-heading ${filterStatus === 'OCCUPIED' ? 'text-amber-100' : 'text-amber-700'}`}>
                Occupied
              </span>
            </div>
            <span className={`text-lg font-black font-heading font-mono ${filterStatus === 'OCCUPIED' ? 'text-white' : 'text-amber-700'}`}>
              {occupiedCount}
            </span>
          </button>

          {/* Card 4: HOUSEKEEPING */}
          <button
            onClick={() => setFilterStatus('CLEANING')}
            className={`flex items-center justify-between rounded-xl px-4 py-2.5 transition-all cursor-pointer border ${
              filterStatus === 'CLEANING'
                ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                : 'bg-white text-slate-800 border-slate-200/90 hover:border-orange-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className={`h-4.5 w-4.5 shrink-0 ${filterStatus === 'CLEANING' ? 'text-white' : 'text-orange-600'}`} />
              <span className={`text-xs sm:text-sm font-extrabold font-heading ${filterStatus === 'CLEANING' ? 'text-orange-100' : 'text-orange-700'}`}>
                Housekeeping
              </span>
            </div>
            <span className={`text-lg font-black font-heading font-mono ${filterStatus === 'CLEANING' ? 'text-white' : 'text-orange-700'}`}>
              {cleaningCount}
            </span>
          </button>
        </div>

        {/* Toolbar: Search input + View Switcher (Grid & List) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search room number, room type, or guest name / phone..." 
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200/90 rounded-xl text-slate-900 focus:border-[#0b3c33] outline-none font-medium shadow-2xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Mode Switcher: Grid vs List */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/90 self-end sm:self-auto shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0b3c33] shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Card Grid View (All Rooms)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid View</span>
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#0b3c33] shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table List View (All Rooms)"
            >
              <List className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>
        </div>

      </div>

      {/* CONTENT AREA: GRID VIEW OR LIST VIEW (ALL ROOMS DISPLAYED TOGETHER) */}
      {filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 text-sm font-medium shadow-2xs">
          No rooms matching current filter or search criteria.
        </div>
      ) : viewMode === 'grid' ? (
        /* ════════════════════════════════════════════════════════════════════
           1. GRID VIEW: All rooms on one screen (no page clicks)
           ════════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-1">
          {filteredRooms.map((room) => {
            const stay = activeStays.find(s => s.roomNumber === room.number);
            const expiry = stay ? getStayExpiryStatus(stay) : null;

            return (
              <div 
                key={room.id}
                className={`rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between transition-all hover:shadow-md ${
                  room.status === 'OCCUPIED' ? 'border-l-4 border-l-red-500' :
                  room.status === 'VACANT' ? 'border-l-4 border-l-emerald-500' :
                  room.status === 'CLEANING' ? 'border-l-4 border-l-orange-500' :
                  'border-l-4 border-l-slate-400'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 pb-2.5 flex items-start justify-between border-b border-slate-100 bg-slate-50/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-[#0b3c33] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg">
                        RM-{room.number}
                      </span>
                      <span className="text-[11px] font-bold uppercase text-slate-500">
                        {room.floor || '1st Floor'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-semibold mt-1">
                      {room.type}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {room.status === 'OCCUPIED' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-800 border border-rose-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                      Occupied
                    </span>
                  )}
                  {room.status === 'VACANT' && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-[#0b3c33] border border-emerald-200">
                      Vacant
                    </span>
                  )}
                  {room.status === 'CLEANING' && (
                    <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-extrabold text-orange-800 border border-orange-200">
                      Cleaning
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  
                  {/* Rate & Extras */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase">Tariff:</span>
                      <span className="font-black text-[#0b3c33] font-mono text-sm ml-1.5">
                        ₹{room.rate}
                      </span>
                    </div>

                    {room.status === 'OCCUPIED' && stay && Number(stay.extraCharges || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenAddCharge(stay)}
                        className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-md cursor-pointer transition-all shadow-2xs"
                        title="Click to view/manage extra services"
                      >
                        +₹{stay.extraCharges} extras ({stay.extraItems?.length || 1})
                      </button>
                    )}
                  </div>

                  {/* Occupied Guest Details Box */}
                  {room.status === 'OCCUPIED' && stay && (
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-slate-900 truncate leading-tight">
                            {stay.primaryGuest?.name || 'Guest'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {stay.primaryGuest?.phone || '—'}
                          </div>
                        </div>
                      </div>

                      {stay.accompanyingGuest && (
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Users className="h-3 w-3 text-emerald-600" />
                          Partner: {stay.accompanyingGuest.name}
                        </div>
                      )}

                      {/* Timing & Expiry status */}
                      <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-mono">
                          {stay.stayType || '24h Stay'}
                        </span>

                        {expiry && (
                          expiry.isOverdue ? (
                            <span className="font-black text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Overdue ({expiry.statusBadgeText})
                            </span>
                          ) : expiry.isDueSoon ? (
                            <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {expiry.statusBadgeText}
                            </span>
                          ) : (
                            <span className="font-bold text-emerald-800">
                              {expiry.statusBadgeText}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {room.status === 'VACANT' && (
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-dashed border-emerald-200 text-xs text-emerald-800 font-medium">
                      Room is clean and ready for instant guest check-in.
                    </div>
                  )}

                  {room.status === 'CLEANING' && (
                    <div className="p-3 rounded-xl bg-orange-50/50 border border-dashed border-orange-200 text-xs text-orange-800 font-medium">
                      Housekeeping in progress. Mark ready when cleaned.
                    </div>
                  )}

                </div>

                {/* Card Actions Footer */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/60">
                  {room.status === 'VACANT' && (
                    <button 
                      onClick={() => openExpressModal(room.number)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#0b3c33] hover:bg-[#072620] text-white font-extrabold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-300" /> Check-In
                    </button>
                  )}

                  {room.status === 'OCCUPIED' && stay && (
                    <div className="grid grid-cols-3 gap-1.5 w-full">
                      <button 
                        onClick={() => handleOpenAddCharge(stay)}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#0b3c33] font-black text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
                        title="Quick add item / food / water to bill"
                      >
                        <Plus className="h-3 w-3 text-emerald-700" /> + Item
                      </button>

                      <button 
                        onClick={() => onViewReceipt(stay)}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                      >
                        <Receipt className="h-3 w-3 text-[#0b3c33]" /> Slip
                      </button>

                      <button 
                        onClick={() => onCheckOut(stay.id)}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
                      >
                        <KeyRound className="h-3 w-3" /> Out
                      </button>
                    </div>
                  )}

                  {room.status === 'CLEANING' && (
                    <button 
                      onClick={() => onRoomStatusChange(room.id, 'VACANT')}
                      className="w-full py-2 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-xs transition-all cursor-pointer"
                    >
                      ✓ Mark Room Ready
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════
           2. LIST VIEW: Spacious Table View (All Rooms Together)
           ════════════════════════════════════════════════════════════════════ */
        <div className="pt-1">
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-black border-b border-slate-200 font-heading text-xs">
                <tr>
                  <th className="px-5 py-4">ROOM</th>
                  <th className="px-5 py-4">GUEST DETAILS</th>
                  <th className="px-5 py-4">RATE</th>
                  <th className="px-5 py-4">STATUS</th>
                  <th className="px-5 py-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map((room) => {
                  const stay = activeStays.find(s => s.roomNumber === room.number);

                  return (
                    <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Room */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <BedDouble className="h-4 w-4 text-[#0b3c33] shrink-0" />
                          <span className="font-mono text-xs sm:text-sm font-black text-[#0b3c33] bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                            RM-{room.number}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-700 font-semibold">{room.type}</span>
                        </div>
                      </td>

                      {/* Guest Details */}
                      <td className="px-5 py-4">
                        {room.status === 'OCCUPIED' && stay ? (
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">{stay.primaryGuest?.name || 'Guest'}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400" /> {stay.primaryGuest?.phone || '—'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs sm:text-sm font-medium italic">Available</span>
                        )}
                      </td>

                      {/* Rate */}
                      <td className="px-5 py-4">
                        <div className="font-black text-[#0b3c33] text-sm font-mono">
                          ₹{room.rate}
                        </div>
                        {room.status === 'OCCUPIED' && stay && Number(stay.extraCharges || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenAddCharge(stay)}
                            className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-md mt-1 cursor-pointer transition-all shadow-2xs"
                            title="Click to view/manage extra bill items"
                          >
                            +₹{stay.extraCharges} extras ({stay.extraItems?.length || 1})
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {room.status === 'OCCUPIED' && (() => {
                          const expiry = stay ? getStayExpiryStatus(stay) : null;
                          if (expiry?.isOverdue) {
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-700 border border-rose-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                                  Time Up ({expiry.statusBadgeText})
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">Due: {expiry.expectedFormatted}</span>
                              </div>
                            );
                          }
                          if (expiry?.isDueSoon) {
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 border border-amber-200">
                                  <Clock className="h-3 w-3 text-amber-600" />
                                  Due Soon ({expiry.statusBadgeText})
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">Due: {expiry.expectedFormatted}</span>
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-0.5 text-xs font-extrabold text-amber-800 border border-amber-200/80">
                                Occupied
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">Till: {expiry?.expectedFormatted || '—'}</span>
                            </div>
                          );
                        })()}
                        {room.status === 'VACANT' && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-[#0b3c33] border border-emerald-200/80">
                            Vacant
                          </span>
                        )}
                        {room.status === 'CLEANING' && (
                          <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold text-orange-800 border border-orange-200/80">
                            Cleaning
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {room.status === 'VACANT' && (
                            <button 
                              onClick={() => openExpressModal(room.number)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0b3c33] hover:bg-[#072620] text-white font-extrabold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              <Plus className="h-3.5 w-3.5 text-emerald-300" /> Check-In
                            </button>
                          )}
                          {room.status === 'OCCUPIED' && stay && (
                            <>
                              <button 
                                onClick={() => handleOpenAddCharge(stay)}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#0b3c33] font-black text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
                                title="Quick add water, tea, food, or services to room bill"
                              >
                                <Plus className="h-3.5 w-3.5 text-emerald-700" /> + Add Item
                              </button>
                              <button 
                                onClick={() => onViewReceipt(stay)}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                              >
                                <Receipt className="h-3.5 w-3.5 text-[#0b3c33]" /> Slip
                              </button>
                              <button 
                                onClick={() => onCheckOut(stay.id)}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
                              >
                                <KeyRound className="h-3.5 w-3.5" /> Check Out
                              </button>
                            </>
                          )}
                          {room.status === 'CLEANING' && (
                            <button 
                              onClick={() => onRoomStatusChange(room.id, 'VACANT')}
                              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                            >
                              Mark Ready
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Item / Room Service Charge Modal */}
      <AddRoomChargeModal
        isOpen={isAddChargeModalOpen}
        onClose={() => {
          setIsAddChargeModalOpen(false);
          setStayForCharge(null);
        }}
        stay={stayForCharge}
        onChargeUpdated={() => {
          if (refreshData) refreshData();
        }}
      />
    </div>
  );
}
