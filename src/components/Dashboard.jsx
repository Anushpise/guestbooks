import React, { useState } from 'react';
import { 
  BedDouble, 
  CheckCircle2, 
  Sparkles, 
  ShieldAlert, 
  Zap, 
  FileText, 
  Search, 
  Receipt, 
  KeyRound,
  UserCheck,
  Plus,
  Phone,
  User,
  Users,
  Building,
  Clock,
  ArrowRight
} from 'lucide-react';
import RoomGrid from './RoomGrid';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

export default function Dashboard({ 
  rooms, 
  activeStays, 
  onCheckOut, 
  openExpressModal, 
  openNewCheckInModal, 
  openPoliceModal,
  onRoomStatusChange,
  onViewReceipt 
}) {
  const [filterFloor, setFilterFloor] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' or 'GRID'

  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED').length;
  const vacantCount = rooms.filter(r => r.status === 'VACANT').length;
  const cleaningCount = rooms.filter(r => r.status === 'CLEANING').length;
  const occupancyPercentage = Math.round((occupiedCount / totalRooms) * 100) || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Header (Raj Silk ERP Style) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
              Hotel Occupancy Pipeline
            </h2>
            <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold px-3 py-1 text-xs">
              {totalRooms} Total Rooms
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage room allocations, instant check-in auto-fills, guest ledger & police verification compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="express" size="lg" onClick={openExpressModal}>
            <Zap className="h-4 w-4" /> Express Check-In (&lt;10s)
          </Button>
          <Button variant="emerald" size="lg" onClick={openNewCheckInModal}>
            <Plus className="h-4 w-4" /> Add Sale Check-In
          </Button>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: TOTAL ROOMS */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            <span>TOTAL ROOMS</span>
            <span className="text-[10px] text-slate-400 font-medium">Master Ledger</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 font-heading">{totalRooms}</div>
        </div>

        {/* Card 2: OCCUPIED ROOMS */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
            <span>OCCUPIED ROOMS</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              In-Progress
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700 font-heading">{occupiedCount}</div>
        </div>

        {/* Card 3: VACANT & READY */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
            <span>VACANT & READY</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
              Available
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-blue-700 font-heading">{vacantCount}</div>
        </div>

        {/* Card 4: HOUSEKEEPING */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
            <span>HOUSEKEEPING</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
              Needs Cleaning
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-700 font-heading">{cleaningCount}</div>
        </div>
      </div>

      {/* Control Bar: Search & Stage Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            type="text" 
            placeholder="Search by room code, guest name, phone, Aadhaar..." 
            className="pl-9 h-9 text-xs bg-slate-50/50 border-slate-200 focus:bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <select 
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Stage Status: All Rooms</option>
            <option value="OCCUPIED">Stage: Checked-In (Occupied)</option>
            <option value="VACANT">Stage: Vacant & Ready</option>
            <option value="CLEANING">Stage: Housekeeping</option>
          </select>

          <select 
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
          >
            <option value="ALL">All Floors</option>
            <option value="1st Floor">1st Floor</option>
            <option value="2nd Floor">2nd Floor</option>
            <option value="3rd Floor">3rd Floor</option>
          </select>

          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button 
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
              onClick={() => setViewMode('TABLE')}
            >
              Table View
            </button>
            <button 
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
              onClick={() => setViewMode('GRID')}
            >
              Grid View
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Grid View */}
      {viewMode === 'GRID' ? (
        <RoomGrid 
          rooms={rooms}
          activeStays={activeStays}
          filterFloor={filterFloor}
          filterStatus={filterStatus}
          searchQuery={searchQuery}
          onCheckOut={onCheckOut}
          openExpressModal={openExpressModal}
          onRoomStatusChange={onRoomStatusChange}
          onViewReceipt={onViewReceipt}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">ROOM CODE</th>
                <th className="px-5 py-4">PRIMARY GUEST</th>
                <th className="px-5 py-4">PARTNER / GUEST DETAILS</th>
                <th className="px-5 py-4">STAY SLOT & RATE</th>
                <th className="px-5 py-4">CHECK-IN DATE</th>
                <th className="px-5 py-4">STAGE STATUS</th>
                <th className="px-5 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rooms.map((room) => {
                const stay = activeStays.find(s => s.roomNumber === room.number);

                return (
                  <tr key={room.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Room Code */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md">
                        RM-{room.number}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1 font-medium">{room.type}</div>
                    </td>

                    {/* Primary Guest */}
                    <td className="px-5 py-4">
                      {room.status === 'OCCUPIED' && stay ? (
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">{stay.primaryGuest.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400" /> {stay.primaryGuest.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium italic">Unassigned</span>
                      )}
                    </td>

                    {/* Partner Details */}
                    <td className="px-5 py-4">
                      {room.status === 'OCCUPIED' && stay && stay.accompanyingGuest ? (
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{stay.accompanyingGuest.name}</div>
                          <div className="text-[10px] text-slate-500">{stay.accompanyingGuest.relation} | {stay.accompanyingGuest.idType}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Not Specified</span>
                      )}
                    </td>

                    {/* Stay Slot & Rate */}
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-emerald-800 text-sm font-mono">₹{room.rate}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{stay ? stay.stayType : 'Full Stay'}</div>
                    </td>

                    {/* Check In Date */}
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {stay ? new Date(stay.checkInTime).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Stage Status Pill */}
                    <td className="px-5 py-4">
                      {room.status === 'OCCUPIED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
                          Stage 2: Checked-In Pending Check-Out
                        </span>
                      )}
                      {room.status === 'VACANT' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                          Stage 1: Vacant & Ready
                        </span>
                      )}
                      {room.status === 'CLEANING' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-800 border border-orange-200">
                          Housekeeping
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {room.status === 'VACANT' && (
                          <Button variant="orange" size="sm" onClick={() => openExpressModal(room.number)}>
                            <Plus className="h-3.5 w-3.5" /> Express Check-In
                          </Button>
                        )}
                        {room.status === 'OCCUPIED' && stay && (
                          <>
                            <Button variant="orange" size="sm" onClick={() => onViewReceipt(stay)}>
                              <Receipt className="h-3.5 w-3.5" /> Slip
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => onCheckOut(stay.id)}>
                              <KeyRound className="h-3.5 w-3.5" /> Check Out
                            </Button>
                          </>
                        )}
                        {room.status === 'CLEANING' && (
                          <Button variant="outline" size="sm" onClick={() => onRoomStatusChange(room.id, 'VACANT')}>
                            Mark Ready
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
