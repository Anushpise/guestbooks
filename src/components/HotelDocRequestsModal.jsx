import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  FileText, 
  Eye, 
  Clock, 
  Building2, 
  Filter,
  AlertCircle
} from 'lucide-react';
import { hotelService } from '../services/hotelService';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function HotelDocRequestsModal({ isOpen, onClose, onViewDocument }) {
  if (!isOpen) return null;

  const [requests, setRequests] = useState(hotelService.getDocumentRequests());
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'PENDING', 'APPROVED', 'REJECTED'
  const [statusFeedback, setStatusFeedback] = useState('');

  const refreshRequests = () => {
    setRequests(hotelService.getDocumentRequests());
  };

  const handleApprove = (requestId, guestName) => {
    hotelService.approveDocumentRequest(requestId, 'StayLog Guestbooks Manager (Authorized)');
    refreshRequests();
    setStatusFeedback(`✓ Documents released successfully for ${guestName} to Police Department!`);
    setTimeout(() => setStatusFeedback(''), 3000);
  };

  const handleReject = (requestId, guestName) => {
    const reason = prompt('Please enter legal grounds for declining this document request (e.g. Requires court warrant / SHO written order):', 'Requires written judicial warrant or SHO signature');
    if (reason) {
      hotelService.rejectDocumentRequest(requestId, reason);
      refreshRequests();
      setStatusFeedback(`❌ Request declined for ${guestName}.`);
      setTimeout(() => setStatusFeedback(''), 3000);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
                <ShieldAlert className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                    Statutory Compliance
                  </span>
                  {pendingCount > 0 && (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700 animate-pulse">
                      {pendingCount} Pending Authorization
                    </span>
                  )}
                </div>
                <h3 className="font-heading text-lg font-black text-white mt-1">
                  Police Official ID Document Requests
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Authorize or Decline Physical ID Proof Sharing with Police Department
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Legal Safeguard Info Banner */}
        <div className="bg-amber-50 border-b border-amber-200 p-4 text-xs text-amber-900 flex items-start gap-3">
          <Lock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Guest Data Protection & Privacy Rule:</strong> Under data protection standards, guestbooks management does not automatically share physical ID card photos with police. Documents can only be released upon a verified officer requisition with an active Case / GD reference.
          </div>
        </div>

        {/* Feedback alert */}
        {statusFeedback && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
            {statusFeedback}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4">
          <div className="flex items-center gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'ALL' ? 'All Requests' : f}
                {f === 'PENDING' && pendingCount > 0 && ` (${pendingCount})`}
              </button>
            ))}
          </div>

          <span className="text-xs font-bold text-slate-500">
            {filteredRequests.length} Record{filteredRequests.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Requests List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No document requests matching filter.
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-200 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">
                      {req.id}
                    </span>
                    <span className="text-xs font-bold text-slate-500">• Case Ref:</span>
                    <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                      {req.caseRef}
                    </span>
                  </div>

                  <div>
                    {req.status === 'PENDING' && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-extrabold text-[11px] gap-1">
                        <Clock className="h-3 w-3" /> Awaiting Hotel Approval
                      </Badge>
                    )}
                    {req.status === 'APPROVED' && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold text-[11px] gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Approved & Released
                      </Badge>
                    )}
                    {req.status === 'REJECTED' && (
                      <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-extrabold text-[11px] gap-1">
                        <XCircle className="h-3 w-3" /> Request Declined
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {/* Left: Guest info */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Requested Guest Dossier</span>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm">{req.guestName}</span>
                      <span className="font-mono font-bold text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200">
                        RM-{req.roomNumber}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-600">{req.idTypeNo}</p>
                    <div className="text-[11px] text-slate-500">
                      Hotel: <strong>{req.hotelName}</strong>
                    </div>
                  </div>

                  {/* Right: Police Officer info */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Requesting Law Enforcement</span>
                    <div className="font-bold text-slate-900">{req.officerName} ({req.badgeNo})</div>
                    <div className="text-slate-600">{req.stationName}</div>
                    <div className="text-slate-500">
                      Reason: <strong className="text-slate-700">{req.reason}</strong>
                    </div>
                    {req.notes && (
                      <div className="text-[11px] text-slate-600 italic">"{req.notes}"</div>
                    )}
                  </div>
                </div>

                {/* Status Specific Review Info */}
                {req.status === 'APPROVED' && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] text-emerald-900 flex items-center justify-between">
                    <span>Authorized by: <strong>{req.reviewedBy}</strong> on {new Date(req.reviewedAt).toLocaleString('en-IN')}</span>
                    <Button
                      size="sm"
                      variant="emerald"
                      onClick={() => onViewDocument(req)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 py-1 h-7"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Released Documents
                    </Button>
                  </div>
                )}

                {req.status === 'REJECTED' && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-[11px] text-rose-900">
                    Declined reason: <strong>{req.rejectReason}</strong>
                  </div>
                )}

                {/* Actions for PENDING */}
                {req.status === 'PENDING' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <p className="text-[11px] text-slate-500">
                      Requested on: {new Date(req.requestedAt).toLocaleString('en-IN')}
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onViewDocument(req)}
                        className="text-xs font-bold gap-1 text-slate-700"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview Documents
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleReject(req.id, req.guestName)}
                        className="text-xs font-bold gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Decline Request
                      </Button>
                      <Button
                        size="sm"
                        variant="emerald"
                        onClick={() => handleApprove(req.id, req.guestName)}
                        className="text-xs font-extrabold gap-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Release Documents
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <p className="text-xs text-slate-500">
            Form-C Identity Sharing Audit Register
          </p>
          <Button variant="secondary" onClick={onClose} className="font-bold text-xs">
            Close
          </Button>
        </div>

      </div>
    </div>
  );
}
