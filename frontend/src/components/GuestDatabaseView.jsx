import React, { useState, useEffect } from 'react';
import {
  Database, Search, FileText, CheckCircle2, Eye, X,
  PenTool, Download, Calendar, User, Phone, MapPin, Building2, RefreshCw,
  Users, ZoomIn, ShieldCheck, LogOut, Image as ImageIcon
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
  const [lightboxImage, setLightboxImage] = useState(null);

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
      const rec = await hotelService.getDatabaseRecordById(recordId);
      if (rec) {
        setSelectedRecord(rec);
        setModalOpen(true);
      }
    } catch (e) {
      console.error('Failed to load full record details:', e);
    }
  };

  // Extract partner data safely from selected record
  const getPartnerData = (rec) => {
    if (!rec) return null;
    let partner = rec.accompanying_guest || rec.accompanyingGuest;
    if (!partner && rec.accompanying_guest_json) {
      try {
        partner = typeof rec.accompanying_guest_json === 'string'
          ? JSON.parse(rec.accompanying_guest_json)
          : rec.accompanying_guest_json;
      } catch (e) {
        partner = null;
      }
    }
    return partner;
  };

  const partner = selectedRecord ? getPartnerData(selectedRecord) : null;
  const partnerDocFront = selectedRecord?.partner_document_front || partner?.documentFront || partner?.document_front || null;
  const partnerDocBack = selectedRecord?.partner_document_back || partner?.documentBack || partner?.document_back || null;

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
                Permanent SQLite database storing sequential registration numbers, primary & partner ID photos, and digital signatures.
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
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Partner IDs Captured</p>
            <p className="text-2xl font-black text-purple-700 mt-1">
              {records.filter(r => r.has_partner_doc === 1 || r.partner_document_front || r.accompanying_guest?.documentFront).length}
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Signatures Attached</p>
            <p className="text-2xl font-black text-emerald-800 mt-1">
              {records.filter(r => r.has_signature === 1 || r.has_checkout_signature === 1 || r.signature).length}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <PenTool className="h-5 w-5" />
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
                <th className="px-4 py-3.5">Primary Guest & Partner</th>
                <th className="px-4 py-3.5">Residential Address</th>
                <th className="px-4 py-3.5">Govt ID Proofs</th>
                <th className="px-4 py-3.5 text-center">Digital Signatures</th>
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
                records.map((r) => {
                  const rPartner = getPartnerData(r);
                  const hasPartnerDoc = (r.has_partner_doc === 1) || !!r.partner_document_front || !!r.partner_document_back || !!rPartner?.documentFront || !!rPartner?.document_front;
                  const hasCheckoutSig = (r.has_checkout_signature === 1) || !!r.checkout_signature;

                  return (
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
                        {rPartner && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50/80 border border-indigo-200 px-1.5 py-0.5 rounded w-fit font-medium">
                            <Users className="h-2.5 w-2.5" /> Partner: {rPartner.name}
                          </div>
                        )}
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
                        <div className="flex flex-wrap gap-1 mt-1">
                          {r.has_doc_front === 1 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              Primary Front
                            </span>
                          )}
                          {r.has_doc_back === 1 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Primary Back
                            </span>
                          )}
                          {hasPartnerDoc && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-0.5">
                              Partner ID Photo
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {r.has_signature === 1 || r.signature ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" /> Check-In Signed
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No in-sig</span>
                          )}

                          {hasCheckoutSig ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                              <PenTool className="h-3 w-3" /> Check-Out Signed
                            </span>
                          ) : r.status === 'CHECKED_OUT' ? (
                            <span className="text-[9px] text-slate-400">Departed</span>
                          ) : null}
                        </div>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Full View Modal */}
      {modalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
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
                    {selectedRecord.checked_out_at && ` • Checked out on ${new Date(selectedRecord.checked_out_at).toLocaleString('en-IN')}`}
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

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Personal & Stay Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Phone</span>
                  <p className="font-bold text-slate-900">{selectedRecord.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Primary ID Proof</span>
                  <p className="font-bold text-slate-900">{selectedRecord.id_type || 'Govt ID'}</p>
                  <p className="font-mono text-slate-600 text-[11px]">{selectedRecord.id_number || '—'}</p>
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

              {/* 1. Primary Guest Uploaded Documents */}
              <div>
                <h4 className="font-extrabold uppercase text-[11px] tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-indigo-600" /> Primary Guest Identity Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedRecord.document_front ? (
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-600">Front Side ID Photo</span>
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ url: selectedRecord.document_front, title: `${selectedRecord.guest_name} - Front ID` })}
                          className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <ZoomIn className="h-3 w-3" /> Full Size
                        </button>
                      </div>
                      <img
                        src={selectedRecord.document_front}
                        alt="Primary Front"
                        onClick={() => setLightboxImage({ url: selectedRecord.document_front, title: `${selectedRecord.guest_name} - Front ID` })}
                        className="max-h-48 w-full rounded-lg object-contain border border-slate-200 bg-white cursor-pointer hover:opacity-95 transition-opacity"
                      />
                    </div>
                  ) : (
                    <div className="h-36 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/50">
                      <ImageIcon className="h-6 w-6 text-slate-300 mb-1" />
                      No front document photo uploaded
                    </div>
                  )}

                  {selectedRecord.document_back ? (
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-600">Back Side ID Photo</span>
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ url: selectedRecord.document_back, title: `${selectedRecord.guest_name} - Back ID` })}
                          className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <ZoomIn className="h-3 w-3" /> Full Size
                        </button>
                      </div>
                      <img
                        src={selectedRecord.document_back}
                        alt="Primary Back"
                        onClick={() => setLightboxImage({ url: selectedRecord.document_back, title: `${selectedRecord.guest_name} - Back ID` })}
                        className="max-h-48 w-full rounded-lg object-contain border border-slate-200 bg-white cursor-pointer hover:opacity-95 transition-opacity"
                      />
                    </div>
                  ) : (
                    <div className="h-36 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/50">
                      <ImageIcon className="h-6 w-6 text-slate-300 mb-1" />
                      No back document photo uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Accompanying Partner Identity Documents & Details */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold uppercase text-[11px] tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-purple-600" /> Accompanying Partner Details & ID Documents
                  </h4>
                  {partner && (
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 font-bold text-[10px]">
                      Partner Verified
                    </Badge>
                  )}
                </div>

                {partner ? (
                  <div className="space-y-3">
                    {/* Partner Details Card */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-purple-50/60 p-3 rounded-xl border border-purple-200">
                      <div>
                        <span className="text-[9px] text-purple-700 font-bold uppercase">Partner Name</span>
                        <p className="font-bold text-slate-900 mt-0.5">{partner.name || 'Accompanying'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-purple-700 font-bold uppercase">Age / Gender</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{partner.age || '24'} yrs / {partner.gender || 'Female'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-purple-700 font-bold uppercase">Relationship</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{partner.relation || 'Partner'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-purple-700 font-bold uppercase">ID Type & Number</span>
                        <p className="font-bold text-slate-900 mt-0.5">{partner.idType || 'Aadhaar'}</p>
                        <p className="font-mono text-slate-600 text-[11px]">{partner.idNumber || '—'}</p>
                      </div>
                    </div>

                    {/* Partner ID Photos (Front & Back) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {partnerDocFront ? (
                        <div className="border-2 border-purple-200 rounded-xl p-3 bg-purple-50/20 flex flex-col items-center">
                          <div className="w-full flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-purple-900">Partner ID Front Photo</span>
                            <button
                              type="button"
                              onClick={() => setLightboxImage({ url: partnerDocFront, title: `Partner ${partner.name} - Front ID` })}
                              className="text-[10px] text-purple-700 font-bold hover:underline flex items-center gap-1"
                            >
                              <ZoomIn className="h-3 w-3" /> Full Size
                            </button>
                          </div>
                          <img
                            src={partnerDocFront}
                            alt="Partner Front ID"
                            onClick={() => setLightboxImage({ url: partnerDocFront, title: `Partner ${partner.name} - Front ID` })}
                            className="max-h-48 w-full rounded-lg object-contain border border-purple-200 bg-white cursor-pointer hover:opacity-95 transition-opacity"
                          />
                        </div>
                      ) : (
                        <div className="h-36 border-2 border-dashed border-purple-200 rounded-xl flex flex-col items-center justify-center text-purple-600 text-xs bg-purple-50/30">
                          <ImageIcon className="h-6 w-6 text-purple-300 mb-1" />
                          Partner front ID photo not uploaded
                        </div>
                      )}

                      {partnerDocBack ? (
                        <div className="border-2 border-purple-200 rounded-xl p-3 bg-purple-50/20 flex flex-col items-center">
                          <div className="w-full flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-purple-900">Partner ID Back Photo</span>
                            <button
                              type="button"
                              onClick={() => setLightboxImage({ url: partnerDocBack, title: `Partner ${partner.name} - Back ID` })}
                              className="text-[10px] text-purple-700 font-bold hover:underline flex items-center gap-1"
                            >
                              <ZoomIn className="h-3 w-3" /> Full Size
                            </button>
                          </div>
                          <img
                            src={partnerDocBack}
                            alt="Partner Back ID"
                            onClick={() => setLightboxImage({ url: partnerDocBack, title: `Partner ${partner.name} - Back ID` })}
                            className="max-h-48 w-full rounded-lg object-contain border border-purple-200 bg-white cursor-pointer hover:opacity-95 transition-opacity"
                          />
                        </div>
                      ) : (
                        <div className="h-36 border-2 border-dashed border-purple-200 rounded-xl flex flex-col items-center justify-center text-purple-600 text-xs bg-purple-50/30">
                          <ImageIcon className="h-6 w-6 text-purple-300 mb-1" />
                          Partner back ID photo not uploaded
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-center text-xs">
                    Single Guest Stay — No accompanying partner registered for this booking.
                  </div>
                )}
              </div>

              {/* 3. Legally Verified Digital Signatures (Check-In & Check-Out) */}
              <div className="border-t border-slate-200 pt-5">
                <h4 className="font-extrabold uppercase text-[11px] tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Legally Verified Digital Signatures
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Check-In Signature */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Check-In Signature
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(selectedRecord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {selectedRecord.signature ? (
                      <div className="w-full flex flex-col items-center">
                        <img
                          src={selectedRecord.signature}
                          alt="Check-In Signature"
                          onClick={() => setLightboxImage({ url: selectedRecord.signature, title: `${selectedRecord.guest_name} - Check-In Signature` })}
                          className="h-24 object-contain bg-white rounded border border-slate-200 w-full p-2 cursor-pointer hover:opacity-95"
                        />
                        <span className="text-[10px] font-bold text-emerald-800 mt-1.5 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Verified Check-In Consent
                        </span>
                      </div>
                    ) : (
                      <div className="h-24 w-full border border-dashed border-slate-200 rounded flex items-center justify-center text-slate-400 text-xs">
                        No check-in signature on file
                      </div>
                    )}
                  </div>

                  {/* Check-Out Signature */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                        <LogOut className="h-3 w-3 text-rose-600" /> Check-Out Departure Signature
                      </span>
                      {selectedRecord.checked_out_at && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(selectedRecord.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {selectedRecord.checkout_signature ? (
                      <div className="w-full flex flex-col items-center">
                        <img
                          src={selectedRecord.checkout_signature}
                          alt="Check-Out Signature"
                          onClick={() => setLightboxImage({ url: selectedRecord.checkout_signature, title: `${selectedRecord.guest_name} - Check-Out Signature` })}
                          className="h-24 object-contain bg-white rounded border border-purple-200 w-full p-2 cursor-pointer hover:opacity-95"
                        />
                        <span className="text-[10px] font-bold text-purple-800 mt-1.5 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Verified Departure & Handover
                        </span>
                      </div>
                    ) : (
                      <div className="h-24 w-full border border-dashed border-slate-200 rounded flex flex-col items-center justify-center text-slate-400 text-xs">
                        {selectedRecord.status === 'CHECKED_OUT' ? (
                          <span>Departure Cleared (Key Handover Confirmed)</span>
                        ) : (
                          <span className="italic text-amber-600">Active Stay — Departure signature pending checkout</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-white">
              <Button type="button" onClick={() => setModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2 border border-slate-700 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between p-3 border-b border-slate-800 text-white">
              <span className="text-xs font-bold tracking-tight">{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
