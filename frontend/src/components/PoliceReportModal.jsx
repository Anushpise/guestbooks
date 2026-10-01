import React, { useState } from 'react';
import { ShieldAlert, Printer, X, Search, FileCheck, CheckCircle2 } from 'lucide-react';
import { hotelService } from '../services/hotelService';
import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell 
} from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

export default function PoliceReportModal({ isOpen, onClose }) {
  const [dateFilter, setDateFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const logs = hotelService.getPoliceLogs();

  const filteredLogs = logs.filter(log => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = log.guestName.toLowerCase().includes(q);
      const mobileMatch = log.mobile.includes(q);
      const roomMatch = log.roomNumber.includes(q);
      const idMatch = log.idTypeNo.toLowerCase().includes(q);
      const partnerMatch = log.accompanying.toLowerCase().includes(q);
      return nameMatch || mobileMatch || roomMatch || idMatch || partnerMatch;
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-xl">
        {/* Non-Print UI Header */}
        <div className="modal-header header-police no-print flex items-center justify-between border-b border-slate-200 bg-slate-900 p-5 text-white">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <ShieldAlert className="h-5 w-5 text-emerald-400" /> State Police Guest Verification Register
            </h2>
            <p className="text-xs text-slate-300">Official Statutory Lodge Register & C-Form Inspection Portal</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="express" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Print / Save PDF for Police
            </Button>
            <button className="btn-close text-white hover:bg-slate-800" onClick={onClose}><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Official Printable Header */}
        <div className="official-print-header printable-only">
          <div className="official-hotel-header">
            <h1>GUESTBOOKS REGISTRATION LOG & POLICE VERIFICATION REGISTER</h1>
            <p className="hotel-details-text">
              <strong>GUESTBOOKS HOTEL & LODGE</strong> • Govt Reg. No: <strong>GB-MH-2026-9041</strong>
            </p>
            <p className="police-jurisdiction-text">
              Jurisdiction: <strong>LOCAL POLICE STATION / E-FRRO COMPLIANCE REGISTER</strong>
            </p>
          </div>
          <div className="print-meta-row">
            <span>Generated Date/Time: <strong>{new Date().toLocaleString()}</strong></span>
            <span>Inspection Status: <strong className="text-emerald-700">VERIFIED & COMPLIANT</strong></span>
          </div>
        </div>

        <div className="modal-body p-6 space-y-4">
          {/* Filter Bar */}
          <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                type="text" 
                className="pl-9 h-9 text-xs"
                placeholder="Type Aadhaar (e.g. 4532), Mobile or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <select 
                className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-600" 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="ALL">Show All Historical Logs</option>
                <option value="TODAY">Today's Entries Only</option>
                <option value="7DAYS">Last 7 Days</option>
              </select>

              <Badge variant="indigo" className="py-1 px-3 text-xs font-bold">
                {filteredLogs.length} Records Found
              </Badge>
              <Badge variant="success" className="py-1 px-3 text-xs font-bold gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Form C Compliant
              </Badge>
            </div>
          </div>

          {/* Official 11-Column Police Guest Register Table */}
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead className="w-12 text-center">S.No</TableHead>
                <TableHead>Check-In Date/Time</TableHead>
                <TableHead className="text-center">Room</TableHead>
                <TableHead>Primary Guest Name</TableHead>
                <TableHead className="text-center">Age/Sex</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Address & City</TableHead>
                <TableHead>Govt ID Proof & No.</TableHead>
                <TableHead>Accompanying Partner Details</TableHead>
                <TableHead>Check-Out Time</TableHead>
                <TableHead className="text-center">Officer Sign</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log, index) => (
                <TableRow key={log.id}>
                  <TableCell className="text-center font-bold">{index + 1}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-slate-700">{log.checkInTime}</TableCell>
                  <TableCell className="text-center font-extrabold text-indigo-700">{log.roomNumber}</TableCell>
                  <TableCell className="font-bold text-slate-900">{log.guestName}</TableCell>
                  <TableCell className="text-center font-medium">{log.ageGender}</TableCell>
                  <TableCell className="font-mono text-slate-700">{log.mobile}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-slate-600">{log.address}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {log.idTypeNo}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-700">{log.accompanying}</TableCell>
                  <TableCell>
                    <span className={log.checkOutTime === 'Active Stay' ? 'font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200' : 'text-slate-600'}>
                      {log.checkOutTime}
                    </span>
                  </TableCell>
                  <TableCell className="border-l border-slate-200"></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Official Footer for Printed Police Document */}
          <div className="official-print-footer printable-only">
            <div className="signature-box-container">
              <div className="sig-box">
                <p>Guestbooks Manager Signature & Stamp</p>
                <div className="sig-line"></div>
              </div>
              <div className="sig-box">
                <p>Inspecting Police Officer (Head Constable / SI)</p>
                <div className="sig-line"></div>
              </div>
            </div>
            <p className="legal-disclaimer">
              Certified that the above guest particulars have been verified with government-issued photo identity cards as mandated by law.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer no-print">
          <Button variant="outline" onClick={onClose}>
            Close Portal
          </Button>
          <Button variant="police" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Export PDF / Print Register for Police
          </Button>
        </div>
      </div>
    </div>
  );
}
