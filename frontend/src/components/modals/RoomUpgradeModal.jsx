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
  Brush,
  Plus,
  Minus,
  RotateCcw
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

  const targetRoom = rooms.find(r => String(r.number) === String(selectedRoomNumber));
  const targetRate = Number(targetRoom?.rate || 0);
  const defaultPriceDifference = targetRoom ? Math.max(0, targetRate - currentRate) : 0;

  // Custom adjustable rate difference and new rate
  const [customDiff, setCustomDiff] = useState(defaultPriceDifference);
  const [customNewRate, setCustomNewRate] = useState(targetRate);

  // Sync selected room if vacant rooms list changes
  useEffect(() => {
    if (vacantRooms.length > 0 && (!selectedRoomNumber || !vacantRooms.some(r => String(r.number) === String(selectedRoomNumber)))) {
      setSelectedRoomNumber(vacantRooms[0].number);
    }
  }, [rooms]);

  // When target room changes, update default custom diff and rate
  useEffect(() => {
    if (targetRoom) {
      const diff = Math.max(0, Number(targetRoom.rate || 0) - currentRate);
      setCustomDiff(diff);
      setCustomNewRate(Number(targetRoom.rate || 0));
    }
  }, [selectedRoomNumber]);

  const handleConfirmUpgrade = async (e) => {
    e.preventDefault();
    if (!targetRoom) {
      toast.error('Please select a vacant room to upgrade.');
      return;
    }

    const diffToCharge = billingOption === 'ADD_EXTRA' ? Math.max(0, Number(customDiff || 0)) : 0;
    const finalRate = billingOption === 'UPDATE_RATE' 
      ? Math.max(0, Number(customNewRate || targetRate)) 
      : (billingOption === 'FREE' ? currentRate : targetRate);

    setIsSubmitting(true);
    try {
      const addDiffToExtras = billingOption === 'ADD_EXTRA' && diffToCharge > 0;

      const res = await hotelService.upgradeStayRoom({
        currentRoomNumber,
        newRoomNumber: targetRoom.number,
        newRate: finalRate,
        priceDifference: addDiffToExtras ? diffToCharge : 0,
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
                  <span className="text-xs text-slate-600 font-sans">Default Tariff Difference:</span>
                  <div className="text-right">
                    {defaultPriceDifference > 0 ? (
                      <span className="inline-flex items-center gap-1 font-black text-indigo-900 bg-indigo-100/80 px-2 py-0.5 rounded-md text-xs border border-indigo-300">
                        +₹{defaultPriceDifference} /night (Standard)
                      </span>
                    ) : (
                      <span className="font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs border border-slate-200">
                        ₹0 (Same Tariff)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Billing & Rate Adjustment (Customizable amount) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 font-heading">
                  Tariff Adjustment & Billing
                </label>
                <span className="text-[11px] text-indigo-700 font-mono font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  {billingOption === 'ADD_EXTRA' && `Bill Extra: ₹${customDiff}`}
                  {billingOption === 'UPDATE_RATE' && `New Rate: ₹${customNewRate}/nt`}
                  {billingOption === 'FREE' && 'Free (₹0)'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Option 1: ADD_EXTRA */}
                <div className={`p-3 rounded-xl border transition-all ${
                  billingOption === 'ADD_EXTRA' 
                    ? 'border-indigo-400 bg-indigo-50/40 shadow-2xs' 
                    : 'border-slate-200 bg-white'
                }`}>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="upgradeBilling"
                      checked={billingOption === 'ADD_EXTRA'}
                      onChange={() => setBillingOption('ADD_EXTRA')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-extrabold text-slate-900 flex items-center justify-between">
                        <span>Add Upgrade Charge to Guest Bill</span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Appends a "Room Upgrade" line item to bill. You can adjust or negotiate this amount below.
                      </p>
                    </div>
                  </label>

                  {billingOption === 'ADD_EXTRA' && (
                    <div className="mt-3 pt-2.5 border-t border-indigo-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">
                          Upgrade Charge Amount (₹):
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCustomDiff(defaultPriceDifference)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-100/70 hover:bg-indigo-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            title="Reset to default difference"
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                            <span>Default (₹{defaultPriceDifference})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomDiff(0)}
                            className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            title="No charge"
                          >
                            Free (₹0)
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={customDiff}
                            onChange={(e) => setCustomDiff(Math.max(0, Number(e.target.value) || 0))}
                            placeholder="Enter upgrade charge amount"
                            className="w-full h-9 pl-7 pr-3 rounded-lg border border-indigo-300 bg-white font-mono font-black text-slate-900 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none"
                          />
                        </div>

                        {/* Quick +/- adjustment buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCustomDiff(prev => Math.max(0, prev - 50))}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer active:scale-95 transition-all"
                            title="Decrease by ₹50"
                          >
                            -50
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomDiff(prev => prev + 50)}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer active:scale-95 transition-all"
                            title="Increase by ₹50"
                          >
                            +50
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomDiff(prev => prev + 100)}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer active:scale-95 transition-all"
                            title="Increase by ₹100"
                          >
                            +100
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px]">
                        {customDiff === 0 ? (
                          <span className="text-emerald-700 font-bold">✓ Guest will not be charged any upgrade fee.</span>
                        ) : customDiff === defaultPriceDifference ? (
                          <span className="text-slate-600">Standard tariff difference (+₹{customDiff}) will be added to the room bill.</span>
                        ) : (
                          <span className="text-indigo-800 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Custom adjusted rate: ₹{customDiff} will be added to the room bill.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 2: UPDATE_RATE */}
                <div className={`p-3 rounded-xl border transition-all ${
                  billingOption === 'UPDATE_RATE' 
                    ? 'border-indigo-400 bg-indigo-50/40 shadow-2xs' 
                    : 'border-slate-200 bg-white'
                }`}>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="upgradeBilling"
                      checked={billingOption === 'UPDATE_RATE'}
                      onChange={() => setBillingOption('UPDATE_RATE')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-extrabold text-slate-900">
                        Update Stay Base Tariff Rate directly
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Sets the stay's daily room rate directly in the system.
                      </p>
                    </div>
                  </label>

                  {billingOption === 'UPDATE_RATE' && (
                    <div className="mt-3 pt-2.5 border-t border-indigo-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">
                          New Room Rate (₹/night):
                        </span>
                        <button
                          type="button"
                          onClick={() => setCustomNewRate(targetRate)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-100/70 hover:bg-indigo-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          <span>Standard (₹{targetRate})</span>
                        </button>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={customNewRate}
                          onChange={(e) => setCustomNewRate(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full h-9 pl-7 pr-3 rounded-lg border border-indigo-300 bg-white font-mono font-black text-slate-900 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 3: FREE */}
                <div className={`p-3 rounded-xl border transition-all ${
                  billingOption === 'FREE' 
                    ? 'border-indigo-400 bg-indigo-50/40 shadow-2xs' 
                    : 'border-slate-200 bg-white'
                }`}>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="upgradeBilling"
                      checked={billingOption === 'FREE'}
                      onChange={() => setBillingOption('FREE')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900">
                        Complimentary / Free Room Switch (₹0 Extra)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Guest is shifted at no additional cost. Existing bill remains completely unchanged.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

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
                <span>
                  {isSubmitting 
                    ? 'Moving Room...' 
                    : billingOption === 'ADD_EXTRA' && customDiff > 0
                      ? `Confirm Move to RM-${targetRoom?.number} (+₹${customDiff})`
                      : billingOption === 'UPDATE_RATE'
                        ? `Confirm Move to RM-${targetRoom?.number} (₹${customNewRate}/nt)`
                        : `Confirm Move to RM-${targetRoom?.number} (Free)`}
                </span>
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
