import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Upload, CheckCircle2, ShieldCheck, AlertCircle, Sparkles, Building2, User, Users, RefreshCw, X, ArrowRight } from 'lucide-react';
import { compressImageForOCR } from '../../lib/imageCompressor';
import { hotelService } from '../../services/hotelService';
import { authService } from '../../services/authService';

export default function GuestUploadPortal() {
  const urlParams = new URLSearchParams(window.location.search);
  const hotelIdParam = urlParams.get('hotelId') || urlParams.get('hotel') || 'HTL-101';

  // Get hotel branding
  const [hotelInfo, setHotelInfo] = useState({
    name: 'Hotel Front Desk',
    id: hotelIdParam,
    address: 'Guest Check-In Counter'
  });

  useEffect(() => {
    try {
      const allHotels = authService.getAllHotels ? authService.getAllHotels() : [];
      const match = allHotels.find(h => h.id === hotelIdParam);
      if (match) {
        setHotelInfo({
          name: match.name,
          id: match.id,
          address: match.address || 'Front Desk Counter'
        });
      }
    } catch (e) {
      console.warn('Could not load hotel info:', e);
    }
  }, [hotelIdParam]);

  // Guest upload states
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Primary Guest Docs
  const [primaryFront, setPrimaryFront] = useState(null); // { file, preview, base64 }
  const [primaryBack, setPrimaryBack] = useState(null);

  // Accompanying Partner Docs
  const [includePartner, setIncludePartner] = useState(false);
  const [partnerFront, setPartnerFront] = useState(null);
  const [partnerBack, setPartnerBack] = useState(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Helper to read and compress file to base64
  const processImageFile = async (file) => {
    if (!file) return null;
    try {
      const compressed = await compressImageForOCR(file, 1600, 0.90);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            file: compressed,
            preview: URL.createObjectURL(compressed),
            base64: reader.result
          });
        };
        reader.readAsDataURL(compressed);
      });
    } catch (err) {
      console.error('Compression error:', err);
      return null;
    }
  };

  const handleCapture = async (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const processed = await processImageFile(file);
    if (processed) {
      setter(processed);
      setErrorMessage('');
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!primaryFront) {
      setErrorMessage('Please upload at least the Front side of your Primary ID document.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        hotelId: hotelInfo.id,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        primaryFront: primaryFront.base64,
        primaryBack: primaryBack ? primaryBack.base64 : null,
        partnerFront: (includePartner && partnerFront) ? partnerFront.base64 : null,
        partnerBack: (includePartner && partnerBack) ? partnerBack.base64 : null,
      };

      // Attempt POST to backend
      let res = null;
      try {
        res = await fetch('/api/qr-drop/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch {
        // Fallback to local network port 8008 if on mobile LAN
        const hostname = window.location.hostname || '127.0.0.1';
        res = await fetch(`http://${hostname}:8008/api/qr-drop/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res && res.ok) {
        setIsSuccess(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to deliver documents to the reception desk. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Network error: Unable to reach hotel reception. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setPrimaryFront(null);
    setPrimaryBack(null);
    setPartnerFront(null);
    setPartnerBack(null);
    setGuestName('');
    setGuestPhone('');
    setIncludePartner(false);
    setIsSuccess(false);
    setErrorMessage('');
  };

  // SUCCESS SCREEN (Clean English)
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-500/10">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Transfer Complete
            </span>

            <h1 className="text-2xl font-black text-white tracking-tight mb-2">
              Documents Submitted!
            </h1>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Your identity documents have been securely received at the front desk of <strong className="text-white font-bold">{hotelInfo.name}</strong>.
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-left text-xs space-y-2.5 mb-6">
              <div className="flex justify-between text-slate-400">
                <span>Hotel Identifier:</span>
                <span className="font-mono font-bold text-white">{hotelInfo.id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Uploaded Documents:</span>
                <span className="font-bold text-emerald-400">
                  {primaryFront ? 'Primary ID' : ''} {primaryBack ? '+ Back' : ''} {partnerFront ? '+ Partner ID' : ''}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Next Step:</span>
                <span className="font-semibold text-amber-300">Notify Reception Desk</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-6 italic leading-relaxed">
              "Please notify the front desk executive that you have submitted your ID via mobile. The AI system will process your check-in instantly."
            </p>

            <button
              onClick={handleResetForNext}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-700 hover:bg-slate-600 text-white transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Upload Another ID
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500 pb-2">
          Powered by <strong className="text-slate-400">Guestbooks AI</strong> • Secure Gov-Compliant Verification
        </div>
      </div>
    );
  }

  // UPLOAD FORM SCREEN (Clean English)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-5 font-sans">
      <div className="max-w-md w-full mx-auto pb-10">
        
        {/* Branding & Header */}
        <div className="text-center pt-4 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Building2 className="w-3.5 h-3.5" /> Front-Desk Self Check-In
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            {hotelInfo.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure digital ID verification compliant with statutory hotel laws
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* SECTION 1: PRIMARY GUEST ID */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <User className="w-4 h-4" /> 1. Primary Guest ID *
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                Required
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Please take or upload clear photos of your Aadhaar Card, Passport, Voter ID, or Driving License:
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Front Side */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Front Side *</span>
                  {primaryFront && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </label>
                
                {primaryFront ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-indigo-500 aspect-[4/3] bg-black">
                    <img src={primaryFront.preview} alt="Front" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPrimaryFront(null)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-red-600 rounded-full text-white transition-colors"
                      title="Remove and choose another"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-mono bg-black/75 px-1.5 py-0.5 rounded text-emerald-300">
                      FRONT OK
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between border-2 border-dashed border-slate-700 hover:border-indigo-400 rounded-xl aspect-[4/3] bg-slate-800/60 p-2 text-center transition-colors">
                    <div className="my-auto grid grid-cols-2 gap-1.5 w-full">
                      {/* Live Camera Option */}
                      <label className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 cursor-pointer active:scale-95 transition-all text-center">
                        <Camera className="w-5 h-5 mb-1 text-indigo-400" />
                        <span className="text-[10px] font-bold text-white leading-tight">Camera</span>
                        <span className="text-[8px] text-indigo-300/80 mt-0.5">Take photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleCapture(e, setPrimaryFront)}
                        />
                      </label>

                      {/* Phone Gallery / Storage Option */}
                      <label className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 cursor-pointer active:scale-95 transition-all text-center">
                        <ImageIcon className="w-5 h-5 mb-1 text-emerald-400" />
                        <span className="text-[10px] font-bold text-white leading-tight">Gallery</span>
                        <span className="text-[8px] text-slate-400 mt-0.5">From device</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleCapture(e, setPrimaryFront)}
                        />
                      </label>
                    </div>
                    <span className="text-[9px] text-slate-400 shrink-0">Front side with photo</span>
                  </div>
                )}
              </div>

              {/* Back Side */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Back Side (Address)</span>
                  {primaryBack && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </label>
                
                {primaryBack ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-indigo-500 aspect-[4/3] bg-black">
                    <img src={primaryBack.preview} alt="Back" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPrimaryBack(null)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-red-600 rounded-full text-white transition-colors"
                      title="Remove and choose another"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-mono bg-black/75 px-1.5 py-0.5 rounded text-emerald-300">
                      BACK OK
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl aspect-[4/3] bg-slate-800/60 p-2 text-center transition-colors">
                    <div className="my-auto grid grid-cols-2 gap-1.5 w-full">
                      {/* Live Camera Option */}
                      <label className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 cursor-pointer active:scale-95 transition-all text-center">
                        <Camera className="w-5 h-5 mb-1 text-slate-300" />
                        <span className="text-[10px] font-bold text-white leading-tight">Camera</span>
                        <span className="text-[8px] text-indigo-300/80 mt-0.5">Take photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleCapture(e, setPrimaryBack)}
                        />
                      </label>

                      {/* Phone Gallery / Storage Option */}
                      <label className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 cursor-pointer active:scale-95 transition-all text-center">
                        <ImageIcon className="w-5 h-5 mb-1 text-emerald-400" />
                        <span className="text-[10px] font-bold text-white leading-tight">Gallery</span>
                        <span className="text-[8px] text-slate-400 mt-0.5">From device</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleCapture(e, setPrimaryBack)}
                        />
                      </label>
                    </div>
                    <span className="text-[9px] text-slate-400 shrink-0">For address & pin</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: ACCOMPANYING / PARTNER GUEST ID (OPTIONAL) */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Users className="w-4 h-4" /> 2. Accompanying Guest / Partner ID
              </span>
              <button
                type="button"
                onClick={() => setIncludePartner(!includePartner)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                  includePartner
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {includePartner ? '✓ Added' : '+ Add Partner ID'}
              </button>
            </div>

            {includePartner && (
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <p className="text-[11px] text-slate-400">
                  Upload ID photos for the accompanying guest or partner:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {/* Partner Front */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                      <span>Partner Front Photo</span>
                      {partnerFront && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </label>
                    {partnerFront ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 aspect-[4/3] bg-black">
                        <img src={partnerFront.preview} alt="Partner Front" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPartnerFront(null)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-red-600 rounded-full text-white transition-colors"
                          title="Remove and choose another"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1.5 text-[9px] font-mono bg-black/75 px-1.5 py-0.5 rounded text-emerald-300">
                          FRONT OK
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-between border-2 border-dashed border-slate-700 hover:border-emerald-400 rounded-xl aspect-[4/3] bg-slate-800/60 p-2 text-center transition-colors">
                        <div className="my-auto grid grid-cols-2 gap-1.5 w-full">
                          {/* Live Camera Option */}
                          <label className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 cursor-pointer active:scale-95 transition-all text-center">
                            <Camera className="w-5 h-5 mb-1 text-emerald-400" />
                            <span className="text-[10px] font-bold text-white leading-tight">Camera</span>
                            <span className="text-[8px] text-emerald-300/80 mt-0.5">Take photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handleCapture(e, setPartnerFront)}
                            />
                          </label>

                          {/* Phone Gallery / Storage Option */}
                          <label className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 cursor-pointer active:scale-95 transition-all text-center">
                            <ImageIcon className="w-5 h-5 mb-1 text-emerald-400" />
                            <span className="text-[10px] font-bold text-white leading-tight">Gallery</span>
                            <span className="text-[8px] text-slate-400 mt-0.5">From device</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleCapture(e, setPartnerFront)}
                            />
                          </label>
                        </div>
                        <span className="text-[9px] text-slate-400 shrink-0">Partner front photo</span>
                      </div>
                    )}
                  </div>

                  {/* Partner Back */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                      <span>Partner Back Photo</span>
                      {partnerBack && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </label>
                    {partnerBack ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 aspect-[4/3] bg-black">
                        <img src={partnerBack.preview} alt="Partner Back" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPartnerBack(null)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-red-600 rounded-full text-white transition-colors"
                          title="Remove and choose another"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1.5 text-[9px] font-mono bg-black/75 px-1.5 py-0.5 rounded text-emerald-300">
                          BACK OK
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-between border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl aspect-[4/3] bg-slate-800/60 p-2 text-center transition-colors">
                        <div className="my-auto grid grid-cols-2 gap-1.5 w-full">
                          {/* Live Camera Option */}
                          <label className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 cursor-pointer active:scale-95 transition-all text-center">
                            <Camera className="w-5 h-5 mb-1 text-slate-300" />
                            <span className="text-[10px] font-bold text-white leading-tight">Camera</span>
                            <span className="text-[8px] text-emerald-300/80 mt-0.5">Take photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handleCapture(e, setPartnerBack)}
                            />
                          </label>

                          {/* Phone Gallery / Storage Option */}
                          <label className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 cursor-pointer active:scale-95 transition-all text-center">
                            <ImageIcon className="w-5 h-5 mb-1 text-emerald-400" />
                            <span className="text-[10px] font-bold text-white leading-tight">Gallery</span>
                            <span className="text-[8px] text-slate-400 mt-0.5">From device</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleCapture(e, setPartnerBack)}
                            />
                          </label>
                        </div>
                        <span className="text-[9px] text-slate-400 shrink-0">Partner back photo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: OPTIONAL DETAILS */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              3. Contact Information (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-medium">Guest Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !primaryFront}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-xl ${
                !primaryFront
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : isSubmitting
                  ? 'bg-indigo-700 text-white cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white shadow-emerald-950/50'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Delivering Documents...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Submit to Reception Desk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-500 mt-2">
              🔒 Encrypted Transmission. Directly received at hotel reception desk.
            </p>
          </div>

        </form>
      </div>

      <div className="text-center text-[11px] text-slate-600 pb-2">
        Guestbooks Digital Check-In System • v2.4
      </div>
    </div>
  );
}
