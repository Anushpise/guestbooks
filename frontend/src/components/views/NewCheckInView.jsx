import React, { useState, useEffect } from 'react';
import { 
  User, 
  Users, 
  Building2, 
  Camera, 
  Check, 
  UserPlus, 
  PenTool, 
  RotateCcw, 
  QrCode, 
  Smartphone, 
  Sparkles 
} from 'lucide-react';
import DocumentScannerZone from '../common/DocumentScannerZone';
import SignatureModal from '../modals/SignatureModal';
import CounterQRModal from '../modals/CounterQRModal';
import { base64ToFile } from '../../lib/imageCompressor';

export default function NewCheckInView({ vacantRooms, onCheckInComplete, hotel }) {
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

  // Polling for guest mobile document uploads
  useEffect(() => {
    const hotelId = hotel?.id || 'HTL-101';
    let isMounted = true;

    const pollDrops = async () => {
      try {
        const res = await fetch(`/api/qr-drop/latest/${encodeURIComponent(hotelId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.hasDrop && data.drop && isMounted) {
          const drop = data.drop;
          fetch(`/api/qr-drop/consume/${drop.dropId}`, { method: 'POST' }).catch(() => {});

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

          if (drop.guestName) setPrimaryName(prev => prev || drop.guestName);
          if (drop.guestPhone) setPrimaryPhone(prev => prev || drop.guestPhone);

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

          setQrDropAlert({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            guest: drop.guestName || 'Guest Mobile',
            count: pFiles.length + partFiles.length
          });
        }
      } catch (err) {
        // Silent catch
      }
    };

    const intervalId = setInterval(pollDrops, 2500);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [hotel?.id]);

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
    const rm = vacantRooms.find((r) => r.number === roomNo);
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
      accompanyingGuest:
        (hasAccompanying && (partnerName || partnerDocs.front))
          ? {
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
            }
          : null,
    };

    onCheckInComplete(checkInData);
    resetForm();
    alert(`Guest registration submitted! Room ${selectedRoomNumber} is now OCCUPIED.`);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Clean Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-[#0b3c33]" />
            New Guest Registration
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Guest ID verification & statutory Police Form C registration.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsStandeeModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs font-heading"
        >
          <Smartphone className="h-4 w-4 text-[#0b3c33]" />
          <span>Desk QR Standee</span>
        </button>
      </div>

      {qrDropAlert && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-emerald-600 animate-bounce shrink-0" />
            <span>
              🎉 <strong>New Guest Upload Received!</strong> Mobile document received from ({qrDropAlert.guest}). Auto-Fill complete.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setQrDropAlert(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-0.5 text-xs rounded bg-emerald-200/60 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-8">
        
        {/* Section 1: Primary Guest Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="h-4 w-4 text-[#0b3c33]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-heading">
              Primary Guest Information
            </h3>
          </div>

          {/* Document Upload & OCR Zone */}
          <DocumentScannerZone
            key={`primary-${resetKey}`}
            label="Primary Guest ID Document — Auto OCR Scan"
            targetGuestName="Primary Guest"
            accentColor="emerald"
            incomingFiles={incomingPrimaryFiles}
            onApplyExtractedData={handlePrimaryOcrExtract}
            onDocumentsChange={(docs) => setPrimaryDocs(docs)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name *</label>
              <input
                type="text"
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#0b3c33] outline-none font-medium shadow-2xs"
                placeholder="e.g. Rahul Sharma"
                value={primaryName}
                onChange={(e) => setPrimaryName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
              <input
                type="tel"
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#0b3c33] outline-none font-medium shadow-2xs"
                placeholder="e.g. 9876543210"
                value={primaryPhone}
                onChange={(e) => setPrimaryPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Age & Gender</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="w-24 h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#0b3c33] outline-none font-medium shadow-2xs"
                  placeholder="Age"
                  value={primaryAge}
                  onChange={(e) => setPrimaryAge(e.target.value)}
                />
                <select
                  className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0b3c33] shadow-2xs"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Govt ID Proof Type *</label>
              <select
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0b3c33] shadow-2xs"
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
              <label className="text-xs font-bold text-slate-700">ID Document Number *</label>
              <input
                type="text"
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#0b3c33] outline-none font-medium shadow-2xs font-mono"
                placeholder="e.g. 4532 8910 2241"
                value={primaryIdNumber}
                onChange={(e) => setPrimaryIdNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Address</label>
              <input
                type="text"
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#0b3c33] outline-none font-medium shadow-2xs"
                placeholder="Street address, House No"
                value={primaryAddress}
                onChange={(e) => setPrimaryAddress(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">City & State</label>
              <input
                type="text"
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#0b3c33] outline-none font-medium shadow-2xs"
                placeholder="e.g. New Delhi, Delhi"
                value={primaryCity}
                onChange={(e) => setPrimaryCity(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Accompanying Partner Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0b3c33]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-heading">
                Accompanying Guest / Partner
              </h3>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-[#0b3c33] focus:ring-[#0b3c33]"
                checked={hasAccompanying}
                onChange={(e) => setHasAccompanying(e.target.checked)}
              />
              <span>Add Second Guest / Partner</span>
            </label>
          </div>

          {hasAccompanying && (
            <div className="space-y-4 pt-2">
              <DocumentScannerZone
                key={`partner-${resetKey}`}
                label="Partner B Document — Auto Scan"
                targetGuestName="Partner B"
                accentColor="emerald"
                incomingFiles={incomingPartnerFiles}
                onApplyExtractedData={handlePartnerOcrExtract}
                onDocumentsChange={(docs) => setPartnerDocs(docs)}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Partner Full Name</label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#0b3c33] outline-none font-medium shadow-2xs"
                    placeholder="e.g. Priya Verma"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Age & Gender</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="w-24 h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#0b3c33] outline-none font-medium shadow-2xs"
                      placeholder="Age"
                      value={partnerAge}
                      onChange={(e) => setPartnerAge(e.target.value)}
                    />
                    <select
                      className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0b3c33] shadow-2xs"
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
                  <label className="text-xs font-bold text-slate-700">Relation</label>
                  <select
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0b3c33] shadow-2xs"
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
            </div>
          )}
        </div>

        {/* Section 3: Room Assignment */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="h-4 w-4 text-[#0b3c33]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-heading">
              Room Assignment & Tariff
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Select Room *</label>
              <select
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0b3c33] shadow-2xs"
                value={selectedRoomNumber}
                onChange={(e) => handleRoomChange(e.target.value)}
                required
              >
                {vacantRooms.map((r) => (
                  <option key={r.id} value={r.number}>
                    Room {r.number} ({r.type} - ₹{r.rate})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Stay Package</label>
              <select
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0b3c33] shadow-2xs"
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
              <label className="text-xs font-bold text-slate-700">Advance Paid (₹)</label>
              <input
                type="number"
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#0b3c33] outline-none font-mono font-bold shadow-2xs"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Digital Signature */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-[#0b3c33]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-heading">
                Digital Signature
              </h3>
            </div>
            {signatureData && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <Check className="h-3.5 w-3.5" /> Signature Recorded
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            {signatureData ? (
              <div className="border border-emerald-300 rounded-xl p-2 bg-white shadow-2xs">
                <img
                  src={signatureData}
                  alt="Signature"
                  className="h-20 max-w-[200px] object-contain"
                />
              </div>
            ) : (
              <div className="h-20 w-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs bg-white">
                <PenTool className="h-5 w-5 mb-1 opacity-50 text-slate-400" />
                <span className="font-medium text-[11px]">No signature</span>
              </div>
            )}

            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <p className="text-xs font-bold text-slate-800">
                {signatureData ? 'Digital signature captured' : 'Guest signs on screen or mobile tablet'}
              </p>
              <div className="flex gap-2 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer transition-colors"
                >
                  {signatureData ? '✍️ Re-Sign' : '✍️ Open Signature Pad'}
                </button>
                {signatureData && (
                  <button
                    type="button"
                    onClick={() => setSignatureData(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear Form
          </button>
          
          <button 
            type="submit" 
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0b3c33] hover:bg-[#072620] text-white font-extrabold text-xs transition-all cursor-pointer shadow-xs active:scale-95 font-heading"
          >
            <Check className="h-4 w-4 text-emerald-300" />
            <span>Save Registration & Check-In</span>
          </button>
        </div>
      </form>

      {/* Signature Modal */}
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
