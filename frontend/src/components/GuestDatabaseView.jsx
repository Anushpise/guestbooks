import React, { useState, useEffect } from 'react';
import {
  Database, Search, FileText, CheckCircle2, Eye, X,
  PenTool, Download, Calendar, User, Phone, MapPin, Building2, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { hotelService } from '../services/hotelService';

export default function GuestDatabaseView({ hotelId = null }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRecords = async (query = '') => {
    setLoading(true);
    try {
      const data = await hotelService.getDatabaseRecords(query, hotelId);
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch sequential guest database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(search);
  }, [search, hotelId]);

  const handleViewDetails = async (recordId) => {
    try {
      let res = await fetch(`/api/guests/records/${recordId}`);
      if (!res.ok) {
        res = await fetch(`http://127.0.0.1:8008/api/guests/records/${recordId}`);
      }
      if (res.ok) {
        const json = await res.json();
        setSelectedRecord(json.record);
        setModalOpen(true);
      }
    } catch (e) {
      console.error('Failed to load full record details:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Sequential Guest Database & Archive
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Permanent SQLite database storing sequential registration numbers, uploaded ID documents, and verified digital signatures.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRecords(search)}
            className="text-xs gap-1.5 font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              className="pl-9 h-9 text-xs"
              placeholder="Search Reg #, Name, Phone, Room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Database Stats Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Stored Records</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{records.length}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Database className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Latest Sequence</p>
            <p className="text-2xl font-black text-indigo-700 mt-1">{records[0]?.reg_no || 'REG-0001'}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Signatures Attached</p>
            <p className="text-2xl font-black text-emerald-800 mt-1">
              {records.filter(r => r.has_signature).length}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <PenTool className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Database Engine</p>
            <p className="text-base font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SQLite Sequential
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Sequence Reg #</th>
                <th className="px-4 py-3.5">Room & Date</th>
                <th className="px-4 py-3.5">Primary Guest</th>
                <th className="px-4 py-3.5">Residential Address</th>
                <th className="px-4 py-3.5">Govt ID Proof</th>
                <th className="px-4 py-3.5 text-center">Digital Signature</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400 text-sm">
                    {loading ? 'Loading database records...' : 'No guest records found in database.'}
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {r.reg_no}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" /> Room {r.room_number}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(r.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{r.guest_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 text-slate-400" /> {r.phone}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="truncate text-slate-800 font-medium" title={r.address}>
                        {r.address || '—'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {r.city || (r.pincode ? `PIN: ${r.pincode}` : '')}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{r.id_type || 'ID Proof'}</div>
                      <div className="text-[11px] font-mono text-slate-500">{r.id_number || '—'}</div>
                      <div className="flex gap-1 mt-1">
                        {r.has_doc_front === 1 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            Front ID
                          </span>
                        )}
                        {r.has_doc_back === 1 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Back ID
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {r.has_signature === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Signed
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No signature</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {r.status === 'CHECKED_IN' ? (
                        <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                          Active Stay
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500 font-bold text-[10px]">
                          Checked Out
                        </Badge>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(r.id)}
                        className="h-8 gap-1.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Record
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Full View Modal */}
      {modalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
                  {selectedRecord.reg_no}
                </span>
                <div>
                  <h3 className="font-heading font-bold text-slate-900 text-lg leading-tight">
                    {selectedRecord.guest_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Room {selectedRecord.room_number} • Checked in on {new Date(selectedRecord.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Personal & Stay Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Phone</span>
                  <p className="font-bold text-slate-900">{selectedRecord.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">ID Proof</span>
                  <p className="font-bold text-slate-900">{selectedRecord.id_type}</p>
                  <p className="font-mono text-slate-600 text-[11px]">{selectedRecord.id_number}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Tariff / Advance</span>
                  <p className="font-bold text-slate-900">₹{selectedRecord.room_rate} / ₹{selectedRecord.advance_paid}</p>
                  <p className="text-slate-500 text-[11px]">{selectedRecord.payment_mode}</p>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Residential Address</span>
                  <p className="font-semibold text-slate-900 text-xs">{selectedRecord.address || '—'}</p>
                  <p className="text-slate-500 text-[11px]">{selectedRecord.city} {selectedRecord.pincode ? `• PIN: ${selectedRecord.pincode}` : ''}</p>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div>
                <h4 className="font-extrabold uppercase text-[11px] tracking-wider text-slate-700 mb-2">
                  Uploaded Identity Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedRecord.document_front ? (
                    <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-500 mb-1">Document Front Photo</span>
                      <img
                        src={selectedRecord.document_front}
                        alt="Document Front"
                        className="max-h-48 rounded object-contain border border-slate-200"
                      />
                    </div>
                  ) : (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                      No front document uploaded
                    </div>
                  )}

                  {selectedRecord.document_back ? (
                    <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-500 mb-1">Document Back Photo</span>
                      <img
                        src={selectedRecord.document_back}
                        alt="Document Back"
                        className="max-h-48 rounded object-contain border border-slate-200"
                      />
                    </div>
                  ) : (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                      No back document uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* Digital Signature */}
              <div>
                <h4 className="font-extrabold uppercase text-[11px] tracking-wider text-slate-700 mb-2">
                  Guest Digital Signature
                </h4>
                {selectedRecord.signature ? (
                  <div className="border-2 border-emerald-300 rounded-xl p-4 bg-emerald-50/20 flex flex-col items-center max-w-sm">
                    <img
                      src={selectedRecord.signature}
                      alt="Guest Signature"
                      className="h-28 object-contain"
                    />
                    <span className="text-[10px] font-bold text-emerald-800 mt-2 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Legally Verified Digital Signature
                    </span>
                  </div>
                ) : (
                  <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs max-w-sm">
                    No signature on file
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-white">
              <Button type="button" onClick={() => setModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
