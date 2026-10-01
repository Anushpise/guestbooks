import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Send, 
  FileText, 
  Lock, 
  Building2, 
  AlertCircle,
  CheckCircle2,
  BadgeAlert
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

export default function RequestDocumentModal({ isOpen, onClose, guestLog, officerUser, onSubmitSuccess }) {
  if (!isOpen || !guestLog) return null;

  const [caseRef, setCaseRef] = useState(`GD-${Math.floor(1000 + Math.random() * 9000)}/2026`);
  const [reason, setReason] = useState('Official Law Enforcement Verification');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const REASONS = [
    'Official Law Enforcement Verification',
    'FIR Investigation / Suspect Profile Audit',
    'Inter-State Traveler Background Verification',
    'Statutory Foreigner / FRRO Audit Compliance',
    'Judicial / Court Inquiry Order Compliance',
    'Routine Preventive Security Patrol Check'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const reqData = {
      guestName: guestLog.guestName,
      roomNumber: guestLog.roomNumber,
      idTypeNo: guestLog.idTypeNo,
      hotelId: guestLog.hotelId || 'HTL-101',
      hotelName: guestLog.hotelName || 'Guestbooks Hotel Management & Lodge',
      officerName: officerUser?.name || 'Inspector V. K. Sharma',
      stationName: officerUser?.stationName || 'Central City Police Station',
      badgeNo: officerUser?.badgeNo || 'POL-INSP-8891',
      caseRef: caseRef.trim() || `GD-4011/2026`,
      reason: reason,
      notes: notes.trim(),
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      if (onSubmitSuccess) {
        onSubmitSuccess(reqData);
      }
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
                <ShieldAlert className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                  Form-C Statutory Requisition
                </span>
                <h3 className="font-heading text-lg font-black text-white mt-1">
                  Requisition Guest Identity Documents
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Formal Document Access Request to Guestbooks Management
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 animate-bounce">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h4 className="font-heading text-lg font-black text-slate-900">
              Document Requisition Transmitted!
            </h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              The official request for <strong>{guestLog.guestName}</strong> (RM-{guestLog.roomNumber}) has been submitted to StayLog Guestbooks Management. Status is now <strong>PENDING GUESTBOOKS APPROVAL</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Target Guest Summary Pill */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3.5 space-y-1">
              <div className="text-[10px] font-bold uppercase text-indigo-700 tracking-wider">
                Target Guest & Stay Record
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm">{guestLog.guestName}</span>
                  <span className="ml-2 font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    RM-{guestLog.roomNumber}
                  </span>
                </div>
                <div className="font-mono text-slate-600 text-[11px]">
                  {guestLog.idTypeNo}
                </div>
              </div>
            </div>

            {/* Privacy Law Warning */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900 flex items-start gap-2.5 leading-relaxed">
              <Lock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Legal Privacy Safeguard:</strong> Guestbooks management cannot disclose physical identity document copies (Aadhaar / Passport scans) without an official police requisition reason and case reference.
              </div>
            </div>

            {/* Case / GD Reference */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Official Case / FIR / GD Entry Reference No. *
              </label>
              <Input
                type="text"
                required
                className="h-10 text-xs font-mono font-semibold"
                placeholder="e.g. GD-4019/2026 or FIR-892/2026"
                value={caseRef}
                onChange={(e) => setCaseRef(e.target.value)}
              />
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Official Legal Requisition Grounds *
              </label>
              <select
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {REASONS.map((r, i) => (
                  <option key={i} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Officer Remarks */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Officer In-Charge Remarks / Instructions (Optional)
              </label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-colors"
                placeholder="Specify any additional verification requirements or urgency..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Officer Details Stamp */}
            <div className="rounded-lg bg-slate-100 p-2.5 text-[11px] text-slate-600 flex justify-between items-center">
              <span>Transmitting Officer: <strong>{officerUser?.name || 'Inspector V. K. Sharma'}</strong></span>
              <span className="font-mono text-slate-500">{officerUser?.stationName || 'Central City PS'}</span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={onClose} className="text-xs font-bold">
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="indigo" 
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs gap-1.5 shadow-md shadow-indigo-200"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? 'Transmitting...' : 'Submit Official Requisition'}
              </Button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
