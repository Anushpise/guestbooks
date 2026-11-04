import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUpCircle, 
  BedDouble, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Building2,
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
  const [billingOption, setBillingOption] = useState('ADD_EXTRA'); // 'ADD_EXTRA', 'UPDATE_RATE', 'FREE'
  const [oldRoomStatus, setOldRoomStatus] = useState('CLEANING'); // 'CLEANING', 'VACANT'
  const [upgradeReason, setUpgradeReason] = useState('Guest requested room upgrade');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selected room if vacant rooms list changes
  useEffect(() => {
    if (vacantRooms.length > 0 && (!selectedRoomNumber || !vacantRooms.some(r => String(r.number) === String(selectedRoomNumber)))) {
      setSelectedRoomNumber(vacantRooms[0].number);
    }
  }, [rooms]);

  const targetRoom = rooms.find(r => String(r.number) === String(selectedRoomNumber));
  const targetRate = Number(targetRoom?.rate || 0);
  const priceDifference = targetRoom ? targetRate - currentRate : 0;

  const handleConfirmUpgrade = async (e) => {
    e.preventDefault();
    if (!targetRoom) {
      toast.error('Please select a vacant room to upgrade.');
      return;
    }

    setIsSubmitting(true);
    try {
      const addDiffToExtras = billingOption === 'ADD_EXTRA' && priceDifference > 0;
      const newRate = billingOption === 'UPDATE_RATE' ? targetRate : (billingOption === 'FREE' ? currentRate : targetRate);

      const res = await hotelService.upgradeStayRoom({
        currentRoomNumber,
        newRoomNumber: targetRoom.number,
        newRate,
        priceDifference: addDiffToExtras ? priceDifference : 0,
        addDiffToExtras,
        oldRoomStatus,
        targetHotelId: stay.hotelId
      });

      if (res && res.success) {
        toast.success(`✓ Successfully upgraded Room ${currentRoomNumber} to RM-${targetRoom.number} for ${stay.primaryGuest?.name || 'Guest'}!`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-3.5 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200/80 shadow-2xs">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Room Upgrade / Change
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Move active guest stay to another room smoothly
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close upgrade modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Stay Snapshot */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-heading">
              Current Occupied Stay
            </span>
            <span className="font-mono text-xs font-black text-[#0b3c33] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
              Current: RM-{currentRoomNumber}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="font-black text-slate-900 text-sm">
                {stay.primaryGuest?.name || 'Guest'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                📞 {stay.primaryGuest?.phone || '—'}
              </div>
            </div>

            <div className="text-right">
              <div className="font-bold text-slate-700">
                {currentRoom?.type || stay.stayType || 'Standard Room'}
              </div>
              <div className="font-black font-mono text-slate-900">
                Tariff: ₹{currentRate}
              </div>
            </div>
          </div>
        </div>

        {/* Vacant Rooms Check */}
        {vacantRooms.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs space-y-2 text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>No Vacant Rooms Available</span>
            </div>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              All other rooms are currently occupied or being cleaned. To upgrade this guest, please check out an existing room or mark a cleaned room as ready first.
            </p>
          </div>
        ) : (
          <form onSubmit={handleConfirmUpgrade} className="space-y-4">
            
            {/* Step 1: Target Room Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 font-heading">
                Select Destination Room *
              </label>
              <select
                value={selectedRoomNumber}
                onChange={(e) => setSelectedRoomNumber(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-2xs"
                required
              >
                {vacantRooms.map((r) => (
                  <option key={r.id || r.number} value={r.number}>
                    RM-{r.number} • {r.type} ({r.floor || 'Floor'}) — ₹{r.rate}/night
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Target Room Preview & Comparison */}
            {targetRoom && (
              <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>New Room Details</span>
                  </div>
                  <span className="font-mono text-sm font-black text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                    RM-{targetRoom.number}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-indigo-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Category:</span>
                    <p className="font-bold text-slate-800">{targetRoom.type}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Floor:</span>
                    <p className="font-bold text-slate-800">{targetRoom.floor || '1st Floor'}</p>
                  </div>
                </div>

                {/* Price Difference Indicator */}
                <div className="flex items-center justify-between pt-1 border-t border-indigo-100/80 font-mono">
                  <span className="text-xs text-slate-600">Rate Difference:</span>
                  <div className="text-right">
                    {priceDifference > 0 ? (
                      <span className="inline-flex items-center gap-1 font-black text-indigo-900 bg-indigo-100/80 px-2 py-0.5 rounded-md text-xs border border-indigo-300">
                        +₹{priceDifference} /night (Upgrade)
                      </span>
                    ) : priceDifference === 0 ? (
                      <span className="font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs border border-slate-200">
                        ₹0 (Same Tariff)
                      </span>
                    ) : (
                      <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-200">
                        -₹{Math.abs(priceDifference)} (Lower Tariff)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Billing / Tariff Adjustment Option */}
            {priceDifference > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 font-heading">
                  Tariff Adjustment for Difference (₹{priceDifference})
                </label>
                <div className="space-y-1.5 text-xs">
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    billingOption === 'ADD_EXTRA' 
                      ? 'border-indigo-400 bg-indigo-50/50 text-indigo-950 font-bold' 
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}>
                    <input 
                      type="radio" 
                      name="upgradeBilling"
                      checked={billingOption === 'ADD_EXTRA'}
                      onChange={() => setBillingOption('ADD_EXTRA')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900">
                        Add difference (+₹{priceDifference}) to Room Extras Bill (Recommended)
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Appends a "Room Upgrade" line item to bill so guest pays difference upon checkout.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    billingOption === 'UPDATE_RATE' 
                      ? 'border-indigo-400 bg-indigo-50/50 text-indigo-950 font-bold' 
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}>
                    <input 
                      type="radio" 
                      name="upgradeBilling"
                      checked={billingOption === 'UPDATE_RATE'}
                      onChange={() => setBillingOption('UPDATE_RATE')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900">
                        Update Room Tariff Rate to ₹{targetRate}
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Sets the stay's daily room rate directly to the new room's tariff.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    billingOption === 'FREE' 
                      ? 'border-indigo-400 bg-indigo-50/50 text-indigo-950 font-bold' 
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}>
                    <input 
                      type="radio" 
                      name="upgradeBilling"
                      checked={billingOption === 'FREE'}
                      onChange={() => setBillingOption('FREE')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900">
                        Complimentary / Free Upgrade (₹0 extra)
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Guest is upgraded at no additional charge. Bill stays unchanged.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Previous Room Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 font-heading">
                Status of Previous Room (RM-{currentRoomNumber})
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
                  <span>Cleaning (Housekeeping)</span>
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
                  <span>Vacant & Ready</span>
                </button>
              </div>
            </div>

            {/* Step 5: Quick Reason Note */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Upgrade Reason / Note
              </label>
              <input
                type="text"
                value={upgradeReason}
                onChange={(e) => setUpgradeReason(e.target.value)}
                placeholder="e.g. Guest requested AC upgrade, shifted due to water issue"
                className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              />
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
                <span>{isSubmitting ? 'Moving Room...' : `Confirm Move to RM-${targetRoom?.number}`}</span>
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
