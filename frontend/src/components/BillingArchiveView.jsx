import React, { useState } from 'react';
import { Receipt, Search, Printer, IndianRupee, Calendar, CheckCircle, FileText } from 'lucide-react';
import { hotelService } from '../services/hotelService';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

export default function BillingArchiveView({ onViewReceipt }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const activeStays = hotelService.getActiveStays();
  const policeLogs = hotelService.getPoliceLogs();

  // Combine stays into billing records
  const billingRecords = policeLogs.map((log) => {
    const isActive = log.checkOutTime === 'Active Stay';
    const roomRate = 1800; // Standard estimated tariff
    return {
      id: log.id,
      roomNumber: log.roomNumber,
      guestName: log.guestName,
      phone: log.mobile,
      checkInTime: log.checkInTime,
      checkOutTime: log.checkOutTime,
      status: isActive ? 'ACTIVE' : 'COMPLETED',
      roomRate,
      advancePaid: roomRate,
      totalAmount: roomRate,
      paymentMode: 'Cash / UPI',
      primaryGuest: {
        name: log.guestName,
        phone: log.mobile,
        address: log.address,
        idType: log.idTypeNo.split(':')[0] || 'Aadhaar Card',
        idNumber: log.idTypeNo.split(':')[1] || log.idTypeNo,
      },
      accompanyingGuest: log.accompanying !== 'Single Guest' ? { name: log.accompanying } : null,
    };
  });

  const filteredRecords = billingRecords.filter((rec) => {
    if (filterType === 'ACTIVE' && rec.status !== 'ACTIVE') return false;
    if (filterType === 'COMPLETED' && rec.status !== 'COMPLETED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        rec.guestName.toLowerCase().includes(q) ||
        rec.roomNumber.includes(q) ||
        rec.phone.includes(q)
      );
    }
    return true;
  });

  const totalCollected = billingRecords.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="h-6 w-6 text-emerald-800" />
              Billing & Guest Receipt Archives
            </h2>
            <Badge className="bg-emerald-800 text-white font-bold px-3 py-1 text-xs">
              Accounting Ledger
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Search invoices, check payment modes, print guest tax slips, and track room tariffs.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <div className="text-right">
            <div className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">Total Revenue Logged</div>
            <div className="text-xl font-extrabold text-emerald-900 font-mono">₹{totalCollected.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            className="pl-9 h-9 text-xs bg-slate-50/50 border-slate-200 focus:bg-white"
            placeholder="Search invoice by guest name, room code, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Invoices & Stays</option>
            <option value="ACTIVE">Active Stays (Running Slip)</option>
            <option value="COMPLETED">Checked-Out (Final Slip)</option>
          </select>

          <Badge variant="indigo" className="py-1.5 px-3 text-xs font-bold">
            {filteredRecords.length} Invoice Slips
          </Badge>
        </div>
      </div>

      {/* Billing Records Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
            <tr>
              <th className="px-5 py-4">INVOICE NO / ROOM</th>
              <th className="px-5 py-4">GUEST NAME</th>
              <th className="px-5 py-4">CHECK-IN / OUT</th>
              <th className="px-5 py-4 font-mono">TARIFF RATE</th>
              <th className="px-5 py-4">PAYMENT MODE</th>
              <th className="px-5 py-4">STATUS</th>
              <th className="px-5 py-4 text-right">RECEIPT SLIP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No invoice records found matching criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                      RM-{rec.roomNumber}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">{rec.id}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-extrabold text-slate-900">{rec.guestName}</div>
                    <div className="text-[11px] text-slate-500">{rec.phone}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <div>In: {rec.checkInTime}</div>
                    <div className="text-[10px] text-slate-400">Out: {rec.checkOutTime}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-emerald-800 font-extrabold text-sm">
                    ₹{rec.totalAmount}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-700">
                    {rec.paymentMode}
                  </td>
                  <td className="px-5 py-4">
                    {rec.status === 'ACTIVE' ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        Active Stay
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 border border-slate-200">
                        Paid & Checked-Out
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button variant="orange" size="sm" onClick={() => onViewReceipt(rec)}>
                      <Receipt className="h-3.5 w-3.5" /> View Receipt
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
