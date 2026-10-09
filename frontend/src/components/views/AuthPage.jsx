import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  KeyRound, 
  UserPlus, 
  Lock, 
  Mail, 
  FileText, 
  UploadCloud, 
  ArrowRight, 
  Check 
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { authService } from '../../services/authService';
import { Badge } from '../ui/badge';

export default function AuthPage({ onLoginSuccess, onBackToLanding, initialMode = 'HOTEL_LOGIN' }) {
  const [authMode, setAuthMode] = useState(initialMode); // 'HOTEL_LOGIN', 'HOTEL_REGISTER', 'POLICE_LOGIN', 'ADMIN_LOGIN'
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sync mode with initialMode and route params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role') || params.get('mode') || '';

    if (roleParam === 'police' || initialMode === 'POLICE_LOGIN') {
      setAuthMode('POLICE_LOGIN');
    } else if (roleParam === 'admin' || initialMode === 'ADMIN_LOGIN') {
      setAuthMode('ADMIN_LOGIN');
    } else if (initialMode === 'HOTEL_REGISTER') {
      setAuthMode('HOTEL_REGISTER');
    } else {
      setAuthMode('HOTEL_LOGIN');
    }
  }, [initialMode]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Hotel Self-Registration form state
  const [regHotelName, setRegHotelName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPropertyType, setRegPropertyType] = useState('Hotel / Lodge Stay');
  const [regPlan, setRegPlan] = useState('Guestbooks Standard Plan (₹499/month)');
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [regDocumentFiles, setRegDocumentFiles] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Demo Login Handler
  const handleQuickLogin = async (email, password) => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      const res = await authService.login(email, password);
      if (res && res.success) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res?.message || 'Login failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Login Form
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail || !loginPassword) {
      setErrorMessage('Please enter both Email/Username and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.login(loginEmail, loginPassword);
      if (res && res.success) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res?.message || 'Invalid credentials or pending approval.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Hotel Registration Form
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regHotelName || !regOwnerName || !regEmail || !regPassword) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    const defaultDocs = [
      { name: `${regHotelName.replace(/\s+/g, '_')}_Trade_Permit.pdf`, size: '1.4 MB', type: 'PDF' },
      { name: 'Owner_Aadhaar_Verification.pdf', size: '890 KB', type: 'PDF' },
    ];

    const regData = {
      hotelName: regHotelName,
      ownerName: regOwnerName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      address: regAddress,
      propertyType: regPropertyType,
      subscriptionPlan: 'Guestbooks Standard Plan (₹499/month)',
      subscriptionAmount: 499,
      documents: regDocumentFiles.length > 0 ? regDocumentFiles : defaultDocs,
    };

    setIsSubmitting(true);
    try {
      const res = await authService.registerHotel(regData);
      if (res && res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          setAuthMode('HOTEL_LOGIN');
        }, 2500);
      } else {
        setErrorMessage(res?.message || 'Registration failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#0b3c33] selection:text-white">
      {/* Top Executive Header Navbar */}
      <header className="w-full bg-white border-b border-slate-200/80 shrink-0 shadow-2xs z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={onBackToLanding}>
            <img 
              src={logoImg} 
              alt="Guestbooks Logo" 
              className="h-12 sm:h-13 w-auto object-contain transition-all"
            />
          </div>

          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-full bg-slate-100/80 hover:bg-slate-200 border border-slate-200/80 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            >
              ← Back to Home
            </button>
          )}
        </div>
      </header>

      {/* Main Split Screen Container */}
      <main className="flex-1 w-full overflow-hidden flex flex-col lg:flex-row">
        
        {/* LEFT SIDE: Full-Bleed Edge-to-Edge Hotel Showcase */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 h-full flex-col justify-center relative p-10 sm:p-14 lg:pr-16 xl:pr-20 text-white overflow-hidden border-r border-slate-200/80 shrink-0">
          {/* Full-Bleed Resort Background Photo */}
          <img 
            src="/hotel_hero_bg.jpg" 
            alt="Luxury Resort Background" 
            className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700"
          />
          {/* Seamless Full-Panel Gradient Overlays for Flawless Image & Text Harmony */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/65 to-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />

          {/* Clean Typography & High Contrast Highlights Directly on Panel */}
          <div className="relative z-10 space-y-8 my-auto max-w-lg xl:max-w-xl pr-2 xl:pr-6">
            <div className="space-y-4">
              <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight font-heading leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                Next-Gen Digital Guest Registry & Stay Ledger
              </h2>
              <p className="text-xs sm:text-sm xl:text-base text-slate-100 font-medium leading-relaxed drop-shadow-[0_1px_5px_rgba(0,0,0,0.95)]">
                Streamline front-desk operations with 10-second Aadhaar & ID scanning, digital signatures, instant room matrix, and automated police reporting.
              </p>
            </div>

            {/* Seamless High-Contrast Bullet List */}
            <div className="space-y-5 pt-2">
              <div className="flex items-start gap-4">
                <div className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 shadow-lg shadow-emerald-950/60 border border-emerald-400">
                  <Check className="h-4 w-4 text-white stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">10-Second OCR ID Check-In</h4>
                  <p className="text-xs text-slate-200 font-normal leading-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">Auto-extract Aadhaar, Passport & Voter ID details instantly</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 shadow-lg shadow-emerald-950/60 border border-emerald-400">
                  <Check className="h-4 w-4 text-white stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">100% Police Station Compliant</h4>
                  <p className="text-xs text-slate-200 font-normal leading-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">Instant digital guest ledger formatted for station inspection</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 shadow-lg shadow-emerald-950/60 border border-emerald-400">
                  <Check className="h-4 w-4 text-white stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">Flat ₹499 / Month Subscription</h4>
                  <p className="text-xs text-slate-200 font-normal leading-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">Unlimited check-ins, room matrix & invoicing for your property</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Centered High-End Executive Form Card */}
        <div className="flex-1 h-full overflow-y-auto sm:overflow-hidden flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 bg-slate-50/70">
          <div className="w-full max-w-[480px] xl:max-w-lg bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 xl:p-10 shadow-xl shadow-slate-900/5 my-auto">
            
            {/* Header inside Card */}
            <div className="text-center mb-6">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                {authMode === 'ADMIN_LOGIN' ? 'Super Admin Control Center' :
                 authMode === 'POLICE_LOGIN' ? 'State Police Inspection Portal' :
                 authMode === 'HOTEL_REGISTER' ? 'Register Your Property' :
                 'Owner Sign In'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5">
                {authMode === 'HOTEL_REGISTER' ? 'Flat ₹499/month for your entire hotel' : 'Sign in to access your Guestbooks dashboard'}
              </p>
            </div>

            {/* Navigation Role Tabs */}
            {authMode === 'ADMIN_LOGIN' ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-900">
                  <Lock className="h-4 w-4 text-amber-600" /> Super Admin Access
                </div>
                <button 
                  type="button"
                  onClick={() => setAuthMode('HOTEL_LOGIN')}
                  className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
                >
                  ← Owner Login
                </button>
              </div>
            ) : authMode === 'POLICE_LOGIN' ? (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-3.5 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-900">
                  <ShieldAlert className="h-4 w-4 text-indigo-600" /> Police Inspection Access
                </div>
                <button 
                  type="button"
                  onClick={() => setAuthMode('HOTEL_LOGIN')}
                  className="text-xs font-bold text-indigo-800 hover:underline cursor-pointer"
                >
                  ← Owner Login
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 border border-slate-200/80 rounded-2xl mb-6 shadow-2xs">
                <button
                  type="button"
                  className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    authMode === 'HOTEL_LOGIN' 
                      ? 'bg-[#0b3c33] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => { setAuthMode('HOTEL_LOGIN'); setErrorMessage(''); setSuccessMessage(''); }}
                >
                  <Building2 className="h-4 w-4" /> Owner Login
                </button>
                <button
                  type="button"
                  className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    authMode === 'HOTEL_REGISTER' 
                      ? 'bg-[#0b3c33] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => { setAuthMode('HOTEL_REGISTER'); setErrorMessage(''); setSuccessMessage(''); }}
                >
                  <UserPlus className="h-4 w-4" /> Register Property
                </button>
              </div>
            )}

            {/* Feedback Messages */}
            {errorMessage && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm font-semibold text-red-700 flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs sm:text-sm font-semibold text-emerald-800 flex items-center gap-2">
                <span>✅</span>
                <span>{successMessage}</span>
              </div>
            )}

            {/* MODE 1: PROPERTY OWNER LOGIN */}
            {authMode === 'HOTEL_LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Owner Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="email"
                      className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0b3c33] focus:ring-4 focus:ring-[#0b3c33]/10 transition-all outline-none font-medium shadow-2xs"
                      placeholder="e.g. hotel@guestbooks.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="password"
                      className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0b3c33] focus:ring-4 focus:ring-[#0b3c33]/10 transition-all outline-none font-medium shadow-2xs"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-5 bg-[#0b3c33] hover:bg-[#072620] text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all shadow-md shadow-[#0b3c33]/20 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-3"
                >
                  Sign In to Owner Dashboard <ArrowRight className="h-4.5 w-4.5" />
                </button>

                <div className="pt-3 text-center border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">New property owner? </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('HOTEL_REGISTER')}
                      className="font-bold text-[#0b3c33] hover:underline cursor-pointer ml-1"
                    >
                      Register (₹499/mo)
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                    <button
                      type="button"
                      onClick={() => setAuthMode('POLICE_LOGIN')}
                      className="text-[11px] font-semibold text-slate-500 hover:text-indigo-700 cursor-pointer"
                    >
                      Police Login
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('ADMIN_LOGIN')}
                      className="text-[11px] font-semibold text-slate-500 hover:text-amber-700 cursor-pointer"
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* MODE 2: HOTEL SELF-REGISTRATION */}
            {authMode === 'HOTEL_REGISTER' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                {/* Compact Plan Strip */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Guestbooks Standard Plan</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono font-black text-[#0b3c33]">
                    ₹499<span className="text-[10px] text-slate-500 font-sans font-bold">/mo</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">Hotel Name *</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#0b3c33] focus:ring-2 focus:ring-[#0b3c33]/10 outline-none"
                      placeholder="e.g. Royal Lodge"
                      value={regHotelName}
                      onChange={(e) => setRegHotelName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">Owner Name *</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#0b3c33] focus:ring-2 focus:ring-[#0b3c33]/10 outline-none"
                      placeholder="e.g. Amit Kumar"
                      value={regOwnerName}
                      onChange={(e) => setRegOwnerName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#0b3c33] focus:ring-2 focus:ring-[#0b3c33]/10 outline-none"
                      placeholder="owner@hotel.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">Mobile Phone *</label>
                    <input
                      type="tel"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#0b3c33] focus:ring-2 focus:ring-[#0b3c33]/10 outline-none"
                      placeholder="9876543210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">Password *</label>
                    <input
                      type="password"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#0b3c33] focus:ring-2 focus:ring-[#0b3c33]/10 outline-none"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">Property Address</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#0b3c33] focus:ring-2 focus:ring-[#0b3c33]/10 outline-none"
                      placeholder="City / Location"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                    />
                  </div>
                </div>

                {/* Compact Verification Document Upload */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                    <span className="flex items-center gap-1">
                      <UploadCloud className="h-3.5 w-3.5 text-[#0b3c33]" /> Property Documents:
                    </span>
                    <span className="text-[10px] text-amber-700">Mandatory</span>
                  </div>

                  <input
                    type="file"
                    id="regDocUpload"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        const processed = await Promise.all(files.map(file => {
                          return new Promise((resolve) => {
                            if (file.type.includes('pdf')) {
                              const reader = new FileReader();
                              reader.onload = () => resolve({
                                name: file.name,
                                size: `${(file.size / 1024).toFixed(0)} KB`,
                                type: 'PDF',
                                dataUrl: reader.result
                              });
                              reader.readAsDataURL(file);
                            } else {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  let { width, height } = img;
                                  const maxDim = 1200;
                                  if (width > maxDim || height > maxDim) {
                                    if (width > height) {
                                      height = Math.round((height * maxDim) / width);
                                      width = maxDim;
                                    } else {
                                      width = Math.round((width * maxDim) / height);
                                      height = maxDim;
                                    }
                                  }
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  ctx.drawImage(img, 0, 0, width, height);
                                  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                                  resolve({
                                    name: file.name,
                                    size: `${Math.round(dataUrl.length * 0.75 / 1024)} KB`,
                                    type: 'IMAGE',
                                    dataUrl
                                  });
                                };
                                img.src = ev.target.result;
                              };
                              reader.readAsDataURL(file);
                            }
                          });
                        }));
                        setRegDocumentFiles(prev => [...prev, ...processed]);
                        setDocumentsUploaded(true);
                      }
                    }}
                    className="hidden"
                  />

                  <label
                    htmlFor="regDocUpload"
                    className={`w-full h-8 rounded-lg border text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      regDocumentFiles.length > 0
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-[#0b3c33] hover:bg-slate-50'
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5 text-[#0b3c33]" />
                    {regDocumentFiles.length > 0 ? `+ Add More (${regDocumentFiles.length} attached)` : 'Attach Trade License / Govt ID (.PDF/.JPG)'}
                  </label>

                  {regDocumentFiles.length > 0 && (
                    <div className="space-y-1">
                      {regDocumentFiles.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] bg-white border border-slate-200 rounded px-2 py-1">
                          <div className="flex items-center gap-1.5 truncate text-slate-800">
                            <FileText className="h-3 w-3 text-[#0b3c33] flex-shrink-0" />
                            <span className="font-medium truncate max-w-[180px]">{doc.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono">({doc.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = regDocumentFiles.filter((_, i) => i !== idx);
                              setRegDocumentFiles(updated);
                              if (updated.length === 0) setDocumentsUploaded(false);
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-bold px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#0b3c33] hover:bg-[#072620] text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  Complete Registration (₹499/mo)
                </button>

                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => setAuthMode('HOTEL_LOGIN')}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Already registered? Back to Owner Login
                  </button>
                </div>
              </form>
            )}

            {/* MODE 3: POLICE LOGIN */}
            {authMode === 'POLICE_LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 py-1">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-2.5 text-xs text-indigo-900">
                  👮 <strong>State Police Portal:</strong> Inspection access for authorized officers.
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Police Username / Station ID</label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-medium"
                      placeholder="e.g. police or police@station.gov.in"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-medium"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  Enter Police Portal <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {/* MODE 4: SUPER ADMIN LOGIN */}
            {authMode === 'ADMIN_LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 py-1">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                  👑 <strong>Super Admin Control Center:</strong> Internal management portal for hotel document verification, police account creation, and subscription tracking.
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Admin Email ID</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-medium"
                      placeholder="admin@guestbooks.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Admin Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-medium"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  Enter Admin Control Center <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@guestbooks.com', 'admin123')}
                  className="w-full text-xs font-bold py-2 px-3 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 hover:bg-amber-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  ⚡ 1-Click Super Admin Login
                </button>
              </form>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
