import React, { useState } from 'react';
import { 
  BedDouble, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Edit2, 
  ShieldAlert,
  Check,
  X,
  TrendingUp,
  Clock,
  Layers,
  Search,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function RoomManagementView({ 
  rooms, 
  hotel = null,
  onRoomStatusChange, 
  onRoomTariffChange,
  onAddRoom,
  onDeleteRoom,
  refreshData 
}) {
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editTariffValue, setEditTariffValue] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterFloor, setFilterFloor] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Add Room modal & delete confirmation states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomType, setNewRoomType] = useState('Deluxe AC Suite');
  const [newRoomFloor, setNewRoomFloor] = useState('1st Floor');
  const [newRoomRate, setNewRoomRate] = useState('2500');
  const [addError, setAddError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Live occupancy calculations
  const totalRooms = rooms.length || 15;
  const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED').length;
  const vacantCount = rooms.filter(r => r.status === 'VACANT').length;
  const cleaningCount = rooms.filter(r => r.status === 'CLEANING').length;
  const maintenanceCount = rooms.filter(r => r.status === 'MAINTENANCE').length;
  const occupancyPercentage = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  // Extract unique floors dynamically
  const uniqueFloors = Array.from(new Set(rooms.map(r => r.floor).filter(Boolean))).sort();
  const floorOptions = uniqueFloors.length > 0 ? uniqueFloors : ['1st Floor', '2nd Floor', '3rd Floor'];

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleStatusChange = (roomId, roomNumber, newStatus) => {
    onRoomStatusChange(roomId, newStatus);
    showNotification(`✓ Room RM-${roomNumber} changed to ${newStatus}. Live Occupancy updated!`);
  };

  const handleStartEditTariff = (room) => {
    setEditingRoomId(room.id);
    setEditTariffValue(String(room.rate));
  };

  const handleSaveTariff = (roomId, roomNumber) => {
    if (editTariffValue && !isNaN(editTariffValue) && Number(editTariffValue) > 0) {
      if (onRoomTariffChange) {
        onRoomTariffChange(roomId, Number(editTariffValue));
      }
      showNotification(`✓ Tariff for Room RM-${roomNumber} updated to ₹${editTariffValue}/night.`);
    }
    setEditingRoomId(null);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    setAddError('');
    if (!newRoomNumber.trim()) {
      setAddError('Please enter a room number.');
      return;
    }
    if (!newRoomRate || Number(newRoomRate) <= 0) {
      setAddError('Please enter a valid tariff rate.');
      return;
    }
    if (onAddRoom) {
      const res = onAddRoom({
        number: newRoomNumber.trim(),
        type: newRoomType,
        floor: newRoomFloor,
        rate: Number(newRoomRate)
      });
      if (res && !res.success) {
        setAddError(res.message || 'Failed to add room.');
        return;
      }
    }
    showNotification(`✓ Room RM-${newRoomNumber.trim()} added to inventory successfully!`);
    setIsAddModalOpen(false);
    setNewRoomNumber('');
    setNewRoomRate('2500');
  };

  const handleConfirmDelete = (room) => {
    if (onDeleteRoom) {
      const res = onDeleteRoom(room.id);
      if (res && !res.success) {
        showNotification(`⚠️ ${res.message}`);
        setDeleteConfirmId(null);
        return;
      }
    }
    showNotification(`✓ Room RM-${room.number} removed from inventory.`);
    setDeleteConfirmId(null);
  };

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    if (filterStatus !== 'ALL' && room.status !== filterStatus) return false;
    if (filterFloor !== 'ALL' && room.floor !== filterFloor) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = room.number.includes(q);
      const matchType = room.type.toLowerCase().includes(q);
      if (!matchNo && !matchType) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Banner ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <BedDouble className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-50 text-indigo-800 border border-indigo-200 font-extrabold text-[10px]">
                  Real-Time Inventory Master
                </Badge>
                {hotel?.id && (
                  <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-extrabold text-[10px]">
                    {hotel.id}
                  </Badge>
                )}
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Auto-Sync Active
                </span>
              </div>
              <h2 className="font-heading text-2xl font-black text-slate-900 tracking-tight mt-1">
                {hotel?.name ? `${hotel.name} - Rooms & Tariffs` : 'Room Status & Tariffs Master'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage rooms, tariffs, and housekeeping for {hotel?.name || 'your property'} with instant synchronization across the PMS.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            onClick={() => { setIsAddModalOpen(true); setAddError(''); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Add New Room
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData} className="text-xs font-bold gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Inventory
          </Button>
        </div>
      </div>

      {/* ── Toast Notification Banner ────────────────────────────────────── */}
      {toastMessage && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-extrabold text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="text-emerald-700 hover:text-emerald-950">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── LIVE OCCUPANCY PIPELINE CARDS (AUTO RECALCULATING) ─────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Live Occupancy */}
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-indigo-700">
            <span>Live Occupancy</span>
            <span className="font-mono text-xs font-black text-indigo-900">{occupancyPercentage}%</span>
          </div>
          <div className="mt-2 text-3xl font-black text-indigo-950 font-heading">
            {occupiedCount} <span className="text-sm font-semibold text-indigo-600">/ {totalRooms} Rooms</span>
          </div>
          <div className="mt-2.5 h-2 w-full rounded-full bg-indigo-100 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPercentage > 80 ? 'bg-rose-500' : occupancyPercentage > 50 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>

        {/* Card 2: Vacant & Ready */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            <span>Vacant & Ready</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-700 font-heading">
            {vacantCount} <span className="text-sm font-semibold text-emerald-600">Rooms</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-2 font-medium">Ready for instant guest check-in</p>
        </div>

        {/* Card 3: Housekeeping Cleaning */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-700">
            <span>Housekeeping</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-amber-700 font-heading">
            {cleaningCount} <span className="text-sm font-semibold text-amber-600">Rooms</span>
          </div>
          <p className="text-[11px] text-amber-600 mt-2 font-medium">Currently undergoing cleaning</p>
        </div>

        {/* Card 4: Out of Order / Maintenance */}
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/60 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-rose-700">
            <span>Maintenance</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-rose-700 font-heading">
            {maintenanceCount} <span className="text-sm font-semibold text-rose-600">Rooms</span>
          </div>
          <p className="text-[11px] text-rose-600 mt-2 font-medium">Under repair or blocked</p>
        </div>

      </div>

      {/* ── Filters & Search Bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
          {['ALL', 'VACANT', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Rooms' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
          >
            <option value="ALL">All Floors</option>
            {floorOptions.map(floor => (
              <option key={floor} value={floor}>{floor}</option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-400">
            {filteredRooms.length} of {totalRooms}
          </span>
        </div>

      </div>

      {/* ── Room Cards Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((room) => {
          const isOccupied = room.status === 'OCCUPIED';
          const isVacant = room.status === 'VACANT';
          const isCleaning = room.status === 'CLEANING';
          const isMaintenance = room.status === 'MAINTENANCE';

          return (
            <div 
              key={room.id}
              className={`rounded-2xl border p-5 transition-all shadow-xs space-y-4 ${
                isOccupied ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-200' :
                isCleaning ? 'border-orange-300 bg-orange-50/40 ring-1 ring-orange-200' :
                isMaintenance ? 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-200' :
                'border-emerald-300 bg-emerald-50/30'
              }`}
            >
              {/* Room Top Bar */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-black text-slate-900 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  RM-{room.number}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{room.floor}</span>
                  {onDeleteRoom && (
                    <button
                      onClick={() => setDeleteConfirmId(deleteConfirmId === room.id ? null : room.id)}
                      disabled={isOccupied}
                      title={isOccupied ? "Cannot delete occupied room" : "Delete Room"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isOccupied 
                          ? 'text-slate-300 cursor-not-allowed opacity-40' 
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Delete Confirmation if requested */}
              {deleteConfirmId === room.id && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 space-y-2">
                  <p className="text-xs font-bold text-rose-900">
                    Delete Room RM-{room.number} permanently from inventory?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConfirmDelete(room)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Room Type */}
              <div>
                <div className="text-base font-black text-slate-900">{room.type}</div>
                <div className="text-xs text-slate-500 mt-0.5">{room.description || 'Standard Air Conditioned Suite'}</div>
              </div>

              {/* Tariff & Current Status */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                
                {/* Tariff Price Edit Section */}
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Nightly Tariff</div>
                  {editingRoomId === room.id ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-slate-600">₹</span>
                      <input
                        type="number"
                        className="w-20 h-7 rounded border border-indigo-300 px-1.5 text-xs font-mono font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-600"
                        value={editTariffValue}
                        onChange={(e) => setEditTariffValue(e.target.value)}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveTariff(room.id, room.number)}
                        className="h-7 w-7 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xs"
                        title="Save Tariff"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingRoomId(null)}
                        className="h-7 w-7 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-base font-black text-slate-900 font-mono">₹{room.rate}</span>
                      <button
                        onClick={() => handleStartEditTariff(room)}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 transition-colors"
                        title="Edit Tariff Rate"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Current Status</div>
                  <span className={`inline-block text-xs font-black px-3 py-1 rounded-full mt-0.5 shadow-2xs ${
                    isOccupied ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    isCleaning ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                    isMaintenance ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                    'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {room.status}
                  </span>
                </div>

              </div>

              {/* Status Change Selector & Buttons */}
              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Change Room Status:</span>
                  <select
                    value={room.status}
                    onChange={(e) => handleStatusChange(room.id, room.number, e.target.value)}
                    className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-extrabold text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="VACANT">VACANT (Ready)</option>
                    <option value="OCCUPIED">OCCUPIED (Live Stay)</option>
                    <option value="CLEANING">CLEANING (Housekeeping)</option>
                    <option value="MAINTENANCE">MAINTENANCE (Repair)</option>
                  </select>
                </div>

                {/* Quick 1-Click Action Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {!isVacant && (
                    <button
                      onClick={() => handleStatusChange(room.id, room.number, 'VACANT')}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold px-2.5 py-1 transition-all shadow-2xs"
                    >
                      ✓ Mark Vacant
                    </button>
                  )}

                  {!isOccupied && (
                    <button
                      onClick={() => handleStatusChange(room.id, room.number, 'OCCUPIED')}
                      className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold px-2.5 py-1 transition-all shadow-2xs"
                    >
                      Mark Occupied
                    </button>
                  )}

                  {!isCleaning && !isOccupied && (
                    <button
                      onClick={() => handleStatusChange(room.id, room.number, 'CLEANING')}
                      className="rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300 text-[11px] font-bold px-2 py-1 transition-all"
                    >
                      Housekeeping
                    </button>
                  )}

                  {!isMaintenance && !isOccupied && (
                    <button
                      onClick={() => handleStatusChange(room.id, room.number, 'MAINTENANCE')}
                      className="rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 text-[11px] font-bold px-2 py-1 transition-all"
                    >
                      Out of Order
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── Add Room Modal Dialog ────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                  <BedDouble className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-black text-slate-900">Add New Room</h3>
                  <p className="text-xs text-slate-500">Create a new room in hotel inventory</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 401, 305"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Room Type *
                </label>
                <select
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Standard AC Room">Standard AC Room</option>
                  <option value="Deluxe AC Suite">Deluxe AC Suite</option>
                  <option value="Executive Suite">Executive Suite</option>
                  <option value="Family Luxury Suite">Family Luxury Suite</option>
                  <option value="Presidential Suite">Presidential Suite</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Floor *
                  </label>
                  <select
                    value={newRoomFloor}
                    onChange={(e) => setNewRoomFloor(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor">4th Floor</option>
                    <option value="5th Floor">5th Floor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nightly Tariff (₹) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    placeholder="2500"
                    value={newRoomRate}
                    onChange={(e) => setNewRoomRate(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-mono font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
