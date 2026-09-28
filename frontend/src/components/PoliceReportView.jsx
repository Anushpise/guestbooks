import React, { useState, useRef } from 'react';
import {
  ShieldAlert, Printer, Search, Calendar, FileText,
  Download, Filter, CheckCircle2, Clock, Users, X
} from 'lucide-react';
import { hotelService } from '../services/hotelService';

// ── helpers ────────────────────────────────────────────────────────────────────

function filterLogsByDays(logs, days) {
  if (days === 'ALL') return logs;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days === 'CUSTOM' ? 0 : Number(days)));
  cutoff.setHours(0, 0, 0, 0);
  return logs.filter(log => {
    const d = new Date(log.date || log.checkInTime);
    return d >= cutoff;
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

// ── print stylesheet injected into <head> at runtime ──────────────────────────
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #police-print-area, #police-print-area * { visibility: visible !important; }
  #police-print-area {
    position: fixed; inset: 0;
    background: #fff;
    padding: 20px 24px;
    font-family: 'Times New Roman', serif;
    font-size: 9pt;
    color: #000;
  }
  .prt-hide { display: none !important; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th, td { border: 1px solid #333; padding: 5px 6px; vertical-align: top; }
  th { background: #e5e7eb; font-weight: bold; text-align: center; }
  .prt-heading { text-align: center; margin-bottom: 12px; }
  .prt-heading h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0; }
  .prt-heading p  { font-size: 9pt; margin: 2px 0; }
  .prt-meta { display: flex; justify-content: space-between; font-size: 8.5pt; margin-bottom: 10px; }
  .prt-sigs { display: flex; justify-content: space-between; margin-top: 40px; }
  .prt-sig { text-align: center; width: 180px; font-size: 8.5pt; }
  .prt-sig-line { border-top: 1px solid #000; margin-top: 36px; padding-top: 4px; }
}
`;

// ── component ─────────────────────────────────────────────────────────────────

export default function PoliceReportView() {
  const [filter, setFilter]         = useState('1');   // days: '1','3','7','30','ALL' or 'CUSTOM'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');
  const [search, setSearch]         = useState('');
  const printRef = useRef(null);

  const allLogs = hotelService.getPoliceLogs();

  // Apply date range filter
  let dated = allLogs;
  if (filter === 'CUSTOM' && customFrom) {
    const from = new Date(customFrom); from.setHours(0,0,0,0);
    const to   = customTo ? new Date(customTo) : new Date(); to.setHours(23,59,59,999);
    dated = allLogs.filter(l => {
      const d = new Date(l.date || l.checkInTime);
      return d >= from && d <= to;
    });
  } else {
    dated = filterLogsByDays(allLogs, filter);
  }

  // Apply text search
  const logs = dated.filter(log => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.guestName?.toLowerCase().includes(q) ||
      log.mobile?.includes(q) ||
      log.roomNumber?.includes(q) ||
      log.idTypeNo?.toLowerCase().includes(q) ||
      log.accompanying?.toLowerCase().includes(q) ||
      log.address?.toLowerCase().includes(q)
    );
  });

  // Period label for print header
  const periodLabel = filter === 'ALL' ? 'All Records'
    : filter === 'CUSTOM' ? `${customFrom || '?'} to ${customTo || 'today'}`
    : filter === '1' ? 'Today'
    : `Last ${filter} Days`;

  // ── print handler ──────────────────────────────────────────────────────────
  const handlePrint = () => {
    // Inject print CSS once
    if (!document.getElementById('police-print-css')) {
      const style = document.createElement('style');
      style.id = 'police-print-css';
      style.innerHTML = PRINT_CSS;
      document.head.appendChild(style);
    }
    window.print();
  };

  const FILTER_BTNS = [
    { value: '1',      label: 'Today' },
    { value: '3',      label: '3 Days' },
    { value: '7',      label: '7 Days' },
    { value: '30',     label: '30 Days' },
    { value: 'ALL',    label: 'All' },
    { value: 'CUSTOM', label: 'Custom' },
  ];

  return (
    <div className="space-y-5">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-200">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              Police Inspection Log
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Form-C Statutory Guest Register — {logs.length} entries for <span className="font-bold text-indigo-600">{periodLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 shadow-md shadow-indigo-200 transition-all active:scale-95"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        {/* Period quick-select */}
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
          {FILTER_BTNS.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition-all ${
                filter === btn.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {filter === 'CUSTOM' && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span>to</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Search */}
        <div className="relative ml-auto max-w-64 flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, room, Aadhaar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-700">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5">
          {logs.length} entries
        </span>
      </div>

      {/* ── Printable Table Area ─────────────────────────────────────────── */}
      <div id="police-print-area" ref={printRef}>

        {/* Print-only header (hidden on screen) */}
        <div className="prt-hide prt-heading" style={{display:'none'}}>
          <h1>Guestbooks Guest Verification Register (Form-C)</h1>
          <p>Police Inspection Copy — {periodLabel}</p>
          <p>Printed on: {new Date().toLocaleString('en-IN')}</p>
        </div>
        <div className="prt-hide prt-meta" style={{display:'none'}}>
          <span>Total Entries: {logs.length}</span>
          <span>Generated by: Guestbooks HMS</span>
        </div>

        {/* Screen table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-3 py-3 text-center font-bold text-[10px] tracking-wider w-8">#</th>
                <th className="px-3 py-3 text-left font-bold text-[10px] tracking-wider whitespace-nowrap">Check-In Date</th>
                <th className="px-3 py-3 text-center font-bold text-[10px] tracking-wider">Room</th>
                <th className="px-3 py-3 text-left font-bold text-[10px] tracking-wider">Guest Name</th>
                <th className="px-3 py-3 text-center font-bold text-[10px] tracking-wider">Age / Sex</th>
                <th className="px-3 py-3 text-left font-bold text-[10px] tracking-wider">Mobile</th>
                <th className="px-3 py-3 text-left font-bold text-[10px] tracking-wider">Address</th>
                <th className="px-3 py-3 text-left font-bold text-[10px] tracking-wider">ID Proof & Number</th>
                <th className="px-3 py-3 text-left font-bold text-[10px] tracking-wider">Partner Details</th>
                <th className="px-3 py-3 text-left font-bold text-[10px] tracking-wider whitespace-nowrap">Check-Out</th>
                <th className="px-3 py-3 text-center font-bold text-[10px] tracking-wider prt-hide">Officer Sign</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-slate-300" />
                      <span>No entries found for selected period</span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr
                    key={log.id || i}
                    className={`border-t border-slate-100 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    } hover:bg-indigo-50/40`}
                  >
                    <td className="px-3 py-2.5 text-center font-bold text-slate-400">{i + 1}</td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{formatDateShort(log.date || log.checkInTime)}</div>
                      <div className="text-[10px] text-slate-400">{log.checkInTime?.split(' ')?.[1] || ''}</div>
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-block font-mono font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-0.5">
                        {log.roomNumber}
                      </span>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="font-extrabold text-slate-900">{log.guestName}</div>
                    </td>

                    <td className="px-3 py-2.5 text-center font-medium text-slate-700 whitespace-nowrap">
                      {log.ageGender}
                    </td>

                    <td className="px-3 py-2.5 font-mono text-slate-700">{log.mobile}</td>

                    <td className="px-3 py-2.5 max-w-[160px]">
                      <div className="text-slate-600 leading-tight line-clamp-2">{log.address || '—'}</div>
                    </td>

                    <td className="px-3 py-2.5">
                      <span className="inline-block font-mono text-sky-700 bg-sky-50 border border-sky-200 rounded px-2 py-0.5 text-[10px] font-bold">
                        {log.idTypeNo}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 max-w-[160px]">
                      <div className="text-slate-600 leading-tight line-clamp-2">
                        {log.accompanying === 'Single Guest'
                          ? <span className="text-slate-400 italic text-[10px]">Single Guest</span>
                          : log.accompanying}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {log.checkOutTime === 'Active Stay' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5 text-[10px]">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">{log.checkOutTime}</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 border-l border-slate-100 prt-hide">
                      <div className="h-6 w-20 border-b border-slate-300 mx-auto" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Print-only footer signatures */}
        <div className="prt-hide prt-sigs" style={{display:'none'}}>
          <div className="prt-sig">
            <div className="prt-sig-line" />
            Guestbooks Manager / Owner
          </div>
          <div className="prt-sig">
            <div className="prt-sig-line" />
            Inspecting Police Officer
          </div>
          <div className="prt-sig">
            <div className="prt-sig-line" />
            Station House Officer (SHO)
          </div>
        </div>
      </div>

    </div>
  );
}
