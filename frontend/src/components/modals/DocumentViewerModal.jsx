import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Printer, 
  Lock, 
  FileText, 
  Building2, 
  CheckCircle2, 
  QrCode,
  Calendar,
  User,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export default function DocumentViewerModal({ isOpen, onClose, request }) {
  if (!isOpen || !request) return null;

  const handlePrintDossier = () => {
    window.print();
  };

  const docs = request.documents || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Top Official Police & Hotel Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300">
                <ShieldCheck className="h-7 w-7 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                    Form-C Statutory Record
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    <CheckCircle2 className="h-3 w-3" /> Released & Authorized
                  </span>
                </div>
                <h3 className="font-heading text-lg font-black text-white mt-1">
                  Official Guest Identity Dossier
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Case Ref: <strong className="text-white font-mono">{request.caseRef}</strong> | Station: <strong>{request.stationName}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintDossier}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 transition-all shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" /> Print Dossier
              </button>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Legal Chain of Custody Stamp */}
          <div className="mt-4 rounded-xl bg-indigo-900/40 border border-indigo-500/30 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-slate-400">Requisitioned by:</span>{' '}
              <strong className="text-indigo-200">{request.officerName}</strong> ({request.badgeNo})
            </div>
            <div>
              <span className="text-slate-400">Authorized by:</span>{' '}
              <strong className="text-emerald-300">{request.reviewedBy || 'Hotel Guestbooks Authority'}</strong>
            </div>
            <div>
              <span className="text-slate-400">Released on:</span>{' '}
              <span className="text-slate-200 font-mono">
                {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString('en-IN') : 'Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body with Released Documents */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50/50">
          
          {/* Watermark Banner */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900 flex items-center gap-2 font-medium">
            <Lock className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>CONFIDENTIAL POLICE COPY:</strong> This identity documentation is released exclusively for official inquiry <span className="font-mono font-bold text-amber-950">{request.caseRef}</span>. Reproduction or unverified distribution is strictly prohibited.
            </span>
          </div>

          {/* Render Each Released Document Card */}
          <div className="space-y-4">
            {docs.map((doc, idx) => (
              <div 
                key={idx} 
                className="rounded-2xl border-2 border-slate-300 bg-white p-5 shadow-sm relative overflow-hidden"
              >
                {/* Diagonal Watermark */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] rotate-[-20deg]">
                  <p className="text-6xl font-black uppercase text-slate-900 tracking-widest text-center">
                    POLICE VERIFIED<br />GUESTBOOKS HMS
                  </p>
                </div>

                {/* ID Header Bar */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                      {idx === 0 ? 'P1' : 'P2'}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{doc.type}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{doc.issuer || 'Statutory Government Authority'}</p>
                    </div>
                  </div>
                  <Badge variant="indigo" className="text-[10px] font-bold">
                    Official Copy
                  </Badge>
                </div>

                {/* ID Details Layout */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  
                  {/* Photo Column */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50">
                    <img 
                      src={doc.photoUrl} 
                      alt={doc.holderName} 
                      className="h-28 w-24 object-cover rounded-lg shadow-sm border border-slate-300"
                    />
                    <div className="mt-2 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-wider">
                      Photo Verified
                    </div>
                  </div>

                  {/* ID Data Column */}
                  <div className="md:col-span-2 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Full Name as per ID Proof</span>
                      <span className="font-extrabold text-slate-900 text-sm">{doc.holderName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Date of Birth / Age</span>
                        <span className="font-semibold text-slate-800">{doc.dob || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Gender</span>
                        <span className="font-semibold text-slate-800">{doc.gender || '—'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Government Document Number</span>
                      <span className="font-mono font-extrabold text-indigo-800 text-xs bg-indigo-50/80 px-2 py-1 rounded border border-indigo-200 inline-block">
                        {doc.idNumber}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Registered Address</span>
                      <span className="text-slate-700 leading-snug font-medium block">
                        {doc.address || 'Address verified from Aadhaar database'}
                      </span>
                    </div>
                  </div>

                  {/* QR & Statutory Seal Column */}
                  <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                    <div className="p-2 border border-slate-300 rounded-xl bg-white shadow-2xs">
                      <QrCode className="h-16 w-16 text-slate-800" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 mt-1">UIDAI / SECURE QR</span>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> E-Signed
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Room: RM-{request.roomNumber}</span>
                  <span>Hotel: {request.hotelName}</span>
                  <span className="text-indigo-600 font-bold">DIGITALLY ATTESTED COPY</span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <p className="text-xs text-slate-500">
            Official Requisition Log ID: <span className="font-mono font-bold text-slate-700">{request.id}</span>
          </p>
          <Button variant="secondary" onClick={onClose} className="font-bold text-xs">
            Close Viewer
          </Button>
        </div>

      </div>
    </div>
  );
}
