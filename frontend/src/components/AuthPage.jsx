import React, { useState } from 'react';
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
import { authService } from '../services/authService';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

export default function AuthPage({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('HOTEL_LOGIN'); // 'HOTEL_LOGIN', 'HOTEL_REGISTER', 'POLICE_LOGIN', 'ADMIN_LOGIN'
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
  const [regPropertyType, setRegPropertyType] = useState('Hostel / Budget Stay');
  const [regPlan, setRegPlan] = useState('Hostel Standard (₹499/month)');
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
      subscriptionPlan: regPlan,
      subscriptionAmount: regPlan.includes('499') ? 499 : 999,
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

      {/* Brand Logo Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white font-black text-xl shadow-lg shadow-emerald-900/50">
          SL
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-heading">
          STAYLOG ERP
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          3-Tier Multi-Tenant Portal for Hotel Managers, State Police & Super Admin
        </p>
      </div>

      {/* Quick Demo Selector Buttons */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 text-center mb-2">
            ⚡ Quick 1-Click Demo Login:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('hotel@staylog.com', 'hotel123')}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-800/80 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900 transition-all shadow-xs"
            >
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span>Hotel Manager</span>
            </button>

            <button
              onClick={() => handleQuickLogin('police@station.gov.in', 'police123')}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-950/80 border border-indigo-800/80 px-3 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-900 transition-all shadow-xs"
            >
              <ShieldAlert className="h-4 w-4 text-indigo-400" />
              <span>Police Inspector</span>
            </button>

            <button
              onClick={() => handleQuickLogin('admin@staylog.com', 'admin123')}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-950/80 border border-amber-800/80 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-900 transition-all shadow-xs"
            >
              <Lock className="h-4 w-4 text-amber-400" />
              <span>Super Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Navigation Role Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
            <button
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode.startsWith('HOTEL') ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setAuthMode('HOTEL_LOGIN')}
            >
              <Building2 className="h-3.5 w-3.5" /> Hotel / Hostel
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

          {/* MODE 1: HOTEL LOGIN */}
          {authMode === 'HOTEL_LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Hotel Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white focus:border-emerald-500"
                    placeholder="e.g. hotel@staylog.com"
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
                Sign In to Hotel Dashboard <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="pt-4 text-center border-t border-slate-800">
                <span className="text-xs text-slate-400">New Hotel or Hostel owner? </span>
                <button
                  type="button"
                  onClick={() => setAuthMode('HOTEL_REGISTER')}
                  className="text-xs font-bold text-emerald-400 hover:underline"
                >
                  Register Property & Select Plan (₹499/mo)
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: HOTEL SELF-REGISTRATION (With Document Upload & ₹499 Subscription Plan) */}
          {authMode === 'HOTEL_REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider">
                    Select Subscription Plan:
                  </span>
                  <Badge className="bg-emerald-800 text-white font-bold text-[10px]">
                    Hostel Special
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRegPlan('Hostel Standard (₹499/month)')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      regPlan.includes('499')
                        ? 'border-emerald-500 bg-emerald-900/60 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">Hostel / PG Plan</div>
                    <div className="text-lg font-black text-emerald-400 font-mono">₹499 / mo</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Up to 30 Rooms + Police C-Form</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegPlan('Deluxe Hotel Plan (₹999/month)')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      regPlan.includes('999')
                        ? 'border-emerald-500 bg-emerald-900/60 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">Deluxe Hotel Plan</div>
                    <div className="text-lg font-black text-emerald-400 font-mono">₹999 / mo</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Unlimited Rooms + Multi-Counter</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Hotel / Hostel Name *</label>
                  <Input
                    type="text"
                    className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
                    placeholder="e.g. Royal City Hostel"
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
                  <UploadCloud className="h-4 w-4 text-emerald-400" /> Mandatory Verification Documents:
                </label>
                <p className="text-[11px] text-slate-500">
                  Upload Trade License / GST Permit / Owner ID Proof for Super Admin Verification.
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
                      <Check className="h-4 w-4 text-emerald-400" /> 2 Documents Attached (Trade_Permit.pdf)
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" /> Attach Verification Files (.PDF / .JPG)
                    </>
                  )}
                </button>
              </div>

              <Button type="submit" variant="emerald" size="lg" className="w-full h-11 font-bold text-sm">
                Submit Registration for Admin Approval
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('HOTEL_LOGIN')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Already registered? Back to Hotel Login
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: POLICE LOGIN */}
          {authMode === 'POLICE_LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/40 p-4 mb-2 text-xs text-indigo-300">
                👮 <strong>State Police Portal:</strong> Accounts are generated exclusively by Super Admin for local police station inspectors.
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
                <label className="text-xs font-semibold text-slate-300">Police Portal Password</label>
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
                Enter Police Inspection Portal <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          {/* MODE 4: SUPER ADMIN LOGIN */}
          {authMode === 'ADMIN_LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 p-4 mb-2 text-xs text-amber-300">
                👑 <strong>Super Admin Control Center:</strong> Review pending hotel document approvals, manage police accounts & subscription billing.
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Admin Email ID</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white focus:border-amber-500"
                    placeholder="admin@staylog.com"
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
                Enter Super Admin Control Center <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
