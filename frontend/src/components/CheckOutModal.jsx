import React, { useRef, useState, useEffect } from 'react';
import {
  LogOut, CheckCircle2, RotateCcw, AlertTriangle,
  Building2, User, Clock, IndianRupee, CreditCard, ShieldCheck, X, FileText
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function CheckOutModal({
  isOpen,
  onClose,
  stay,
  onConfirmCheckOut
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [settlementMode, setSettlementMode] = useState('Cash');
  const [extraCharges, setExtraCharges] = useState(0);
  const [handoverConfirmed, setHandoverConfirmed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initialize canvas when modal opens
  useEffect(() => {
    if (!isOpen || !stay) return;

    setHasSignature(false);
    setSettlementMode(stay.paymentMode || 'Cash');
    setExtraCharges(0);
    setHandoverConfirmed(true);

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
      ctx.strokeStyle = '#0f172a'; // slate-900
      ctx.lineWidth = 2.5;

      drawBaseline(ctx, rect.width, rect.height);
    }, 120);

    return () => clearTimeout(timer);
  }, [isOpen, stay]);

  const drawBaseline = (ctx, w, h) => {
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, h * 0.72);
    ctx.lineTo(w - 24, h * 0.72);
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
    setHasSignature(true);
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

  const stopDrawing = (e) => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    const rect = canvas.getBoundingClientRect();
    drawBaseline(ctx, rect.width, rect.height);
    setHasSignature(false);
  };

  if (!isOpen || !stay) return null;

  const roomRate = Number(stay.roomRate) || 0;
  const advancePaid = Number(stay.advancePaid) || 0;
  const balanceDue = Math.max(0, (roomRate + Number(extraCharges || 0)) - advancePaid);
  const primaryGuest = stay.primaryGuest || {};
  const partner = stay.accompanyingGuest;

  const checkInDate = new Date(stay.checkInTime || Date.now());
  const now = new Date();
  const diffHours = Math.max(1, Math.round((now - checkInDate) / (1000 * 60 * 60)));

  const handleCompleteCheckOut = () => {
    if (!hasSignature) {
      const proceed = window.confirm(
        'Departure signature is recommended for statutory records. Proceed without signature?'
      );
      if (!proceed) return;
    }

    setSubmitting(true);
    let signatureDataUrl = null;
    if (hasSignature && canvasRef.current) {
      signatureDataUrl = canvasRef.current.toDataURL('image/png');
    }

    onConfirmCheckOut(stay.id || stay.roomNumber, {
      checkOutSignature: signatureDataUrl,
      settlementMode,
      extraCharges: Number(extraCharges) || 0,
      balanceSettled: balanceDue,
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Guest Departure & Check-Out
                </h2>
                <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 font-bold text-[10px]">
                  Room {stay.roomNumber}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Verify dues clearance & capture mandatory departure digital signature
              </p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {/* Guest & Stay Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Primary Guest</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{primaryGuest.name || 'Guest'}</p>
              <p className="text-[11px] font-mono text-slate-500">{primaryGuest.phone || 'N/A'}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Stay Duration</span>
              <p className="font-bold text-slate-900 mt-0.5">{diffHours} Hours Stayed</p>
              <p className="text-[11px] text-slate-500">In: {checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Registration #</span>
              <p className="font-bold text-indigo-700 font-mono mt-0.5">{stay.regNo || 'REG-0001'}</p>
              <p className="text-[11px] text-slate-500">{stay.stayType || 'Full Stay'}</p>
            </div>

            {partner && (
              <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <User className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Accompanying Partner: <strong className="text-slate-900">{partner.name}</strong> ({partner.relation || 'Partner'})</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{partner.idType}: {partner.idNumber || 'Verified'}</span>
              </div>
            )}
          </div>

          {/* Billing Settlement Strip */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-600" /> Final Bill Settlement
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
                <p className={`font-black text-sm mt-0.5 ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  ₹{balanceDue}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs font-semibold text-slate-700">Settlement Payment Mode:</span>
              <div className="flex gap-2">
                {['Cash', 'UPI / QR', 'Card'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSettlementMode(mode)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      settlementMode === mode
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Departure Digital Signature Canvas Zone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Departing Guest Digital Signature
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sign below on the touchscreen canvas using stylus or fingertip to verify checkout
                </p>
              </div>

              {hasSignature && (
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            {/* Canvas Box */}
            <div className="relative border-2 border-dashed border-indigo-300 rounded-xl bg-slate-50/60 overflow-hidden hover:border-indigo-400 transition-colors">
              <canvas
                ref={canvasRef}
                className="w-full h-36 touch-none cursor-crosshair bg-transparent"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />

              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium">
                  Touch or draw here to sign for check-out
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Signee: {primaryGuest.name || 'Guest'}</span>
              {hasSignature ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Signature captured
                </span>
              ) : (
                <span className="italic text-amber-600 font-medium">Signature pending</span>
              )}
            </div>
          </div>

          {/* Key handover acknowledgement */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={handoverConfirmed}
              onChange={(e) => setHandoverConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-slate-700 leading-tight">
              <strong>Keycard / Room Handover Confirmed:</strong> Guest confirms handover of room keys, personal belongings clearance, and final dues settlement.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleCompleteCheckOut}
            disabled={submitting || !handoverConfirmed}
            className="gap-2 font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            {hasSignature ? 'Confirm Check-Out & Sign' : 'Complete Check-Out'}
          </Button>
        </div>
      </div>
    </div>
  );
}
