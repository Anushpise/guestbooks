import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  KeyRound, 
  UserPlus, 
  Lock, 
  Mail, 
  CheckCircle2, 
  FileText, 
  Sparkles,
  UploadCloud,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import { authService } from '../services/authService';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

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

  // Quick Demo Login Handler
  const handleQuickLogin = (email, password) => {
    setErrorMessage('');
    setSuccessMessage('');
    const res = authService.login(email, password);
    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      setErrorMessage(res.message);
    }
  };

  // Submit Login Form
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail || !loginPassword) {
      setErrorMessage('Please enter both Email/Username and Password.');
      return;
    }

    const res = authService.login(loginEmail, loginPassword);
    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      setErrorMessage(res.message);
    }
  };

  // Submit Hotel Registration Form
  const handleRegisterSubmit = (e) => {
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

    const res = authService.registerHotel(regData);
    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        setAuthMode('HOTEL_LOGIN');
      }, 2500);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl"></div>
      <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"></div>

      {/* Back to Home Button */}
      {onBackToLanding && (
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all shadow-md backdrop-blur-md"
          >
            ← Back to Home
          </button>
        </div>
      )}

      {/* Brand Logo Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-3">
        <div className="mx-auto flex items-center justify-center">
          <img 
            src={logoImg} 
            alt="Guestbooks Logo" 
            className="h-16 w-auto object-contain drop-shadow-xl bg-white/95 p-2 rounded-2xl"
          />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white font-heading">
            GUESTBOOKS
          </h2>
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">
            Digital Guest Registry & Stay Ledger
          </p>
          <p className="text-xs text-slate-400 font-medium mt-1.5">
            {authMode === 'ADMIN_LOGIN' ? 'Super Admin Control Center Portal' :
             authMode === 'POLICE_LOGIN' ? 'State Police Inspector Inspection Portal' :
             'Property Owner Portal for Instant AI Check-In & Guest Management'}
          </p>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Navigation Role Tabs - Only show Hotel Owner & Register tabs for standard public logins */}
          {authMode === 'ADMIN_LOGIN' ? (
            <div className="rounded-xl border border-amber-800/80 bg-amber-950/50 p-3 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
                <Lock className="h-4 w-4 text-amber-400" /> Super Admin Control Center Access
              </div>
              <Badge className="bg-amber-800 text-white font-bold text-[10px]">Restricted Route</Badge>
            </div>
          ) : authMode === 'POLICE_LOGIN' ? (
            <div className="rounded-xl border border-indigo-800/80 bg-indigo-950/50 p-3 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-300">
                <ShieldAlert className="h-4 w-4 text-indigo-400" /> State Police Inspector Portal
              </div>
              <Badge className="bg-indigo-800 text-white font-bold text-[10px]">Official Route</Badge>
            </div>
          ) : (
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'HOTEL_LOGIN' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => { setAuthMode('HOTEL_LOGIN'); setErrorMessage(''); setSuccessMessage(''); }}
              >
                <Building2 className="h-3.5 w-3.5" /> Property Owner Login
              </button>
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'HOTEL_REGISTER' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => { setAuthMode('HOTEL_REGISTER'); setErrorMessage(''); setSuccessMessage(''); }}
              >
                <UserPlus className="h-3.5 w-3.5" /> Register Property (₹499/mo)
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/60 p-4 text-xs font-bold text-red-300">
              ⚠️ {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-950/60 p-4 text-xs font-bold text-emerald-300">
              ✅ {successMessage}
            </div>
          )}

          {/* MODE 1: GUESTBOOKS PROPERTY OWNER LOGIN */}
          {authMode === 'HOTEL_LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Owner Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white focus:border-emerald-500"
                    placeholder="e.g. hotel@guestbooks.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white focus:border-emerald-500"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" variant="emerald" size="lg" className="w-full h-11 font-bold text-sm mt-2">
                Sign In to Owner Dashboard <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="pt-4 text-center border-t border-slate-800">
                <span className="text-xs text-slate-400">New property owner? </span>
                <button
                  type="button"
                  onClick={() => setAuthMode('HOTEL_REGISTER')}
                  className="text-xs font-bold text-emerald-400 hover:underline"
                >
                  Register Property (₹499/mo)
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: HOTEL SELF-REGISTRATION (Single ₹499/month Plan) */}
          {authMode === 'HOTEL_REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider">
                    Property Subscription Plan:
                  </span>
                  <Badge className="bg-emerald-800 text-white font-bold text-[10px]">
                    Single Flat Plan
                  </Badge>
                </div>
                
                <div className="p-3.5 rounded-xl border border-emerald-500 bg-emerald-900/50 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">Guestbooks Property Plan</div>
                      <div className="text-xs text-slate-300 mt-0.5">Includes AI OCR, Digital Signatures, Room Matrix & Invoicing</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-300 font-mono">₹499</div>
                      <div className="text-[10px] text-slate-400 font-bold">/ month</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Hotel / Lodge Name *</label>
                  <Input
                    type="text"
                    className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
                    placeholder="e.g. Royal City Lodge"
                    value={regHotelName}
                    onChange={(e) => setRegHotelName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Owner Full Name *</label>
                  <Input
                    type="text"
                    className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
                    placeholder="e.g. Amit Kumar"
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                  <Input
                    type="email"
                    className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
                    placeholder="owner@hotel.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Mobile Phone *</label>
                  <Input
                    type="tel"
                    className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
                    placeholder="9876543210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Create Password *</label>
                <Input
                  type="password"
                  className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Property Address</label>
                <Input
                  type="text"
                  className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
                  placeholder="Street, Landmark, City"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                />
              </div>

              {/* Real Property Verification Document Upload */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UploadCloud className="h-4 w-4 text-emerald-400" /> Property Verification Documents:
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">Mandatory for Admin Approval</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Attach Trade License, FSSAI Certificate, GST details or Property Owner Govt ID (.PDF, .JPG, .PNG).
                </p>

                <input
                  type="file"
                  id="regDocUpload"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setDocumentsUploaded(true);
                      Promise.all(files.map(file => new Promise(resolve => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => resolve({
                          name: file.name,
                          size: `${(file.size / 1024).toFixed(0)} KB`,
                          type: file.type.includes('pdf') ? 'PDF' : 'IMAGE',
                          dataUrl: reader.result
                        });
                      }))).then(fileObjs => {
                        setRegDocumentFiles(fileObjs);
                      });
                    }
                  }}
                  className="hidden"
                />

                <label
                  htmlFor="regDocUpload"
                  className={`w-full h-10 rounded-lg border text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                    documentsUploaded
                      ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-600 hover:bg-slate-800'
                  }`}
                >
                  {documentsUploaded ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" /> {regDocumentFiles.length || 1} Document(s) Attached
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4 text-emerald-400" /> Browse & Attach Documents (.PDF / .JPG)
                    </>
                  )}
                </label>
              </div>

              <Button type="submit" variant="emerald" size="lg" className="w-full h-11 font-bold text-sm">
                Complete Registration (₹499/mo)
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('HOTEL_LOGIN')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Already registered? Back to Owner Login
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: POLICE LOGIN (SECRET ACCESSIBLE) */}
          {authMode === 'POLICE_LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/40 p-4 mb-2 text-xs text-indigo-300">
                👮 <strong>State Police Portal:</strong> Inspection access for authorized officers.
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Police Username / Station ID</label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="text"
                    className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
                    placeholder="e.g. police or police@station.gov.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" variant="police" size="lg" className="w-full h-11 font-bold text-sm bg-indigo-800 hover:bg-indigo-700">
                Enter Police Portal <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          {/* MODE 4: SUPER ADMIN LOGIN (ACCESSIBLE) */}
          {authMode === 'ADMIN_LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 p-4 mb-2 text-xs text-amber-300">
                👑 <strong>Super Admin Control Center:</strong> Internal management portal for hotel document verification, police account creation, and subscription tracking.
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Admin Email ID</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white focus:border-amber-500"
                    placeholder="admin@guestbooks.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Admin Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white focus:border-amber-500"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full h-11 font-bold text-sm bg-amber-700 hover:bg-amber-600 text-white">
                Enter Admin Control Center <ArrowRight className="h-4 w-4" />
              </Button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@guestbooks.com', 'admin123')}
                className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-amber-950/90 border border-amber-800/80 text-amber-300 hover:bg-amber-900 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                ⚡ 1-Click Super Admin Login
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

