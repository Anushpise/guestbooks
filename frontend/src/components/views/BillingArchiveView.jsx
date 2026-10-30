import React, { useState, useEffect } from 'react';
import {
  Receipt, Search, Printer, IndianRupee, Calendar, CheckCircle,
  FileText, Users, Clock, Filter, ArrowUpRight, ShieldCheck, RefreshCw
} from 'lucide-react';
import { hotelService } from '../../services/hotelService';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { formatRegisterTime, formatDateTimeIST, isDateInFilterRange } from '../../lib/dateUtils';

export default function BillingArchiveView({ onViewReceipt, hotelId = null, hotel = null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'
  const [dateFilter, setDateFilter] = useState('all'); // 'today' | '3days' | '15days' | '1month' | 'all'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const effectiveHotelId = hotelId || hotel?.id || hotelService.getCurrentHotelId();

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const history = await hotelService.getHotelGuestHistory(effectiveHotelId);
      const mapped = history.map((stay) => {
        const isCheckedOut = stay.status === 'CHECKED_OUT' || (stay.checkOutTime && stay.checkOutTime !== 'Active Stay');
        const rate = Number(stay.roomRate) || 0;
        const advance = Number(stay.advancePaid) || rate;
        const inTime = stay.checkInTime || stay.created_at || stay.check_in_at;
        const outTime = stay.checkOutTime || stay.checked_out_at || (isCheckedOut ? inTime : 'Active Stay');

        return {
          id: stay.id || stay.regNo,
          regNo: stay.regNo || 'REG-0000',
          roomNumber: String(stay.roomNumber || ''),
          guestName: stay.guestName || stay.primaryGuest?.name || 'Guest',
          phone: stay.phone || stay.primaryGuest?.phone || '—',
          checkInTime: inTime,
          checkOutTime: isCheckedOut ? outTime : 'Active Stay',
          status: isCheckedOut ? 'COMPLETED' : 'ACTIVE',
          roomRate: rate,
          advancePaid: advance,
          totalAmount: rate,
          stayType: stay.stayType || '24 Hours Full Stay',
          paymentMode: stay.paymentMode || 'Cash',
          primaryGuest: stay.primaryGuest || {
            name: stay.guestName,
            phone: stay.phone,
            address: stay.address,
            idType: stay.idType || 'Aadhaar Card',
            idNumber: stay.idNumber || '—',
          },
          accompanyingGuest: stay.accompanyingGuest || null,
          signature: stay.signature || null,
          partnerSignature: stay.partnerSignature || null,
        };
      });
      setRecords(mapped);
    } catch (err) {
      console.error('Failed to load billing archives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, [effectiveHotelId]);

  // Filtering by Status, Search Query, and Date Range
  const filteredRecords = records.filter((rec) => {
    if (filterType === 'ACTIVE' && rec.status !== 'ACTIVE') return false;
    if (filterType === 'COMPLETED' && rec.status !== 'COMPLETED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = (
        (rec.guestName && rec.guestName.toLowerCase().includes(q)) ||
        (rec.roomNumber && String(rec.roomNumber).includes(q)) ||
        (rec.phone && String(rec.phone).includes(q)) ||
        (rec.regNo && rec.regNo.toLowerCase().includes(q))
      );
      if (!match) return false;
    }

    if (!isDateInFilterRange(rec.checkInTime, dateFilter)) {
      return false;
    }

    return true;
  });

  // Accurate Filter-based Revenue Calculations
  const totalRevenue = filteredRecords.reduce((acc, curr) => acc + curr.roomRate, 0);
  const totalAdvance = filteredRecords.reduce((acc, curr) => acc + curr.advancePaid, 0);
  const activeCount = filteredRecords.filter(r => r.status === 'ACTIVE').length;
  const completedCount = filteredRecords.filter(r => r.status === 'COMPLETED').length;

  const getDateFilterLabel = (key) => {
    switch (key) {
      case 'today': return 'Today';
      case '3days': return 'Last 3 Days';
      case '15days': return 'Last 15 Days';
      case '1month': return 'Last 1 Month (30 Days)';
      default: return 'All Time';
    }
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Executive Header & Revenue KPI Dashboard */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0b3c33]/10 text-[#0b3c33] rounded-2xl border border-[#0b3c33]/20 shadow-2xs">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {hotel?.name ? `${hotel.name} — Billing & Receipts` : 'Billing & Guest Receipt Archives'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Accurate tariff tracking, filtered revenue calculations, and guest tax invoices for {hotel?.name || 'your hotel'}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadBillingData}
              className="text-xs gap-1.5 font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Dynamic Financial Overview Cards (Calculates based on selected date filter) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Total Revenue Card */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5">
            <span className="text-[10px] font-extrabold uppercase text-[#0b3c33] tracking-wider flex items-center gap-1">
              <IndianRupee className="h-3 w-3" /> Total Revenue ({getDateFilterLabel(dateFilter)})
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#0b3c33] font-mono mt-1">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-emerald-800/80 mt-0.5 font-medium">
              Calculated tariff for {filteredRecords.length} slips
            </p>
          </div>

          {/* Advance Collected Card */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5">
            <span className="text-[10px] font-extrabold uppercase text-blue-700 tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Advance Received
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-900 font-mono mt-1">
              ₹{totalAdvance.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-blue-700/80 mt-0.5 font-medium">
              Collected at check-in desk
            </p>
          </div>

          {/* Active Stays Slips */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5">
            <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider flex items-center gap-1">
              <Clock className="h-3 w-3" /> Active Running Slips
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-900 font-mono mt-1">
              {activeCount}
            </div>
            <p className="text-[10px] text-amber-800/80 mt-0.5 font-medium">
              Currently occupied stays
            </p>
          </div>

          {/* Settled / Checked-Out Slips */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Settled / Departed
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono mt-1">
              {completedCount}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              Key handover completed
            </p>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* 1-Click Date Range Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Date Filter:
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: '3days', label: 'Last 3 Days' },
              { id: '15days', label: 'Last 15 Days' },
              { id: '1month', label: 'Last 1 Month' },
              { id: 'all', label: 'All Time' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dateFilter === tab.id
                    ? 'bg-[#0b3c33] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2.5 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                className="pl-8 h-9 text-xs bg-slate-50/70 border-slate-200 focus:bg-white focus:ring-[#0b3c33]"
                placeholder="Search guest, room, phone, slip..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-xs outline-none focus:ring-2 focus:ring-[#0b3c33] cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Stays</option>
              <option value="ACTIVE">Active Stays</option>
              <option value="COMPLETED">Checked-Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Billing Records Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">SLIP NO / ROOM</th>
                <th className="px-5 py-3.5">GUEST NAME</th>
                <th className="px-5 py-3.5">CHECK-IN (IST)</th>
                <th className="px-5 py-3.5">CHECK-OUT (IST)</th>
                <th className="px-5 py-3.5 font-mono">TARIFF (ADVANCE)</th>
                <th className="px-5 py-3.5">PAYMENT MODE</th>
                <th className="px-5 py-3.5">STAY STATUS</th>
                <th className="px-5 py-3.5 text-right">OFFICIAL RECEIPT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Loading accurate billing records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                    No billing records found for {getDateFilterLabel(dateFilter)}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const partner = rec.accompanyingGuest;
                  return (
                    <tr key={rec.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-bold text-[#0b3c33] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/80">
                          Room {rec.roomNumber}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">{rec.regNo}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{rec.guestName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{rec.phone}</div>
                        {partner && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#0b3c33] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded w-fit font-medium">
                            <Users className="h-2.5 w-2.5" /> Partner: {partner.name || 'Second Guest'}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-slate-700 font-mono">
                        <div className="font-semibold text-slate-900">{formatRegisterTime(rec.checkInTime)}</div>
                        <div className="text-[10px] text-slate-400">{rec.stayType}</div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-700 font-mono">
                        {rec.status === 'COMPLETED' || (rec.checkOutTime && rec.checkOutTime !== 'Active Stay') ? (
                          <div className="font-semibold text-rose-700">{formatRegisterTime(rec.checkOutTime)}</div>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Stay
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 font-mono">
                        <div className="text-sm font-extrabold text-[#0b3c33]">₹{rec.roomRate}</div>
                        <div className="text-[10px] text-slate-500">Adv: ₹{rec.advancePaid}</div>
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
                          className="bg-[#0b3c33] hover:bg-[#082e27] text-white font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Receipt className="h-3.5 w-3.5" /> View Receipt
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
