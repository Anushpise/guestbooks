import React, { useState } from 'react';
import { 
  BedDouble,
  CheckCircle2,
  UserCheck,
  Sparkles,
  Search, 
  Receipt, 
  KeyRound,
  Plus,
  Phone
} from 'lucide-react';

export default function Dashboard({ 
  rooms, 
  activeStays, 
  onCheckOut, 
  openExpressModal, 
  onRoomStatusChange,
  onViewReceipt
}) {
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'VACANT', 'OCCUPIED', 'CLEANING'
  const [searchQuery, setSearchQuery] = useState('');

  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED').length;
  const vacantCount = rooms.filter(r => r.status === 'VACANT').length;
  const cleaningCount = rooms.filter(r => r.status === 'CLEANING').length;

  // Filter logic
  const filteredRooms = rooms.filter(room => {
    if (filterStatus !== 'ALL' && room.status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const stay = activeStays.find(s => s.roomNumber === room.number);
      const matchRoom = String(room.number).toLowerCase().includes(q) || room.type.toLowerCase().includes(q);
      const matchGuest = stay && (
        stay.primaryGuest.name.toLowerCase().includes(q) || 
        stay.primaryGuest.phone.includes(q)
      );
      return matchRoom || matchGuest;
    }

    return true;
  });

  return (
    <div className="space-y-4 pb-12 select-none">
      
      {/* STICKY TOP STATS & SEARCH BAR */}
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
                Total Rooms
              </span>
            </div>
            <span className="text-lg font-black font-heading font-mono">
              {totalRooms}
            </span>
          </button>

          {/* Card 2: VACANT & READY */}
          <button
            onClick={() => setFilterStatus('VACANT')}
            className={`flex items-center justify-between rounded-xl px-4 py-2.5 transition-all cursor-pointer border ${
              filterStatus === 'VACANT'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-800 border-slate-200/90 hover:border-emerald-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className={`h-4.5 w-4.5 shrink-0 ${filterStatus === 'VACANT' ? 'text-white' : 'text-emerald-600'}`} />
              <span className={`text-xs sm:text-sm font-extrabold font-heading ${filterStatus === 'VACANT' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                Vacant & Ready
              </span>
            </div>
            <span className={`text-lg font-black font-heading font-mono ${filterStatus === 'VACANT' ? 'text-white' : 'text-emerald-700'}`}>
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

        {/* Compact Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search room code or guest name..." 
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200/90 rounded-xl text-slate-900 focus:border-[#0b3c33] outline-none font-medium shadow-2xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

      </div>

      {/* TABLE LIST VIEW WITH LARGER SPACIOUS TYPOGRAPHY */}
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
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-medium text-sm">
                    No rooms matching current filter.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
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
                            <div className="font-extrabold text-slate-900 text-sm">{stay.primaryGuest.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400" /> {stay.primaryGuest.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs sm:text-sm font-medium italic">Available</span>
                        )}
                      </td>

                      {/* Rate */}
                      <td className="px-5 py-4 font-black text-[#0b3c33] text-sm font-mono">
                        ₹{room.rate}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {room.status === 'OCCUPIED' && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800 border border-amber-200/80">
                            Occupied
                          </span>
                        )}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
