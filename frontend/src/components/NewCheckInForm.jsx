import React, { useState, useEffect } from 'react';
import { User, Users, Building2, Camera, Check, X, UserPlus, CreditCard, ShieldCheck, PenTool, RotateCcw, QrCode, Smartphone, Sparkles, Wifi } from 'lucide-react';
import { IDProofType } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import DocumentScannerZone from './DocumentScannerZone';
import SignatureModal from './SignatureModal';
import CounterQRModal from './CounterQRModal';
import { base64ToFile } from '../lib/imageCompressor';

export default function NewCheckInForm({ isOpen, onClose, vacantRooms, onCheckInComplete, hotel }) {
  const [resetKey, setResetKey] = useState(Date.now());
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(vacantRooms[0]?.number || '');
  const [stayType, setStayType] = useState('24 Hours Full Stay');
  const [roomRate, setRoomRate] = useState(vacantRooms[0]?.rate?.toString() || '1800');
  const [advancePaid, setAdvancePaid] = useState(vacantRooms[0]?.rate?.toString() || '1800');
  const [paymentMode, setPaymentMode] = useState('UPI / GPay');

  // Digital Signature & Uploaded Documents
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [primaryDocs, setPrimaryDocs] = useState({ front: null, back: null });
  const [partnerDocs, setPartnerDocs] = useState({ front: null, back: null });

  // Front-Desk QR Standee & Mobile Drop Relay State
  const [isStandeeModalOpen, setIsStandeeModalOpen] = useState(false);
  const [incomingPrimaryFiles, setIncomingPrimaryFiles] = useState([]);
  const [incomingPartnerFiles, setIncomingPartnerFiles] = useState([]);
  const [qrDropAlert, setQrDropAlert] = useState(null);

  // Polling for guest mobile document uploads while form is open
  useEffect(() => {
    if (!isOpen) return;
    const hotelId = hotel?.id || 'HTL-101';
    let isMounted = true;

    const pollDrops = async () => {
      try {
        const res = await fetch(`/api/qr-drop/latest/${encodeURIComponent(hotelId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.hasDrop && data.drop && isMounted) {
          const drop = data.drop;
          // Consume drop so reception doesn't process it repeatedly
          fetch(`/api/qr-drop/consume/${drop.dropId}`, { method: 'POST' }).catch(() => {});

          // Convert primary images to File objects
          const pFiles = [];
          if (drop.primaryFront) {
            const f = base64ToFile(drop.primaryFront, 'primary_front.jpg');
            if (f) pFiles.push(f);
          }
          if (drop.primaryBack) {
            const b = base64ToFile(drop.primaryBack, 'primary_back.jpg');
            if (b) pFiles.push(b);
          }
          if (pFiles.length > 0) {
            setIncomingPrimaryFiles(pFiles);
          }

          if (drop.guestName) {
            setPrimaryName(prev => prev || drop.guestName);
          }
          if (drop.guestPhone) {
            setPrimaryPhone(prev => prev || drop.guestPhone);
          }

          // Partner documents if included
          const partFiles = [];
          if (drop.partnerFront) {
            const pf = base64ToFile(drop.partnerFront, 'partner_front.jpg');
            if (pf) partFiles.push(pf);
          }
          if (drop.partnerBack) {
            const pb = base64ToFile(drop.partnerBack, 'partner_back.jpg');
            if (pb) partFiles.push(pb);
          }
          if (partFiles.length > 0) {
            setHasAccompanying(true);
            setIncomingPartnerFiles(partFiles);
          }

          // Audible notification chime
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
          } catch (e) {
            console.warn('Audio chime notice:', e);
          }

          setQrDropAlert({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            guest: drop.guestName || 'Guest Mobile',
            count: pFiles.length + partFiles.length
          });
        }
      } catch (err) {
        // Silently catch polling network hiccup
      }
    };

    const intervalId = setInterval(pollDrops, 2500);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isOpen, hotel?.id]);

  // Primary Guest
  const [primaryName, setPrimaryName] = useState('');
  const [primaryAge, setPrimaryAge] = useState('');
  const [primaryGender, setPrimaryGender] = useState('Male');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [primaryIdType, setPrimaryIdType] = useState('Aadhaar Card');
  const [primaryIdNumber, setPrimaryIdNumber] = useState('');
  const [primaryAddress, setPrimaryAddress] = useState('');
  const [primaryCity, setPrimaryCity] = useState('');
  const [isLocal, setIsLocal] = useState(false);

  // Accompanying Guest / Partner
  const [hasAccompanying, setHasAccompanying] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerAge, setPartnerAge] = useState('');
  const [partnerGender, setPartnerGender] = useState('Female');
  const [partnerRelation, setPartnerRelation] = useState('Partner / Couple');
  const [partnerIdType, setPartnerIdType] = useState('Aadhaar Card');
  const [partnerIdNumber, setPartnerIdNumber] = useState('');

  // Additional details
  const [comingFrom, setComingFrom] = useState('');
  const [goingTo, setGoingTo] = useState('');
  const [purpose, setPurpose] = useState('Personal / Tourism');
  const [vehicleNo, setVehicleNo] = useState('');
  const [idScanUploaded, setIdScanUploaded] = useState(false);

  const resetForm = () => {
    setSelectedRoomNumber(vacantRooms[0]?.number || '');
    setStayType('24 Hours Full Stay');
    setRoomRate(vacantRooms[0]?.rate?.toString() || '1800');
    setAdvancePaid(vacantRooms[0]?.rate?.toString() || '1800');
    setPaymentMode('UPI / GPay');
    setSignatureData(null);
    setPrimaryDocs({ front: null, back: null });
    setPartnerDocs({ front: null, back: null });
    setPrimaryName('');
    setPrimaryAge('');
    setPrimaryGender('Male');
    setPrimaryPhone('');
    setPrimaryIdType('Aadhaar Card');
    setPrimaryIdNumber('');
    setPrimaryAddress('');
    setPrimaryCity('');
    setIsLocal(false);
    setHasAccompanying(false);
    setPartnerName('');
    setPartnerAge('');
    setPartnerGender('Female');
    setPartnerRelation('Partner / Couple');
    setPartnerIdType('Aadhaar Card');
    setPartnerIdNumber('');
    setComingFrom('');
    setGoingTo('');
    setPurpose('Personal / Tourism');
    setVehicleNo('');
    setIdScanUploaded(false);
    setResetKey(Date.now());
  };

  // Auto-reset whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrimaryOcrExtract = (parsed) => {
    if (parsed.name) setPrimaryName(parsed.name);
    if (parsed.idType) setPrimaryIdType(parsed.idType);
    if (parsed.idNumber) setPrimaryIdNumber(parsed.idNumber);
    if (parsed.age) setPrimaryAge(parsed.age);
    if (parsed.gender) setPrimaryGender(parsed.gender);
    if (parsed.address) setPrimaryAddress(parsed.address);
    if (parsed.city) setPrimaryCity(parsed.city);
    setIdScanUploaded(true);
  };

  const handlePartnerOcrExtract = (parsed) => {
    if (parsed.name) setPartnerName(parsed.name);
    if (parsed.idType) setPartnerIdType(parsed.idType);
    if (parsed.idNumber) setPartnerIdNumber(parsed.idNumber);
    if (parsed.age) setPartnerAge(parsed.age);
    if (parsed.gender) setPartnerGender(parsed.gender);
  };

  const handleRoomChange = (roomNo) => {
    setSelectedRoomNumber(roomNo);
    const rm = vacantRooms.find(r => r.number === roomNo);
    if (rm) {
      setRoomRate(rm.rate.toString());
      setAdvancePaid(rm.rate.toString());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!primaryName || !primaryPhone || !primaryIdNumber) {
      alert('Please fill primary guest name, phone, and ID proof number.');
      return;
    }

    const checkInData = {
      roomNumber: selectedRoomNumber,
      stayType,
      roomRate: Number(roomRate),
      advancePaid: Number(advancePaid),
      paymentMode,
      comingFrom: comingFrom || 'Direct Check-in',
      goingTo: goingTo || 'Direct Check-in',
      purpose,
      vehicleNo: vehicleNo || 'N/A',
      documentFront: primaryDocs.front,
      documentBack: primaryDocs.back,
      signature: signatureData,
      primaryGuest: {
        name: primaryName,
        age: Number(primaryAge) || 25,
        gender: primaryGender,
        phone: primaryPhone,
        idType: primaryIdType,
        idNumber: primaryIdNumber,
        address: primaryAddress,
        city: primaryCity,
        isLocal,
      },
      partnerDocumentFront: partnerDocs.front || null,
      partnerDocumentBack: partnerDocs.back || null,
      accompanyingGuest: (hasAccompanying && (partnerName || partnerDocs.front)) ? {
        name: partnerName || 'Accompanying Partner',
        age: Number(partnerAge) || 24,
        gender: partnerGender || 'Female',
        relation: partnerRelation || 'Partner / Couple',
        idType: partnerIdType || 'Aadhaar Card',
        idNumber: partnerIdNumber || 'Verified ID',
        address: primaryAddress,
        city: primaryCity,
        documentFront: partnerDocs.front,
        documentBack: partnerDocs.back,
      } : null,
    };

    onCheckInComplete(checkInData);
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                New Guest / Couple Check-In Registration
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                First time visitor registration & statutory Police ID capture
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            onClick={() => { resetForm(); onClose(); }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mobile QR Live Drop Status & Standee Banner */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-sky-50/80 to-purple-50/90 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-950 uppercase tracking-tight">Front-Desk QR Standee Self-Upload</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Relay Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Guest scans counter QR on mobile → documents arrive here & auto-fill via AI OCR.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setIsStandeeModalOpen(true)}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Smartphone className="h-3.5 w-3.5" /> Print / View Standee QR
            </Button>
          </div>

          {qrDropAlert && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-emerald-600 animate-bounce shrink-0" />
                <span>
                  🎉 <strong>New Guest Drop Received!</strong> Documents uploaded from guest mobile ({qrDropAlert.guest}) at {qrDropAlert.time}. AI OCR Auto-Fill started!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQrDropAlert(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-0.5 text-[11px] rounded bg-emerald-100 hover:bg-emerald-200"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Section 1: Primary Guest Details */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" /> Primary Guest Details (Mandatory for Police Register)
            </h3>

            {/* Document Photo Upload & OCR Auto-Fill Zone (2 Photos: Front & Back) */}
            <DocumentScannerZone
              key={`primary-${resetKey}`}
              label="Primary Guest Document — Auto Scan & Fill"
              targetGuestName="Primary Guest"
              accentColor="indigo"
              incomingFiles={incomingPrimaryFiles}
              onApplyExtractedData={handlePrimaryOcrExtract}
              onDocumentsChange={(docs) => setPrimaryDocs(docs)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                <Input 
                  type="text"
                  className="h-9 text-xs"
                  placeholder="e.g. Rahul Sharma"
                  value={primaryName}
                  onChange={(e) => setPrimaryName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mobile Number *</label>
                <Input 
                  type="tel"
                  className="h-9 text-xs"
                  placeholder="e.g. 9876543210"
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Age & Gender</label>
                <div className="flex gap-2">
                  <Input 
                    type="number"
                    className="h-9 text-xs w-24"
                    placeholder="Age"
                    value={primaryAge}
                    onChange={(e) => setPrimaryAge(e.target.value)}
                  />
                  <select 
                    className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600"
                    value={primaryGender}
                    onChange={(e) => setPrimaryGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Govt ID Proof Type *</label>
                <select 
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600"
                  value={primaryIdType}
                  onChange={(e) => setPrimaryIdType(e.target.value)}
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Voter ID">Voter ID Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                  <option value="PAN Card">PAN Card</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">ID Document Number *</label>
                <Input 
                  type="text"
                  className="h-9 text-xs"
                  placeholder="e.g. 4532 8910 2241"
                  value={primaryIdNumber}
                  onChange={(e) => setPrimaryIdNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">ID Photo Status</label>
                <Button 
                  type="button" 
                  variant={idScanUploaded ? "emerald" : "outline"}
                  className="w-full h-9 text-xs"
                  onClick={() => setIdScanUploaded(!idScanUploaded)}
                >
                  {idScanUploaded ? <><Check className="h-4 w-4" /> ID Photo Uploaded</> : <><Camera className="h-4 w-4" /> Capture / Upload</>}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Permanent Residential Address</label>
                <Input 
                  type="text"
                  className="h-9 text-xs"
                  placeholder="Flat/House No, Street, Landmark"
                  value={primaryAddress}
                  onChange={(e) => setPrimaryAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">City & State</label>
                <Input 
                  type="text"
                  className="h-9 text-xs"
                  placeholder="e.g. New Delhi, Delhi"
                  value={primaryCity}
                  onChange={(e) => setPrimaryCity(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Accompanying Partner Details */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" /> Partner B / Accompanying Person Details
              </h3>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  checked={hasAccompanying}
                  onChange={(e) => setHasAccompanying(e.target.checked)}
                />
                Couple / Partner B Present
              </label>
            </div>

            {hasAccompanying && (
              <div className="space-y-4 pt-2">
                {/* Document Photo Upload & OCR Zone for Partner B */}
                <DocumentScannerZone
                  key={`partner-${resetKey}`}
                  label="Partner B Document — Auto Scan & Fill"
                  targetGuestName="Partner B"
                  accentColor="emerald"
                  incomingFiles={incomingPartnerFiles}
                  onApplyExtractedData={handlePartnerOcrExtract}
                  onDocumentsChange={(docs) => setPartnerDocs(docs)}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Partner Name</label>
                    <Input 
                      type="text"
                      className="h-9 text-xs"
                      placeholder="e.g. Priya Verma"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Age & Gender</label>
                    <div className="flex gap-2">
                      <Input 
                        type="number"
                        className="h-9 text-xs w-24"
                        placeholder="Age"
                        value={partnerAge}
                        onChange={(e) => setPartnerAge(e.target.value)}
                      />
                      <select 
                        className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                        value={partnerGender}
                        onChange={(e) => setPartnerGender(e.target.value)}
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Relation / Category</label>
                    <select 
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                      value={partnerRelation}
                      onChange={(e) => setPartnerRelation(e.target.value)}
                    >
                      <option value="Partner / Couple">Partner / Couple</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Friend">Friend</option>
                      <option value="Family Member">Family Member</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Partner ID Proof Type</label>
                    <select 
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                      value={partnerIdType}
                      onChange={(e) => setPartnerIdType(e.target.value)}
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Partner ID Number</label>
                    <Input 
                      type="text"
                      className="h-9 text-xs"
                      placeholder="e.g. 7812 9043 1120"
                      value={partnerIdNumber}
                      onChange={(e) => setPartnerIdNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Room, Payment & Visit Info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" /> Room Assignment & Tariff
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Select Room *</label>
                <select 
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                  value={selectedRoomNumber}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  required
                >
                  {vacantRooms.map(r => (
                    <option key={r.id} value={r.number}>
                      Room {r.number} ({r.type} - ₹{r.rate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Stay Package / Slot</label>
                <select 
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                  value={stayType}
                  onChange={(e) => setStayType(e.target.value)}
                >
                  <option value="3 Hours Express">3 Hours Express</option>
                  <option value="6 Hours Flexi">6 Hours Flexi</option>
                  <option value="12 Hours Day Stay">12 Hours Day Stay</option>
                  <option value="24 Hours Full Stay">24 Hours Full Stay</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Advance Received (₹)</label>
                <Input 
                  type="number"
                  className="h-9 text-xs"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Coming From</label>
                <Input 
                  type="text"
                  className="h-9 text-xs"
                  placeholder="e.g. Delhi / Pune"
                  value={comingFrom}
                  onChange={(e) => setComingFrom(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Going To</label>
                <Input 
                  type="text"
                  className="h-9 text-xs"
                  placeholder="e.g. Local City / Next destination"
                  value={goingTo}
                  onChange={(e) => setGoingTo(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Vehicle Number (Optional)</label>
                <Input 
                  type="text"
                  className="h-9 text-xs"
                  placeholder="e.g. DL-01-AB-1234"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Digital Signature */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <PenTool className="h-4 w-4 text-indigo-600" /> Guest Digital Signature (Sign-on-Screen)
              </h3>
              {signatureData ? (
                <Badge className="bg-emerald-600 text-white font-bold text-xs gap-1.5 px-3 py-1">
                  <Check className="h-3.5 w-3.5" /> Signature Recorded
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-500 font-semibold text-xs">
                  Pending Signature
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              {signatureData ? (
                <div className="relative group border-2 border-emerald-300 rounded-xl p-3 bg-emerald-50/20 shadow-xs">
                  <img
                    src={signatureData}
                    alt="Guest Signature"
                    className="h-24 max-w-[240px] object-contain"
                  />
                </div>
              ) : (
                <div className="h-24 w-56 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/60">
                  <PenTool className="h-6 w-6 mb-1.5 opacity-40 text-slate-500" />
                  <span className="font-medium">No signature captured</span>
                </div>
              )}

              <div className="space-y-2 text-center sm:text-left flex-1">
                <p className="text-sm font-bold text-slate-800">
                  {signatureData ? 'Digital signature is successfully recorded and linked' : 'Tap below to open signature window for guest'}
                </p>
                <p className="text-xs text-slate-500">
                  The guest can sign using touch on mobile/tablet or mouse on computer. The digital signature is stored directly with their ID proof in the sequential hotel database.
                </p>
                <div className="flex gap-2.5 pt-1 justify-center sm:justify-start">
                  <Button
                    type="button"
                    onClick={() => setIsSignatureModalOpen(true)}
                    variant="outline"
                    className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold px-4 py-2"
                  >
                    <PenTool className="h-4 w-4" />
                    {signatureData ? '✍️ Re-sign / Modify Signature' : '✍️ Open Signature Window'}
                  </Button>
                  {signatureData && (
                    <Button
                      type="button"
                      onClick={() => setSignatureData(null)}
                      variant="ghost"
                      className="text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Clear Signature
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              className="text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border-slate-300 gap-1.5"
              onClick={resetForm}
            >
              <RotateCcw className="h-4 w-4" /> Clear / Reset Form
            </Button>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }}>
                Cancel
              </Button>
              <Button type="submit" variant="emerald" size="lg" className="px-6 font-extrabold shadow-sm">
                <Check className="h-4 w-4" /> Save Registration & Check In
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Interactive Digital Signature Modal Window */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={(sig) => setSignatureData(sig)}
        existingSignature={signatureData}
      />

      {/* Front-Desk QR Standee Generator & Print Modal */}
      <CounterQRModal
        isOpen={isStandeeModalOpen}
        onClose={() => setIsStandeeModalOpen(false)}
        hotel={hotel}
      />
    </div>
  );
}
