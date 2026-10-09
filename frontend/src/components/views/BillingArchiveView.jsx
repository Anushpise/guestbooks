import React, { useState } from 'react';
import { Receipt, Search, Printer, IndianRupee, Calendar, CheckCircle, FileText } from 'lucide-react';
import { hotelService } from '../../services/hotelService';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

export default function BillingArchiveView({ onViewReceipt, hotelId = null, hotel = null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const effectiveHotelId = hotelId || hotel?.id || hotelService.getCurrentHotelId();
  const activeStays = hotelService.getActiveStays(effectiveHotelId);
  const policeLogs = hotelService.getPoliceLogs(effectiveHotelId);

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
    <div className="space-y-5 font-sans">
      {/* Executive Header & Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0b3c33]/10 text-[#0b3c33] rounded-xl border border-[#0b3c33]/20">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  {hotel?.name ? `${hotel.name} — Billing & Receipts` : 'Billing & Guest Receipt Archives'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Search invoices, print guest tax slips, and track room tariffs for {hotel?.name || 'your property'}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200/80 rounded-xl px-4 py-2.5">
            <div className="text-right">
              <div className="text-[10px] font-extrabold uppercase text-[#0b3c33] tracking-wider">Total Revenue Logged</div>
              <div className="text-xl font-extrabold text-[#0b3c33] font-mono">₹{totalCollected.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              className="pl-9 h-9 text-xs bg-slate-50/60 border-slate-200 focus:bg-white focus:ring-[#0b3c33]"
              placeholder="Search invoice by guest name, room code, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-xs outline-none focus:ring-2 focus:ring-[#0b3c33] cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Invoices & Stays</option>
              <option value="ACTIVE">Active Stays (Running Slip)</option>
              <option value="COMPLETED">Checked-Out (Final Slip)</option>
            </select>

            <Badge className="py-1.5 px-3 text-xs font-bold bg-[#0b3c33] text-white">
              {filteredRecords.length} Invoice Slips
            </Badge>
          </div>
        </div>
      </div>

      {/* Billing Records Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[10px]">
            <tr>
              <th className="px-5 py-3.5">INVOICE NO / ROOM</th>
              <th className="px-5 py-3.5">GUEST NAME</th>
              <th className="px-5 py-3.5">CHECK-IN / OUT</th>
              <th className="px-5 py-3.5 font-mono">TARIFF RATE</th>
              <th className="px-5 py-3.5">PAYMENT MODE</th>
              <th className="px-5 py-3.5">STATUS</th>
              <th className="px-5 py-3.5 text-right">RECEIPT SLIP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No invoice records found matching criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-emerald-50/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs font-bold text-[#0b3c33] bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200/80">
                      RM-{rec.roomNumber}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">{rec.id}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{rec.guestName}</div>
                    <div className="text-[11px] text-slate-500">{rec.phone}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    <div>In: {rec.checkInTime}</div>
                    <div className="text-[10px] text-slate-400">Out: {rec.checkOutTime}</div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[#0b3c33] font-extrabold text-sm">
                    ₹{rec.totalAmount}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">
                    {rec.paymentMode}
                  </td>
                  <td className="px-5 py-3.5">
                    {rec.status === 'ACTIVE' ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-[#0b3c33] border border-emerald-200/80">
                        Active Stay
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 border border-slate-200">
                        Paid & Checked-Out
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button 
                      size="sm" 
                      onClick={() => onViewReceipt(rec)}
                      className="bg-[#0b3c33] hover:bg-[#082e27] text-white font-bold text-xs gap-1.5 cursor-pointer"
                    >
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
