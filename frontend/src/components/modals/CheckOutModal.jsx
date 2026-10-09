import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool, RotateCcw, Check, X, ShieldCheck, IndianRupee,
  Key, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Clock, Calendar
} from 'lucide-react';
import { Button } from '../ui/button';

export default function CheckOutModal({
  isOpen,
  onClose,
  stay,
  onConfirmCheckOut
}) {
  const [step, setStep] = useState('CLEARANCE'); // 'CLEARANCE' | 'SIGNATURE'
  const [extraCharges, setExtraCharges] = useState(0);
  const [extraChargesNote, setExtraChargesNote] = useState('');
  const [settlementMode, setSettlementMode] = useState('Cash');
  const [paymentSettled, setPaymentSettled] = useState(false);
  const [keyHandoverConfirmed, setKeyHandoverConfirmed] = useState(false);

  // Pentab Canvas States
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Reset or initialize state when modal opens
  useEffect(() => {
    if (!isOpen || !stay) return;
    setStep('CLEARANCE');
    setExtraCharges(Number(stay.extraCharges || 0));
    setExtraChargesNote('');
    setSettlementMode(stay.paymentMode || 'Cash');
    setKeyHandoverConfirmed(false);

    const initialRate = Number(stay.roomRate || 0);
    const initialAdv = Number(stay.advancePaid || 0);
    const initialDue = initialRate + Number(stay.extraCharges || 0) - initialAdv;
    setPaymentSettled(initialDue <= 0);
  }, [isOpen, stay]);

  // Sizing canvas when switching to 'SIGNATURE' step
  useEffect(() => {
    if (!isOpen || !stay || step !== 'SIGNATURE') return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a'; // slate-900 dark ink
      ctx.lineWidth = 2.5;

      drawBaseline(ctx, rect.width, rect.height);
      setHasContent(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, stay, step]);

  const drawBaseline = (ctx, w, h) => {
    ctx.save();
    ctx.strokeStyle = '#cbd5e1'; // slate-300
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, h * 0.72);
    ctx.lineTo(w - 30, h * 0.72);
    ctx.stroke();
    ctx.restore();
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasContent(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    const rect = canvas.getBoundingClientRect();
    drawBaseline(ctx, rect.width, rect.height);
    setHasContent(false);
  };

  const handleSaveCheckOut = () => {
    const canvas = canvasRef.current;
    let dataUrl = null;

    if (!canvas || !hasContent) {
      const proceedWithout = window.confirm(
        'Departure signature is not captured. Do you want to complete check-out without digital signature?'
      );
      if (!proceedWithout) return;
    } else {
      dataUrl = canvas.toDataURL('image/png');
    }

    onConfirmCheckOut(stay.id || stay.roomNumber, {
      checkOutSignature: dataUrl,
      settlementMode,
      extraCharges: Number(extraCharges) || 0,
      extraChargesNote,
      totalAmount,
      balanceDue,
      balanceSettled: true,
      keyHandoverConfirmed: true
    });
    onClose();
  };

  if (!isOpen || !stay) return null;

  // Calculation variables
  const roomRate = Number(stay.roomRate || 0);
  const advancePaid = Number(stay.advancePaid || 0);
  const extras = Math.max(0, Number(extraCharges) || 0);
  const totalAmount = roomRate + extras;
  const balanceDue = totalAmount - advancePaid;

  const guestName = stay.primaryGuest?.name || 'Guest';
  const guestPhone = stay.primaryGuest?.phone || '';
  const roomNo = stay.roomNumber || '';
  const checkInTime = stay.checkInDate || stay.created_at || stay.check_in_at;

  const canProceedToSignature = keyHandoverConfirmed && (balanceDue <= 0 || paymentSettled);

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1: BILLING & CHECK-OUT CLEARANCE
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'CLEARANCE') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-slate-900 text-lg leading-tight">
                  Check-Out Clearance & Billing
                </h3>
                <p className="text-xs text-slate-500">
                  Room {roomNo} • {guestName} {guestPhone ? `(${guestPhone})` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Stay Info Summary Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span>
                  Check-in: <strong className="text-slate-900">
                    {checkInTime ? new Date(checkInTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Today'}
                  </strong>
                </span>
              </div>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                {stay.regNo || 'REG-ACTIVE'}
              </span>
            </div>

            {/* Billing Calculation Box */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between uppercase tracking-wider text-[11px]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Final Bill Calculation
                </span>
                <span className="text-slate-400 font-mono">INR (₹)</span>
              </h4>

              <div className="grid grid-cols-3 gap-2 py-2 border-y border-dashed border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Room Tariff</span>
                  <p className="font-black text-slate-800 text-sm mt-0.5">₹{roomRate}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Advance Paid</span>
                  <p className="font-black text-emerald-700 text-sm mt-0.5">₹{advancePaid}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Balance Due</span>
                  <p className={`font-black text-base mt-0.5 ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    ₹{balanceDue > 0 ? balanceDue : 0}
                  </p>
                </div>
              </div>

              {/* Extra Charges Input */}
              <div className="pt-1 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Extra Charges (Food / Laundry / Late Fee)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={extraCharges}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        setExtraCharges(val);
                        const newDue = roomRate + val - advancePaid;
                        if (newDue > 0) setPaymentSettled(false);
                      }}
                      className="w-full pl-6 pr-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Charge Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={extraChargesNote}
                    onChange={(e) => setExtraChargesNote(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Room service, extra bed"
                  />
                </div>
              </div>

              {/* Settlement Payment Mode Selection */}
              {balanceDue > 0 ? (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Payment Mode for ₹{balanceDue} Balance:
                    </span>
                    <div className="flex gap-1.5">
                      {['Cash', 'UPI / QR', 'Card', 'Online'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setSettlementMode(mode)}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                            settlementMode === mode
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mandatory Payment Settlement Checkbox */}
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors cursor-pointer select-none ${
                    paymentSettled ? 'bg-emerald-50/80 border-emerald-300' : 'bg-rose-50/70 border-rose-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={paymentSettled}
                      onChange={(e) => setPaymentSettled(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="text-xs leading-tight">
                      <strong className={paymentSettled ? 'text-emerald-900' : 'text-rose-900'}>
                        Remaining Payment Received & Cleared (₹{balanceDue} via {settlementMode}):
                      </strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Staff confirms full balance amount has been collected from guest before clearance.
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  All dues cleared (Paid in Full at check-in). Balance: ₹0.
                </div>
              )}
            </div>

            {/* Mandatory Keycard / Room Handover Checkbox */}
            <label className={`flex items-start gap-2.5 p-3.5 rounded-xl border transition-colors cursor-pointer select-none ${
              keyHandoverConfirmed ? 'bg-indigo-50/80 border-indigo-300' : 'bg-slate-50 border-slate-300 hover:border-slate-400'
            }`}>
              <input
                type="checkbox"
                checked={keyHandoverConfirmed}
                onChange={(e) => setKeyHandoverConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="text-xs leading-tight">
                <strong className="text-slate-900 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-indigo-600" /> Room Key / Keycard & Belongings Handed Over:
                </strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Guest has returned all keys/cards and verified departure from Room {roomNo}. Room is cleared for housekeeping.
                </p>
              </div>
            </label>

            {/* Warning when proceeding is blocked */}
            {!canProceedToSignature && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Check-out is blocked until {balanceDue > 0 && !paymentSettled ? 'remaining payment is cleared' : ''}
                  {balanceDue > 0 && !paymentSettled && !keyHandoverConfirmed ? ' and ' : ''}
                  {!keyHandoverConfirmed ? 'key handover is confirmed' : ''}.
                </span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canProceedToSignature}
              onClick={() => setStep('SIGNATURE')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold shadow-xs disabled:opacity-50"
            >
              Proceed to Pentab Signature
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2: PENTAB SIGNATURE MODAL
  // EXACT SAME CONTAINER, DIMENSIONS (max-w-lg), AND CANVAS (h-56) AS SignatureModal.jsx
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header - EXACT same height, font, padding & icons as SignatureModal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-lg leading-tight">
                Guest Digital Signature (Check-Out)
              </h3>
              <p className="text-xs text-slate-500">
                Room {roomNo} • {guestName} • Sign inside box using pentab, stylus, or mouse.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Canvas Body - EXACT same size (h-56), margins, border, padding as SignatureModal */}
        <div className="p-6 flex flex-col items-center bg-slate-50/30">
          <div className="w-full relative rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden shadow-inner group">
            <canvas
              ref={canvasRef}
              className="w-full h-56 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="absolute bottom-2 left-4 text-[11px] font-medium text-slate-400 select-none pointer-events-none">
              Sign above line ──────────────────
            </div>
          </div>
          <div className="flex items-center justify-between w-full mt-3 text-xs text-slate-500">
            <span>Departure clearance & keycard handover declaration.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-slate-600 hover:text-rose-600 hover:border-rose-200 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep('CLEARANCE')}
            className="text-slate-600 gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Billing
          </Button>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveCheckOut}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-semibold shadow-xs"
            >
              <Check className="h-4 w-4" />
              Save & Complete Check-Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
