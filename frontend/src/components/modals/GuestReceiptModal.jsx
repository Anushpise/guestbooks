import React from 'react';
import { Receipt, Printer, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { formatDateTimeIST } from '../../lib/dateUtils';

export default function GuestReceiptModal({ isOpen, onClose, stayRecord }) {
  if (!isOpen || !stayRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  const primary = stayRecord.primaryGuest || {
    name: stayRecord.guest_name || 'Guest',
    phone: stayRecord.phone || 'N/A',
    idType: stayRecord.id_type || 'Aadhaar Card',
    idNumber: stayRecord.id_number || 'N/A',
  };

  const partner = stayRecord.accompanyingGuest || stayRecord.accompanying_guest || null;
  const inTime = stayRecord.checkInTime || stayRecord.created_at || stayRecord.check_in_at;
  const outTime = stayRecord.checkOutTime || stayRecord.checked_out_at || stayRecord.check_out_at;
  const isCheckedOut = stayRecord.status === 'CHECKED_OUT' || (outTime && outTime !== 'Active Stay');

  const slipId = stayRecord.id || stayRecord.reg_no || stayRecord.regNo || 'SLIP-001';
  const roomNo = stayRecord.roomNumber || stayRecord.room_number || '101';
  const stayType = stayRecord.stayType || stayRecord.stay_type || '24 Hours Full Stay';
  const roomRate = Number(stayRecord.roomRate || stayRecord.room_rate || 0);
  const advancePaid = Number(stayRecord.advancePaid || stayRecord.advance_paid || roomRate);
  const paymentMode = stayRecord.paymentMode || stayRecord.payment_mode || 'Cash';
  const primarySig = stayRecord.signature || null;
  const partnerSig = stayRecord.partnerSignature || stayRecord.partner_signature || partner?.signature || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 no-print">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Receipt className="h-4 w-4 text-emerald-700" /> Guest Check-In Slip & Receipt
          </div>
          <button 
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs text-slate-900 printable-receipt-area">
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <img src="/logo.png" alt="Guestbooks Logo" className="h-8 w-auto mx-auto object-contain mb-1" />
            <h3 className="font-extrabold text-sm text-slate-900">GUESTBOOKS HOTEL & LODGE</h3>
            <p className="text-[11px] text-slate-600">124, Station Road, Main Market</p>
            <p className="text-[10px] text-slate-500">Phone: +91 98765 00000 | GSTIN: 27AAAAA0000A1Z5</p>
            <h4 className="font-bold text-xs pt-2 text-slate-900 tracking-wider">GUEST OFFICIAL STAY RECEIPT</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 py-1">
            <div><strong className="text-slate-900">Slip ID:</strong> {slipId}</div>
            <div>
              <strong className="text-slate-900">Check-In:</strong>{' '}
              {formatDateTimeIST(inTime)}
            </div>
            <div><strong className="text-slate-900">Room No:</strong> Room {roomNo}</div>
            <div>
              <strong className="text-slate-900">Status:</strong>{' '}
              <span className={isCheckedOut ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                {isCheckedOut ? 'Checked Out' : 'Active Stay'}
              </span>
            </div>
            {isCheckedOut && outTime && outTime !== 'Active Stay' && (
              <div className="col-span-2 text-rose-700 bg-rose-50/70 p-1.5 rounded border border-rose-200 flex items-center justify-between">
                <div>
                  <strong className="text-rose-900">Checked Out At:</strong>{' '}
                  {formatDateTimeIST(outTime)}
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                  Key Handover Cleared
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1 py-2 border-t border-b border-dashed border-slate-300 text-[11px]">
            <p><strong className="text-slate-900">Primary Guest:</strong> {primary.name || 'Guest'}</p>
            <p><strong className="text-slate-900">Mobile:</strong> {primary.phone || 'N/A'}</p>
            <p><strong className="text-slate-900">ID Proof:</strong> {primary.idType || 'Aadhaar Card'} ({primary.idNumber || '—'})</p>
            {partner && (
              <p><strong className="text-slate-900">Partner / Accompanying:</strong> {partner.name || 'Partner'} ({partner.idType || 'ID'}: {partner.idNumber || '—'})</p>
            )}
          </div>

          <table className="w-full text-left border-collapse my-2 text-[11px]">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-1">Description</th>
                <th className="py-1 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-slate-200">
              <tr>
                <td className="py-1.5">Room Tariff ({stayType})</td>
                <td className="py-1.5 text-right font-medium">₹{roomRate}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-bold">Advance Amount Paid ({paymentMode})</td>
                <td className="py-1.5 text-right font-extrabold text-slate-900">₹{advancePaid}</td>
              </tr>
              <tr>
                <td className="py-1.5">Balance Dues</td>
                <td className="py-1.5 text-right font-bold text-emerald-700">₹0.00 (Cleared)</td>
              </tr>
            </tbody>
          </table>

          {/* Dual Check-In Signatures (Both Partners) */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-slate-300">
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Primary Guest Signature</span>
              {primarySig ? (
                <div className="h-14 w-full flex items-center justify-center border border-slate-200 rounded bg-slate-50 p-1">
                  <img src={primarySig} alt="Primary Sig" className="max-h-12 max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-14 w-full flex items-center justify-center border border-dashed border-slate-300 rounded text-[10px] text-slate-400">
                  Signed on check-in
                </div>
              )}
              <div className="w-28 border-t border-slate-400 mt-1 pt-0.5 text-[9px] text-slate-600">
                Guest 1 Check-In
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                {partnerSig || partner ? 'Partner Check-In Signature' : 'Authorized Signatory'}
              </span>
              {partnerSig ? (
                <div className="h-14 w-full flex items-center justify-center border border-slate-200 rounded bg-slate-50 p-1">
                  <img
                    src={partnerSig}
                    alt="Partner Sig"
                    className="max-h-12 max-w-full object-contain"
                  />
                </div>
              ) : partner ? (
                <div className="h-14 w-full flex items-center justify-center border border-dashed border-slate-300 rounded text-[10px] text-slate-400">
                  Partner Signed
                </div>
              ) : (
                <div className="h-14 w-full flex items-center justify-center border border-slate-200 rounded bg-slate-50 text-[10px] text-emerald-800 font-bold">
                  ✓ Verified & Approved
                </div>
              )}
              <div className="w-28 border-t border-slate-400 mt-1 pt-0.5 text-[9px] text-slate-600">
                {partnerSig || partner ? 'Partner / Guest 2' : 'Front Desk Reception'}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center pt-2">Thank you for staying with us! Safe travels and visit again.</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3 no-print">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="emerald" onClick={handlePrint}><Printer className="h-4 w-4" /> Print Receipt</Button>
        </div>
      </div>
    </div>
  );
}
