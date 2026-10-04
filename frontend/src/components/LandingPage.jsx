import React from 'react';
import { 
  Building2, 
  Zap, 
  ShieldCheck, 
  UserPlus, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  Lock, 
  Sparkles,
  BedDouble,
  Users,
  Smartphone,
  Check,
  Shield,
  Clock,
  ChevronRight
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function LandingPage({ onOpenLogin, onOpenRegister }) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Dynamic Luxury Ambient Glows */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-indigo-600/15 blur-[160px] pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="Guestbooks Logo" 
              className="h-10 w-auto object-contain bg-white p-1 rounded-xl shadow-md"
            />
            <div>
              <span className="text-xl font-black tracking-tight text-white font-heading block leading-none">
                GUESTBOOKS
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 mt-1 block">
                Digital Guest Registry & Stay Ledger
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#ocr-scanner" className="hover:text-emerald-400 transition-colors">AI OCR Scanner</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing (₹499/mo)</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenLogin('HOTEL_LOGIN')}
              className="px-4 py-2.5 text-xs font-extrabold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all shadow-xs"
            >
              Property Owner Login
            </button>
            <button
              onClick={() => onOpenRegister()}
              className="px-4 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-900/40 active:scale-95 flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" /> Register Property (₹499/mo)
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 max-w-7xl mx-auto px-6 text-center">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/60 text-indigo-300 text-xs font-extrabold mb-6 shadow-xl backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Next-Gen AI Indian ID OCR & Touchscreen Registry</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white font-heading max-w-5xl mx-auto leading-[1.1]">
          Modern Hospitality <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">Guestbooks</span> PMS
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          Speed up hotel check-ins to <strong className="text-emerald-400 font-extrabold">under 10 seconds</strong>. Powered by instant Indian ID OCR (Aadhaar, Voter ID, Passport, DL), touchscreen digital signatures, live occupancy matrix, repeat guest ledgers, and automated receipt generation.
        </p>

        {/* Primary CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onOpenRegister()}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-sm transition-all shadow-xl shadow-indigo-900/50 flex items-center justify-center gap-2.5 active:scale-95"
          >
            <span>Register Property (₹499/month)</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onOpenLogin('HOTEL_LOGIN')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-extrabold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Building2 className="h-4 w-4 text-emerald-400" />
            <span>Owner Dashboard Login</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Instant Aadhaar & ID OCR Scan</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-400" />
            <span>Screen Touch Digital Signatures</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Automated Check-in Receipts</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400" />
            <span>Flat ₹499/month Plan</span>
          </div>
        </div>

        {/* Interactive Mockup Preview Card */}
        <div id="ocr-scanner" className="mt-16 relative mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Logo" className="h-8 w-auto bg-white p-1 rounded-lg" />
              <div className="text-left">
                <span className="text-xs font-black text-white block font-heading">GUESTBOOKS PMS MATRIX</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">SYSTEM ACTIVE</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-extrabold uppercase flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Database Synced
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            
            {/* Box 1 */}
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-300">AI INDIAN ID OCR SCANNER</span>
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-xs space-y-1.5">
                <div className="text-indigo-300 font-black flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Aadhaar Card Verified
                </div>
                <div className="text-[11px] text-slate-200 font-bold">Rahul Sharma (27 yrs, M)</div>
                <div className="text-[10px] font-mono text-slate-400 truncate">ID: 4532 8910 2241</div>
                <div className="text-[10px] text-slate-400">Delhi • Direct Check-in</div>
              </div>
            </div>

            {/* Box 2 */}
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-300">LIVE ROOM MATRIX</span>
                <BedDouble className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-800 text-center">
                  <span className="block text-[9px] font-bold text-amber-400">RM-101</span>
                  <span className="text-[10px] font-black text-white">OCCUPIED</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-center">
                  <span className="block text-[9px] font-bold text-emerald-400">RM-102</span>
                  <span className="text-[10px] font-black text-white">VACANT</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center">
                  <span className="block text-[9px] font-bold text-slate-400">RM-103</span>
                  <span className="text-[10px] font-black text-slate-300">CLEANING</span>
                </div>
              </div>
            </div>

            {/* Box 3 */}
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-300">DIGITAL SIGNATURE VAULT</span>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-xs space-y-1.5">
                <div className="text-emerald-300 font-black">Touchscreen Signature Verified</div>
                <div className="text-[11px] text-slate-400">Saved directly to Guest Database</div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-20 border-t border-slate-800/60 bg-slate-950/60 relative">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">Engineered Specifically for Hotel & Lodge Owners</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              Everything Your Property Needs to Run Smoothly
            </h2>
            <p className="text-sm text-slate-400">
              Ditch outdated paper registers for an automated, secure digital guestbook system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-emerald-500/50 transition-all shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white font-heading">AI Indian ID OCR Scanner</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Instant document auto-fill for Aadhaar Card, Voter ID, Passport, and Driving License. Extracts Name, DOB, Gender, ID Number, and Address automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-indigo-500/50 transition-all shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white font-heading">Touchscreen Digital Signature</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Capture guest digital signatures directly on touchscreen tablet or phone screen during check-in. Signatures remain stored with verified ID proof.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-emerald-500/50 transition-all shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white font-heading">Automated Guest Register</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Maintain a clean, searchable digital database of all check-ins, check-outs, guest details, and ID photos with zero physical paperwork.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-indigo-500/50 transition-all shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                <BedDouble className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white font-heading">Live Room Matrix & Tariffs</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Real-time room occupancy grid (Vacant, Occupied, Cleaning). Easily edit daily room tariffs and process express guest check-outs with 1 click.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-amber-500/50 transition-all shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white font-heading">Frequent Guest Ledger</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Auto-identify returning guests by mobile phone number or Aadhaar. Perform 1-click express re-checkins without asking for details twice.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-emerald-500/50 transition-all shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white font-heading">Receipts & Invoicing</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Generate clean digital check-in receipts and payment vouchers. Persistent database storage guarantees complete record safety.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* PRICING SECTION - SINGLE FLAT PLAN (₹499/MONTH) */}
      <section id="pricing" className="py-20 border-t border-slate-800/60 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          
          <div className="max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">Transparent Flat Rate Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              One Subscription Plan for Your Entire Property
            </h2>
            <p className="text-sm text-slate-400">
              No hidden fees, no per-room limits. Full access to AI OCR, Room Matrix & Digital Signatures included.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            {/* Single Flat Plan Card: ₹499/month */}
            <div className="rounded-3xl bg-slate-950 border-2 border-emerald-500 p-8 sm:p-10 space-y-6 relative shadow-2xl text-left">
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-extrabold uppercase">
                Complete Property Access
              </div>
              
              <div>
                <h3 className="text-2xl font-black text-white font-heading">Guestbooks Standard Plan</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-5xl font-black text-white font-mono">₹499</span>
                  <span className="text-sm text-slate-400 font-bold">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">Tailored for hotel, lodge, PG, and guest house owners.</p>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-200 border-t border-b border-slate-800/80 py-6">
                <li className="flex items-center gap-3 font-semibold">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>AI Indian ID OCR Scanner (Aadhaar / Voter ID / Passport / DL)</span>
                </li>
                <li className="flex items-center gap-3 font-semibold">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Touchscreen Digital Signature Capture</span>
                </li>
                <li className="flex items-center gap-3 font-semibold">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Real-time Room Occupancy Grid & Tariff Controls</span>
                </li>
                <li className="flex items-center gap-3 font-semibold">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Frequent Guest Ledger & Instant Mobile Lookup</span>
                </li>
                <li className="flex items-center gap-3 font-semibold">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Printable Check-in Receipts & Billing Archives</span>
                </li>
                <li className="flex items-center gap-3 font-semibold">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>100% Persistent Database Storage & Offline Safety</span>
                </li>
              </ul>

              <button
                onClick={() => onOpenRegister()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-sm transition-all shadow-xl shadow-indigo-900/40 active:scale-95"
              >
                Register Property at ₹499/mo
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Guestbooks Logo" className="h-8 w-auto bg-white p-1 rounded-lg" />
            <div>
              <span className="font-extrabold text-white block">GUESTBOOKS DIGITAL GUEST REGISTRY</span>
              <span>© 2026 Guestbooks. All rights reserved.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-bold">
            <button onClick={() => onOpenLogin('HOTEL_LOGIN')} className="hover:text-white transition-colors">Property Owner Login</button>
            <button onClick={() => onOpenRegister()} className="hover:text-white transition-colors">Register Property (₹499/mo)</button>
          </div>

        </div>
      </footer>

    </div>
  );
}
