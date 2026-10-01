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
  Check
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function LandingPage({ onOpenLogin, onOpenRegister }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white relative overflow-hidden">
      
      {/* Background Gradients & Glow Effects */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="Guestbooks Logo" 
              className="h-12 w-auto object-contain bg-white/95 p-1 rounded-xl shadow-lg shadow-teal-900/30"
            />
            <div>
              <span className="text-xl font-black tracking-tight text-white font-heading block leading-none">
                GUESTBOOKS
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 mt-1 block">
                Digital Guest Registry & Stay Ledger
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-teal-400 transition-colors">Features</a>
            <a href="#ocr-scanner" className="hover:text-teal-400 transition-colors">AI OCR Scanner</a>
            <a href="#pricing" className="hover:text-teal-400 transition-colors">Pricing (₹499/mo)</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenLogin('HOTEL_LOGIN')}
              className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all shadow-sm"
            >
              Property Owner Login
            </button>
            <button
              onClick={() => onOpenRegister()}
              className="px-4 py-2 text-xs font-bold text-slate-900 bg-gradient-to-r from-teal-400 to-amber-400 hover:from-teal-300 hover:to-amber-300 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" /> Register Property (₹499/mo)
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 max-w-7xl mx-auto px-6 text-center">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-950/60 text-teal-300 text-xs font-bold mb-6 shadow-xl backdrop-blur-md animate-pulse">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Next-Gen AI OCR & Digital Touchscreen Guestbook</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white font-heading max-w-5xl mx-auto leading-[1.1]">
          Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-400 to-amber-400">Guestbooks</span> Digital Stay Register
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
          Speed up check-ins to <strong className="text-slate-200 font-bold">under 10 seconds</strong>. AI-powered Indian ID OCR scanning (Aadhaar, Voter ID, Driving License), touchscreen digital signatures, real-time room availability matrix, guest ledger, and automated check-in receipt generation tailored for hotel & lodge owners.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onOpenRegister()}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-teal-600/30 flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Register Property (₹499/mo)</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onOpenLogin('HOTEL_LOGIN')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Building2 className="h-4 w-4 text-teal-400" />
            <span>Owner Dashboard Login</span>
          </button>
        </div>

        {/* Hero Feature Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-400" />
            <span>Instant Aadhaar / Voter ID OCR</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400" />
            <span>Touchscreen Digital Signature</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-400" />
            <span>Automated Guest Records & Invoicing</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400" />
            <span>Only ₹499/month (All Features Included)</span>
          </div>
        </div>

        {/* Interactive Mockup Graphic */}
        <div className="mt-16 relative mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Logo" className="h-8 w-auto bg-white p-1 rounded-lg" />
              <div className="text-left">
                <span className="text-xs font-black text-white block">GUESTBOOKS LIVE DASHBOARD</span>
                <span className="text-[10px] text-teal-400 font-mono">STATUS: OPERATIONAL</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold uppercase">
                ● Live Database Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">INSTANT AI SCANNER</span>
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div className="p-3 rounded-xl bg-teal-950/50 border border-teal-800/60 text-xs space-y-1">
                <div className="text-teal-300 font-bold">Aadhaar Card Recognized</div>
                <div className="text-[11px] text-slate-300">Name: Rahul Kumar</div>
                <div className="text-[11px] text-slate-400 truncate">Address: H.No 42, Sector 14, Gurugram</div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">ROOM MATRIX</span>
                <BedDouble className="h-4 w-4 text-teal-400" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-center text-[10px] font-bold text-emerald-300">
                  R-101 (Occupied)
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-center text-[10px] font-bold text-slate-300">
                  R-102 (Vacant)
                </div>
                <div className="p-2 rounded-lg bg-amber-950 border border-amber-800 text-center text-[10px] font-bold text-amber-300">
                  R-103 (Cleaning)
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">GUEST VERIFICATION</span>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-xs space-y-1">
                <div className="text-emerald-300 font-bold">Digital Signature Verified</div>
                <div className="text-[11px] text-slate-400">Stay Record Saved to Database</div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-20 border-t border-slate-800/60 bg-slate-900/40 relative">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-400">Tailored Exclusively for Hotel & Lodge Owners</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              Everything Your Property Needs in Guestbooks
            </h2>
            <p className="text-sm text-slate-400">
              Replace paper notebook registers with a fast, modern digital guestbook system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-teal-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Indian ID OCR Scanner</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan Aadhaar Card, Voter ID, Driving License, or Passport. Guest details like Name, DOB, Gender, ID Number, and Address are auto-filled instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-amber-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Touchscreen Digital Signature</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Capture guest digital signatures on tablet or phone screen during check-in. Signatures are permanently saved with the stay record.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-emerald-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Automated Guest Register</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Maintain a clean, searchable digital database of all check-ins, check-outs, guest details, and photos with zero paper hassle.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-emerald-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <BedDouble className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Live Room Grid & Tariffs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time room occupancy matrix (Vacant, Occupied, Out of Service). Easily update daily room tariffs and process express check-outs.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-purple-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Frequent Guest Ledger</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Auto-identify returning guests by mobile phone number or ID. 1-click express re-checkin without re-entering address or documents.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-blue-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Receipts & Invoicing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate clean digital check-in receipts and payment vouchers. Persistent SQLite database storage ensures zero data loss.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* PRICING SECTION - SINGLE ₹499 PLAN */}
      <section id="pricing" className="py-20 border-t border-slate-800/60 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          
          <div className="max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">Simple & Affordable All-in-One Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              One Flat Plan for Your Entire Property
            </h2>
            <p className="text-sm text-slate-400">
              No extra charges per room or counter. All AI features, OCR scanner, and guest database included.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            {/* Single Plan Card: ₹499/month */}
            <div className="rounded-3xl bg-slate-900 border-2 border-teal-500 p-8 sm:p-10 space-y-6 relative shadow-2xl text-left">
              <div className="inline-block px-3 py-1 rounded-full bg-teal-950 border border-teal-700 text-teal-300 text-xs font-extrabold uppercase">
                Complete Property Subscription
              </div>
              
              <div>
                <h3 className="text-2xl font-black text-white">Guestbooks Property Plan</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-5xl font-black text-white font-mono">₹499</span>
                  <span className="text-sm text-slate-400 font-bold">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Designed specifically for hotel, lodge, PG, and guest house owners.</p>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-200 border-t border-b border-slate-800 py-6">
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>AI Indian ID OCR Scanner (Aadhaar / Voter ID / Driving License)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Touchscreen Digital Signature Capture</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Real-time Room Occupancy Matrix & Tariff Controls</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Frequent Guest Ledger & Auto Lookup</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Printable Check-in Receipts & Payment Vouchers</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>100% Persistent Database & Offline Backup Support</span>
                </li>
              </ul>

              <button
                onClick={() => onOpenRegister()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-teal-500/20 active:scale-95"
              >
                Register Property at ₹499/mo
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Guestbooks Logo" className="h-8 w-auto bg-white p-1 rounded-lg" />
            <div>
              <span className="font-bold text-slate-300 block">GUESTBOOKS DIGITAL GUEST REGISTRY</span>
              <span>© 2026 Guestbooks. All rights reserved.</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => onOpenLogin('HOTEL_LOGIN')} className="hover:text-white transition-colors">Property Owner Login</button>
            <button onClick={() => onOpenRegister()} className="hover:text-white transition-colors">Register Property</button>
          </div>

        </div>
      </footer>

    </div>
  );
}

