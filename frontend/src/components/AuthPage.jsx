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
  const [showSecretRoles, setShowSecretRoles] = useState(false);

  // Check secret URL param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role') || params.get('mode') || '';
    const secretParam = params.get('secret') || '';

    if (roleParam === 'police' || initialMode === 'POLICE_LOGIN') {
      setShowSecretRoles(true);
      setAuthMode('POLICE_LOGIN');
    } else if (roleParam === 'admin' || initialMode === 'ADMIN_LOGIN') {
      setShowSecretRoles(true);
      setAuthMode('ADMIN_LOGIN');
    } else if (secretParam === 'true') {
      setShowSecretRoles(true);
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
      documents: [
        { name: `${regHotelName.replace(/\s+/g, '_')}_Trade_Permit.pdf`, size: '1.4 MB', type: 'PDF' },
        { name: 'Owner_Aadhaar_Verification.pdf', size: '890 KB', type: 'PDF' },
      ],
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
            Property Owner Portal for Instant AI Check-In & Guest Management
          </p>
        </div>
      </div>

      {/* Quick Demo Selector Buttons */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 text-center mb-2">
            ⚡ Quick 1-Click Demo Login:
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickLogin('hotel@guestbooks.com', 'hotel123')}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-800/80 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900 transition-all shadow-xs"
            >
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span>Guestbooks Property Owner / Manager</span>
            </button>

            {showSecretRoles && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <button
                  onClick={() => handleQuickLogin('police@station.gov.in', 'police123')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-950/80 border border-indigo-800/80 px-3 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-900 transition-all shadow-xs"
                >
                  <ShieldAlert className="h-4 w-4 text-indigo-400" />
                  <span>Police Inspector (Secret)</span>
                </button>

                <button
                  onClick={() => handleQuickLogin('admin@guestbooks.com', 'admin123')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-950/80 border border-amber-800/80 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-900 transition-all shadow-xs"
                >
                  <Lock className="h-4 w-4 text-amber-400" />
                  <span>Super Admin (Secret)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Navigation Role Tabs (Only show police/admin tabs if secret parameter activated) */}
          {showSecretRoles ? (
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode.startsWith('HOTEL') ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setAuthMode('HOTEL_LOGIN')}
              >
                <Building2 className="h-3.5 w-3.5" /> Property Owner
              </button>
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'POLICE_LOGIN' ? 'bg-indigo-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setAuthMode('POLICE_LOGIN')}
              >
                <ShieldAlert className="h-3.5 w-3.5" /> State Police
              </button>
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'ADMIN_LOGIN' ? 'bg-amber-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setAuthMode('ADMIN_LOGIN')}
              >
                <Lock className="h-3.5 w-3.5" /> Admin
              </button>
            </div>
          ) : (
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'HOTEL_LOGIN' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setAuthMode('HOTEL_LOGIN')}
              >
                <Building2 className="h-3.5 w-3.5" /> Owner Login
              </button>
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'HOTEL_REGISTER' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setAuthMode('HOTEL_REGISTER')}
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

              {/* Document Upload Simulation */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <UploadCloud className="h-4 w-4 text-emerald-400" /> Property Verification Documents:
                </label>
                <p className="text-[11px] text-slate-500">
                  Upload Trade License / ID Proof for Account Setup.
                </p>
                <button
                  type="button"
                  onClick={() => setDocumentsUploaded(!documentsUploaded)}
                  className={`w-full h-9 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    documentsUploaded
                      ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {documentsUploaded ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" /> Documents Attached
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" /> Attach Verification File (.PDF / .JPG)
                    </>
                  )}
                </button>
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

          {/* MODE 4: SUPER ADMIN LOGIN (SECRET ACCESSIBLE) */}
          {authMode === 'ADMIN_LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 p-4 mb-2 text-xs text-amber-300">
                👑 <strong>Super Admin Control Center:</strong> Internal management portal.
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
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

