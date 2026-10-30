import React, { useState } from 'react';
import { 
  BedDouble, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Edit2, 
  Check, 
  X, 
  Clock, 
  Search, 
  Plus, 
  Trash2,
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
    showNotification(`✓ Room ${roomNumber} updated to ${newStatus}`);
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
      showNotification(`✓ Tariff for Room ${roomNumber} set to ₹${editTariffValue}`);
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
      showNotification(`✓ Room ${roomNumber} name updated to "${editRoomNameValue.trim()}"`);
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
    showNotification(`✓ Room ${newRoomNumber.trim()} added successfully!`);
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
    showNotification(`✓ Room ${room.number} removed from inventory.`);
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
    <div className="space-y-4 font-sans">
      
      {/* 
        ── Sticky Top Header & Controls Section ─────────────────────────────
        Pinned cleanly below the app header (top-16) so it never scrolls away.
      */}
      <div className="sticky top-16 z-20 bg-slate-50/95 backdrop-blur-md pt-1 pb-3 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
          {/* Top Title & Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-[#0b3c33] rounded-xl border border-slate-200">
                <BedDouble className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Inventory
                  </span>
                  {hotel?.id && (
                    <span className="font-mono text-[10px] font-semibold text-slate-400">
                      {hotel.id}
                    </span>
                  )}
                </div>
                <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                  {hotel?.name ? `${hotel.name} — Room Status & Tariffs` : 'Room Status & Tariffs Master'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={() => { setIsAddModalOpen(true); setAddError(''); }}
                className="bg-[#0b3c33] hover:bg-[#082e27] text-white text-xs font-bold gap-1.5 shadow-2xs h-8 px-3 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Room
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData} 
                className="text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 h-8 px-3 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Refresh
              </Button>
            </div>
          </div>

          {/* Minimalist, Clean Executive KPI Bar (Zero loud colors) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2.5 px-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Occupancy</span>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-0.5">
                {occupancyPercentage}% <span className="text-xs font-normal text-slate-500">({occupiedCount}/{totalRooms})</span>
              </div>
            </div>
            <div className="sm:border-l border-slate-200/80 sm:pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vacant & Ready</span>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-0.5">
                {vacantCount} <span className="text-xs font-normal text-slate-500">Rooms</span>
              </div>
            </div>
            <div className="sm:border-l border-slate-200/80 sm:pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Housekeeping</span>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-0.5">
                {cleaningCount} <span className="text-xs font-normal text-slate-500">Rooms</span>
              </div>
            </div>
            <div className="sm:border-l border-slate-200/80 sm:pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maintenance</span>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-0.5">
                {maintenanceCount} <span className="text-xs font-normal text-slate-500">Rooms</span>
              </div>
            </div>
          </div>

          {/* Minimal Filter & Search Controls */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: `All (${totalRooms})` },
                { id: 'VACANT', label: `Vacant (${vacantCount})` },
                { id: 'OCCUPIED', label: `Occupied (${occupiedCount})` },
                { id: 'CLEANING', label: `Cleaning (${cleaningCount})` },
                { id: 'MAINTENANCE', label: `Maintenance (${maintenanceCount})` },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setFilterStatus(st.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === st.id
                      ? 'bg-[#0b3c33] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Search & Floor Dropdown */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  className="pl-7.5 h-8 text-xs bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0b3c33]"
                  placeholder="Search room no, type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs outline-none focus:ring-1 focus:ring-[#0b3c33] cursor-pointer"
              >
                <option value="ALL">All Floors</option>
                {floorOptions.map(floor => (
                  <option key={floor} value={floor}>{floor}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast Notification Banner ──────────────────────────────────── */}
      {toastMessage && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 flex items-center justify-between shadow-xs animate-in fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Decent, Minimalist Room Cards Grid (Pure White Cards) ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredRooms.map((room) => {
          const isOccupied = room.status === 'OCCUPIED';
          const isVacant = room.status === 'VACANT';
          const isCleaning = room.status === 'CLEANING';
          const isMaintenance = room.status === 'MAINTENANCE';

          return (
            <div 
              key={room.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-4 space-y-3"
            >
              {/* Room Top Bar: Room No + Status Micro-Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-sm font-bold text-slate-900">
                    Room {room.number}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    • {room.floor}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Subtle, Minimal Status Micro-Badge */}
                  {isVacant && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Vacant
                    </span>
                  )}
                  {isOccupied && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-800 border border-slate-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Occupied
                    </span>
                  )}
                  {isCleaning && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400" /> Cleaning
                    </span>
                  )}
                  {isMaintenance && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Maintenance
                    </span>
                  )}

                  {onDeleteRoom && (
                    <button
                      onClick={() => setDeleteConfirmId(deleteConfirmId === room.id ? null : room.id)}
                      disabled={isOccupied}
                      title={isOccupied ? "Cannot delete occupied room" : "Delete Room"}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        isOccupied 
                          ? 'text-slate-200 cursor-not-allowed opacity-30' 
                          : 'text-slate-300 hover:text-rose-600 hover:bg-slate-50'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Delete Confirmation if requested */}
              {deleteConfirmId === room.id && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-800">
                    Delete Room {room.number} permanently?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConfirmDelete(room)}
                      className="px-2 py-0.5 text-xs font-bold rounded bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-0.5 text-xs font-medium rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Room Name & Tariff Row */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Room Name / Type */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</div>
                  {editingRoomNameId === room.id ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        className="flex-1 h-7 rounded border border-slate-300 px-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#0b3c33] bg-white"
                        value={editRoomNameValue}
                        onChange={(e) => setEditRoomNameValue(e.target.value)}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveName(room.id, room.number)}
                        className="h-7 w-7 rounded bg-[#0b3c33] text-white flex items-center justify-center cursor-pointer"
                        title="Save"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingRoomNameId(null)}
                        className="h-7 w-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-semibold text-slate-800 truncate" title={room.type}>
                        {room.type}
                      </span>
                      <button
                        onClick={() => handleStartEditName(room)}
                        className="text-slate-300 hover:text-slate-600 p-0.5 transition-colors cursor-pointer"
                        title="Edit Type"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Nightly Tariff */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tariff</div>
                  {editingRoomId === room.id ? (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-slate-500 font-mono">₹</span>
                      <input
                        type="number"
                        className="w-16 h-7 rounded border border-slate-300 px-1 text-xs font-mono font-bold text-slate-900 outline-none focus:border-[#0b3c33] bg-white"
                        value={editTariffValue}
                        onChange={(e) => setEditTariffValue(e.target.value)}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveTariff(room.id, room.number)}
                        className="h-7 w-7 rounded bg-[#0b3c33] text-white flex items-center justify-center cursor-pointer"
                        title="Save"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingRoomId(null)}
                        className="h-7 w-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        ₹{room.rate} <span className="text-[10px] font-normal text-slate-400">/night</span>
                      </span>
                      <button
                        onClick={() => handleStartEditTariff(room)}
                        className="text-slate-300 hover:text-slate-600 p-0.5 transition-colors cursor-pointer"
                        title="Edit Tariff"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Selector Footer (Clean & Discreet) */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] font-medium">Change Status:</span>
                <select
                  value={room.status}
                  onChange={(e) => handleStatusChange(room.id, room.number, e.target.value)}
                  className="h-7 rounded-md border border-slate-200 bg-slate-50/80 hover:bg-white px-2 text-xs font-medium text-slate-700 shadow-2xs outline-none focus:border-[#0b3c33] cursor-pointer transition-colors"
                >
                  <option value="VACANT">Vacant (Ready)</option>
                  <option value="OCCUPIED">Occupied (Stay Active)</option>
                  <option value="CLEANING">Cleaning (Housekeeping)</option>
                  <option value="MAINTENANCE">Maintenance (Repair)</option>
                </select>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── Add Room Modal Dialog (Minimal & Decent) ────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-100 text-[#0b3c33] rounded-lg border border-slate-200">
                  <BedDouble className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900">Add New Room</h3>
                  <p className="text-xs text-slate-500">Add a new room to hotel inventory</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {addError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs font-medium text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 401, 305"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0b3c33] focus:ring-1 focus:ring-[#0b3c33]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room Type / Name *
                </label>
                <input
                  type="text"
                  list="room-type-options"
                  placeholder="e.g. Deluxe AC Suite, Executive King"
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0b3c33] focus:ring-1 focus:ring-[#0b3c33]"
                  required
                />
                <datalist id="room-type-options">
                  <option value="Standard AC Room" />
                  <option value="Deluxe AC Suite" />
                  <option value="Executive Suite" />
                  <option value="Family Luxury Suite" />
                  <option value="Presidential Suite" />
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Floor *
                  </label>
                  <select
                    value={newRoomFloor}
                    onChange={(e) => setNewRoomFloor(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#0b3c33] focus:ring-1 focus:ring-[#0b3c33] cursor-pointer"
                  >
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor">4th Floor</option>
                    <option value="5th Floor">5th Floor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tariff (₹) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    placeholder="2500"
                    value={newRoomRate}
                    onChange={(e) => setNewRoomRate(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono font-semibold text-slate-900 outline-none focus:border-[#0b3c33] focus:ring-1 focus:ring-[#0b3c33]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs font-semibold border-slate-200 h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#0b3c33] hover:bg-[#082e27] text-white text-xs font-bold shadow-2xs h-8"
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
