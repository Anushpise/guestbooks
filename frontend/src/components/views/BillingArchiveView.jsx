import React, { useState, useEffect } from 'react';
import {
  Receipt, Search, IndianRupee, Calendar,
  Users, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { hotelService } from '../../services/hotelService';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { formatRegisterTime, isDateInFilterRange } from '../../lib/dateUtils';

export default function BillingArchiveView({ onViewReceipt, hotelId = null, hotel = null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'
  const [dateFilter, setDateFilter] = useState('all'); // 'today' | '3days' | '15days' | '1month' | 'all'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  // Reset to first page whenever search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, dateFilter]);

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

  // Accurate Filter-based Total Revenue Calculation
  const totalRevenue = filteredRecords.reduce((acc, curr) => acc + curr.roomRate, 0);

  // Pagination Calculation: Exactly 10 entries per page
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRecords.length);
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

  const getDateFilterLabel = (key) => {
    switch (key) {
      case 'today': return 'Today';
      case '3days': return 'Last 3 Days';
      case '15days': return 'Last 15 Days';
      case '1month': return 'Last 1 Month';
      default: return 'All Time';
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 
        Sticky Top Header & Revenue Section:
        Remains fixed and visible when scrolling down through the entries.
      */}
      <div className="sticky top-16 z-20 bg-slate-50/95 backdrop-blur-md pt-1 pb-2 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3.5">
          {/* Title Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0b3c33]/10 text-[#0b3c33] rounded-xl border border-[#0b3c33]/20 shadow-2xs">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  {hotel?.name ? `${hotel.name} — Billing & Receipts` : 'Billing & Guest Receipt Archives'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Track room revenue, filter by date ranges, and view tax invoices for {hotel?.name || 'your property'}.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadBillingData}
              className="text-xs gap-1.5 font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Dedicated Total Revenue Section (Only Total Revenue with selected filter) */}
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase text-[#0b3c33] tracking-wider flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4" /> Total Revenue ({getDateFilterLabel(dateFilter)})
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#0b3c33] font-mono mt-0.5">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-0.5 font-medium">
                Calculated tariff from {filteredRecords.length} records matching current filter
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-[#0b3c33] text-white font-bold text-xs py-1.5 px-3">
                {filteredRecords.length} Invoices
              </Badge>
            </div>
          </div>

          {/* Filter Bar: 1-Click Date Range Pills, Search, and Status */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {/* Quick 1-Click Date Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
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

            {/* Search Input & Status Dropdown */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0b3c33]"
                  placeholder="Search guest, room, phone, slip..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 shadow-xs outline-none focus:ring-2 focus:ring-[#0b3c33] cursor-pointer"
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
      </div>

      {/* Billing Records Table Container (10 entries per page) */}
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
                paginatedRecords.map((rec) => {
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

                      {/* Check-Out (IST) - Clean text color (NO red!) */}
                      <td className="px-5 py-3.5 text-slate-700 font-mono">
                        {rec.status === 'COMPLETED' || (rec.checkOutTime && rec.checkOutTime !== 'Active Stay') ? (
                          <div className="font-semibold text-slate-800">{formatRegisterTime(rec.checkOutTime)}</div>
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

        {/* Pagination Bar: Exactly 10 entries per page */}
        {filteredRecords.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-900">{filteredRecords.length}</span> entries
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 gap-1 text-xs font-bold border-slate-200 cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </Button>

              <div className="px-2 text-xs font-bold text-slate-700">
                Page {currentPage} of {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 gap-1 text-xs font-bold border-slate-200 cursor-pointer disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
