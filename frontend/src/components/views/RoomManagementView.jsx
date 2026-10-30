import React, { useState } from 'react';
import { 
  BedDouble, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Edit2, 
  Check, 
  X, 
  Clock, 
  Search, 
  Plus, 
  Trash2,
  IndianRupee,
  Layers,
  Building2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

export default function RoomManagementView({ 
  rooms, 
  hotel = null,
  onRoomStatusChange, 
  onRoomTariffChange,
  onRoomDetailsChange,
  onAddRoom,
  onDeleteRoom,
  refreshData 
}) {
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editTariffValue, setEditTariffValue] = useState('');
  const [editingRoomNameId, setEditingRoomNameId] = useState(null);
  const [editRoomNameValue, setEditRoomNameValue] = useState('');
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

  const handleStatusChange = async (roomId, roomNumber, newStatus) => {
    if (onRoomStatusChange) {
      await onRoomStatusChange(roomId, newStatus);
    }
    showNotification(`✓ Room RM-${roomNumber} changed to ${newStatus}. Live Occupancy updated!`);
  };

  const handleStartEditTariff = (room) => {
    setEditingRoomId(room.id);
    setEditTariffValue(String(room.rate));
  };

  const handleSaveTariff = async (roomId, roomNumber) => {
    if (editTariffValue && !isNaN(editTariffValue) && Number(editTariffValue) > 0) {
      if (onRoomTariffChange) {
        await onRoomTariffChange(roomId, Number(editTariffValue));
      }
      showNotification(`✓ Tariff for Room RM-${roomNumber} updated to ₹${editTariffValue}/night.`);
    }
    setEditingRoomId(null);
  };

  const handleStartEditName = (room) => {
    setEditingRoomNameId(room.id);
    setEditRoomNameValue(room.type || '');
  };

  const handleSaveName = async (roomId, roomNumber) => {
    if (editRoomNameValue.trim()) {
      if (onRoomDetailsChange) {
        await onRoomDetailsChange(roomId, { type: editRoomNameValue.trim() });
      }
      showNotification(`✓ Room RM-${roomNumber} name updated to "${editRoomNameValue.trim()}".`);
    }
    setEditingRoomNameId(null);
  };

  const handleCreateRoom = async (e) => {
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
      const res = await onAddRoom({
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

  const handleConfirmDelete = async (room) => {
    if (onDeleteRoom) {
      const res = await onDeleteRoom(room.id);
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
    <div className="space-y-5 font-sans">
      
      {/* ── Top Header Banner (Unified Palette) ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0b3c33]/10 text-[#0b3c33] rounded-2xl border border-[#0b3c33]/20 shadow-2xs">
              <BedDouble className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Auto-Sync Active
                </span>
                {hotel?.id && (
                  <Badge variant="outline" className="border-slate-200 font-mono font-bold text-[10px] text-slate-600">
                    {hotel.id}
                  </Badge>
                )}
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                {hotel?.name ? `${hotel.name} — Rooms & Tariffs` : 'Room Status & Tariffs Master'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage room inventory, custom tariffs, and housekeeping statuses for {hotel?.name || 'your property'}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button 
              onClick={() => { setIsAddModalOpen(true); setAddError(''); }}
              className="bg-[#0b3c33] hover:bg-[#082e27] text-white text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add New Room
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData} 
              className="text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Refresh
            </Button>
          </div>
        </div>

        {/* ── LIVE OCCUPANCY PIPELINE CARDS (Matching Theme) ─────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          
          {/* Card 1: Live Occupancy Rate */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-[#0b3c33] tracking-wider">
              <span>Live Occupancy</span>
              <span className="font-mono text-xs font-black text-[#0b3c33]">{occupancyPercentage}%</span>
            </div>
            <div className="mt-1 text-2xl font-black text-[#0b3c33] font-mono">
              {occupiedCount} <span className="text-xs font-semibold text-[#0b3c33]/70">/ {totalRooms} Rooms</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-200/80 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  occupancyPercentage > 80 ? 'bg-rose-500' : occupancyPercentage > 50 ? 'bg-amber-500' : 'bg-[#0b3c33]'
                }`}
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </div>

          {/* Card 2: Vacant & Ready */}
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">
              <span>Vacant & Ready</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 text-2xl font-black text-emerald-800 font-mono">
              {vacantCount} <span className="text-xs font-semibold text-emerald-700">Rooms</span>
            </div>
            <p className="text-[10px] text-emerald-700/80 mt-1 font-medium">Ready for check-in</p>
          </div>

          {/* Card 3: Housekeeping Cleaning */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">
              <span>Housekeeping</span>
              <Clock className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="mt-1 text-2xl font-black text-amber-900 font-mono">
              {cleaningCount} <span className="text-xs font-semibold text-amber-800">Rooms</span>
            </div>
            <p className="text-[10px] text-amber-800/80 mt-1 font-medium">Undergoing cleaning</p>
          </div>

          {/* Card 4: Out of Order / Maintenance */}
          <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-rose-800 tracking-wider">
              <span>Maintenance</span>
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            </div>
            <div className="mt-1 text-2xl font-black text-rose-900 font-mono">
              {maintenanceCount} <span className="text-xs font-semibold text-rose-800">Rooms</span>
            </div>
            <p className="text-[10px] text-rose-800/80 mt-1 font-medium">Under repair or blocked</p>
          </div>

        </div>

        {/* ── Filters & Search Bar ───────────────────────────────────────── */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
            {['ALL', 'VACANT', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#0b3c33] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                {st === 'ALL' ? 'All Rooms' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0b3c33]"
                placeholder="Search room no, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 shadow-xs outline-none focus:ring-2 focus:ring-[#0b3c33] cursor-pointer"
            >
              <option value="ALL">All Floors</option>
              {floorOptions.map(floor => (
                <option key={floor} value={floor}>{floor}</option>
              ))}
            </select>

            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
              {filteredRooms.length} of {totalRooms}
            </span>
          </div>

        </div>
      </div>

      {/* ── Toast Notification Banner ──────────────────────────────────── */}
      {toastMessage && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-extrabold text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="text-emerald-700 hover:text-emerald-950 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Room Cards Grid (Matching App Card Style) ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room) => {
          const isOccupied = room.status === 'OCCUPIED';
          const isVacant = room.status === 'VACANT';
          const isCleaning = room.status === 'CLEANING';
          const isMaintenance = room.status === 'MAINTENANCE';

          return (
            <div 
              key={room.id}
              className={`rounded-2xl border p-5 transition-all shadow-xs space-y-3.5 ${
                isOccupied ? 'border-amber-200/90 bg-amber-50/30' :
                isCleaning ? 'border-orange-200/90 bg-orange-50/30' :
                isMaintenance ? 'border-rose-200/90 bg-rose-50/30' :
                'border-emerald-200/90 bg-emerald-50/20'
              }`}
            >
              {/* Room Top Bar */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-black text-[#0b3c33] bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  Room {room.number}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{room.floor}</span>
                  {onDeleteRoom && (
                    <button
                      onClick={() => setDeleteConfirmId(deleteConfirmId === room.id ? null : room.id)}
                      disabled={isOccupied}
                      title={isOccupied ? "Cannot delete occupied room" : "Delete Room"}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Room Name & Type */}
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Room Name & Type</div>
                {editingRoomNameId === room.id ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      className="flex-1 h-8 rounded-lg border border-[#0b3c33]/40 px-2.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0b3c33]/20 bg-white"
                      value={editRoomNameValue}
                      onChange={(e) => setEditRoomNameValue(e.target.value)}
                      placeholder="e.g. Deluxe AC Suite, Honeymoon Villa"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveName(room.id, room.number)}
                      className="h-8 w-8 rounded-lg bg-[#0b3c33] hover:bg-[#082e27] text-white flex items-center justify-center shadow-2xs cursor-pointer"
                      title="Save Room Name"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingRoomNameId(null)}
                      className="h-8 w-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-extrabold text-slate-900">{room.type}</span>
                    <button
                      onClick={() => handleStartEditName(room)}
                      className="text-slate-400 hover:text-[#0b3c33] p-1 rounded hover:bg-white transition-colors cursor-pointer"
                      title="Edit Room Name / Type"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-0.5">{room.description || 'Standard Air Conditioned Suite'}</div>
              </div>

              {/* Tariff & Current Status */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                
                {/* Tariff Price Edit Section */}
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nightly Tariff</div>
                  {editingRoomId === room.id ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-bold text-slate-600">₹</span>
                      <input
                        type="number"
                        className="w-20 h-8 rounded-lg border border-[#0b3c33]/40 px-2 text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0b3c33]/20 bg-white"
                        value={editTariffValue}
                        onChange={(e) => setEditTariffValue(e.target.value)}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveTariff(room.id, room.number)}
                        className="h-8 w-8 rounded-lg bg-[#0b3c33] hover:bg-[#082e27] text-white flex items-center justify-center shadow-2xs cursor-pointer"
                        title="Save Tariff"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingRoomId(null)}
                        className="h-8 w-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-base font-black text-[#0b3c33] font-mono">₹{room.rate}</span>
                      <button
                        onClick={() => handleStartEditTariff(room)}
                        className="text-slate-400 hover:text-[#0b3c33] p-1 rounded hover:bg-white transition-colors cursor-pointer"
                        title="Edit Tariff Rate"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Current Status</div>
                  <span className={`inline-block text-[11px] font-extrabold px-3 py-0.5 rounded-full mt-0.5 border ${
                    isOccupied ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    isCleaning ? 'bg-orange-100 text-orange-900 border-orange-300' :
                    isMaintenance ? 'bg-rose-100 text-rose-900 border-rose-300' :
                    'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {room.status}
                  </span>
                </div>

              </div>

              {/* Status Change Selector & Buttons */}
              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Quick Status:</span>
                  <select
                    value={room.status}
                    onChange={(e) => handleStatusChange(room.id, room.number, e.target.value)}
                    className="h-7 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-[#0b3c33] cursor-pointer"
                  >
                    <option value="VACANT">VACANT (Ready)</option>
                    <option value="OCCUPIED">OCCUPIED (Live Stay)</option>
                    <option value="CLEANING">CLEANING (Housekeeping)</option>
                    <option value="MAINTENANCE">MAINTENANCE (Repair)</option>
                  </select>
                </div>

                {/* Quick 1-Click Action Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {!isVacant && (
                    <button
                      onClick={() => handleStatusChange(room.id, room.number, 'VACANT')}
                      className="rounded-lg bg-[#0b3c33] hover:bg-[#082e27] text-white text-[11px] font-bold px-2.5 py-1 transition-all shadow-2xs cursor-pointer"
                    >
                      ✓ Mark Vacant
                    </button>
                  )}

                  {!isOccupied && (
                    <button
                      onClick={() => handleStatusChange(room.id, room.number, 'OCCUPIED')}
                      className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold px-2.5 py-1 transition-all shadow-2xs cursor-pointer"
                    >
                      Mark Occupied
                    </button>
                  )}

                  {!isCleaning && !isOccupied && (
                    <button
                      onClick={() => handleStatusChange(room.id, room.number, 'CLEANING')}
                      className="rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300 text-[11px] font-bold px-2 py-1 transition-all cursor-pointer"
                    >
                      Housekeeping
                    </button>
                  )}

                  {!isMaintenance && !isOccupied && (
                    <button
                      onClick={() => handleStatusChange(room.id, room.number, 'MAINTENANCE')}
                      className="rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 text-[11px] font-bold px-2 py-1 transition-all cursor-pointer"
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

      {/* ── Add Room Modal Dialog (Matching Brand Palette) ───────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#0b3c33]/10 text-[#0b3c33] rounded-xl border border-[#0b3c33]/20 shadow-2xs">
                  <BedDouble className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900">Add New Room</h3>
                  <p className="text-xs text-slate-500">Create a new room in hotel inventory</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
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
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#0b3c33] focus:ring-2 focus:ring-[#0b3c33]/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Room Name / Type * (Customizable)
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    list="room-type-options"
                    placeholder="e.g. Deluxe AC Suite, Executive King, Honeymoon Villa"
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#0b3c33] focus:ring-2 focus:ring-[#0b3c33]/20"
                    required
                  />
                  <datalist id="room-type-options">
                    <option value="Standard AC Room" />
                    <option value="Deluxe AC Suite" />
                    <option value="Executive Suite" />
                    <option value="Family Luxury Suite" />
                    <option value="Presidential Suite" />
                    <option value="Honeymoon Villa" />
                  </datalist>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {['Standard AC', 'Deluxe Suite', 'Executive King', 'Family Villa'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setNewRoomType(opt)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-[#0b3c33] text-slate-600 transition-colors cursor-pointer"
                      >
                        + {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Floor *
                  </label>
                  <select
                    value={newRoomFloor}
                    onChange={(e) => setNewRoomFloor(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#0b3c33] focus:ring-2 focus:ring-[#0b3c33]/20 cursor-pointer"
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
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-mono font-semibold text-slate-900 outline-none focus:border-[#0b3c33] focus:ring-2 focus:ring-[#0b3c33]/20"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs font-bold border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#0b3c33] hover:bg-[#082e27] text-white text-xs font-bold shadow-2xs"
                >
                  Create Room
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
