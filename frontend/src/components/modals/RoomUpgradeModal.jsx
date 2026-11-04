import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Brush
} from 'lucide-react';
import { hotelService } from '../../services/hotelService';
import { toast } from 'sonner';

export default function RoomUpgradeModal({
  isOpen,
  onClose,
  stay,
  rooms = [],
  onUpgradeComplete
}) {
  if (!isOpen || !stay) return null;

  const currentRoomNumber = String(stay.roomNumber);
  const currentRoom = rooms.find(r => String(r.number) === currentRoomNumber);
  const currentRate = Number(currentRoom?.rate || stay.roomRate || 0);

  // Filter only vacant rooms (excluding the current room)
  const vacantRooms = rooms.filter(
    r => r.status === 'VACANT' && String(r.number) !== currentRoomNumber
  );

  const [selectedRoomNumber, setSelectedRoomNumber] = useState(
    vacantRooms[0]?.number || ''
  );
  const [oldRoomStatus, setOldRoomStatus] = useState('CLEANING');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetRoom = rooms.find(r => String(r.number) === String(selectedRoomNumber));
  const targetRate = Number(targetRoom?.rate || 0);

  // Editable price difference (defaults to targetRate - currentRate)
  const [priceDifference, setPriceDifference] = useState(() => {
    return Math.max(0, targetRate - currentRate);
  });

  // When target room changes, update the default difference
  useEffect(() => {
    if (targetRoom) {
      const diff = Math.max(0, Number(targetRoom.rate || 0) - currentRate);
      setPriceDifference(diff);
    }
  }, [selectedRoomNumber]);

  // Sync selected room if vacant rooms list changes
  useEffect(() => {
    if (vacantRooms.length > 0 && (!selectedRoomNumber || !vacantRooms.some(r => String(r.number) === String(selectedRoomNumber)))) {
      setSelectedRoomNumber(vacantRooms[0].number);
    }
  }, [rooms]);

  const handleConfirmUpgrade = async (e) => {
    e.preventDefault();
    if (!targetRoom) {
      toast.error('Please select a vacant room to upgrade.');
      return;
    }

    const diffNum = Number(priceDifference) || 0;

    setIsSubmitting(true);
    try {
      const res = await hotelService.upgradeStayRoom({
        currentRoomNumber,
        newRoomNumber: targetRoom.number,
        newRate: targetRate,
        priceDifference: diffNum,
        addDiffToExtras: diffNum > 0,
        oldRoomStatus,
        targetHotelId: stay.hotelId
      });

      if (res && res.success) {
        toast.success(`✓ Successfully upgraded to Room ${targetRoom.number}!`);
        if (onUpgradeComplete) {
          await onUpgradeComplete();
        }
        onClose();
      } else {
        toast.error('Failed to complete room upgrade.');
      }
    } catch (err) {
      console.error('Room upgrade error:', err);
      toast.error('An error occurred during room upgrade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200/80">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-black text-slate-900 tracking-tight">
                Upgrade / Change Room
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Current: <span className="font-bold text-slate-800">RM-{currentRoomNumber}</span> ({stay.primaryGuest?.name || 'Guest'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {vacantRooms.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>No Vacant Rooms Available</span>
            </div>
            <p className="text-amber-800 text-[11px]">
              All other rooms are currently occupied or being cleaned.
            </p>
          </div>
        ) : (
          <form onSubmit={handleConfirmUpgrade} className="space-y-4">
            
            {/* 1. Select New Room */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 font-heading">
                Select New Room *
              </label>
              <select
                value={selectedRoomNumber}
                onChange={(e) => setSelectedRoomNumber(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-2xs"
                required
              >
                {vacantRooms.map((r) => (
                  <option key={r.id || r.number} value={r.number}>
                    RM-{r.number} • {r.type} — ₹{r.rate}/night
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Rate Difference (Editable) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 font-heading">
                  Rate Difference (₹)
                </label>
                {targetRoom && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    (₹{currentRate} → ₹{targetRate})
                  </span>
                )}
              </div>
              
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={priceDifference}
                  onChange={(e) => setPriceDifference(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-full h-10 pl-8 pr-3 rounded-xl border border-indigo-300 bg-white font-mono font-black text-slate-900 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none shadow-2xs"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                {Number(priceDifference) > 0 ? (
                  <span>+₹{priceDifference} difference will be added to the room bill.</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">Free upgrade (₹0 extra charge).</span>
                )}
              </p>
            </div>

            {/* 3. Status of Previous Room */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 font-heading">
                Previous Room (RM-{currentRoomNumber}) Status
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setOldRoomStatus('CLEANING')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    oldRoomStatus === 'CLEANING'
                      ? 'bg-orange-50 text-orange-900 border-orange-300 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Brush className="h-3.5 w-3.5 text-orange-600" />
                  <span>Cleaning</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOldRoomStatus('VACANT')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    oldRoomStatus === 'VACANT'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Vacant (Ready)</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !targetRoom}
                className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white font-extrabold text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpCircle className="h-4 w-4" />
                <span>
                  {isSubmitting 
                    ? 'Moving...' 
                    : `Confirm Move to RM-${targetRoom?.number}${Number(priceDifference) > 0 ? ` (+₹${priceDifference})` : ''}`}
                </span>
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
