import React from 'react';
import { Receipt, Printer, X } from 'lucide-react';
import { Button } from './ui/button';

export default function GuestReceiptModal({ isOpen, onClose, stayRecord }) {
  if (!isOpen || !stayRecord) return null;

  const handlePrint = () => {
    window.print();
  };

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
            <h4 className="font-bold text-xs pt-2 text-slate-900 tracking-wider">GUEST CHECK-IN SLIP</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 py-1">
            <div><strong className="text-slate-900">Slip ID:</strong> {stayRecord.id}</div>
            <div><strong className="text-slate-900">Date:</strong> {new Date(stayRecord.checkInTime).toLocaleString()}</div>
            <div><strong className="text-slate-900">Room No:</strong> Room {stayRecord.roomNumber}</div>
            <div><strong className="text-slate-900">Stay Slot:</strong> {stayRecord.stayType}</div>
          </div>

          <div className="space-y-1 py-2 border-t border-b border-dashed border-slate-300 text-[11px]">
            <p><strong className="text-slate-900">Primary Guest:</strong> {stayRecord.primaryGuest.name}</p>
            <p><strong className="text-slate-900">Mobile:</strong> {stayRecord.primaryGuest.phone}</p>
            <p><strong className="text-slate-900">ID Proof:</strong> {stayRecord.primaryGuest.idType} ({stayRecord.primaryGuest.idNumber})</p>
            {stayRecord.accompanyingGuest && (
              <p><strong className="text-slate-900">Partner / Accompanying:</strong> {stayRecord.accompanyingGuest.name} ({stayRecord.accompanyingGuest.idType})</p>
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
                <td className="py-1.5">Room Tariff ({stayRecord.stayType})</td>
                <td className="py-1.5 text-right font-medium">₹{stayRecord.roomRate}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-bold">Advance Amount Paid ({stayRecord.paymentMode})</td>
                <td className="py-1.5 text-right font-extrabold text-slate-900">₹{stayRecord.advancePaid}</td>
              </tr>
              <tr>
                <td className="py-1.5">Balance Due</td>
                <td className="py-1.5 text-right font-bold text-emerald-700">₹0.00 (Fully Paid)</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between pt-6 text-[10px] text-slate-600">
            <div className="text-center w-32 border-t border-slate-400 pt-1">
              <p>Guest Signature</p>
            </div>
            <div className="text-center w-32 border-t border-slate-400 pt-1">
              <p>Reception Manager</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center pt-2">Thank you for staying with us! Check-out time as per stay slot.</p>
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
