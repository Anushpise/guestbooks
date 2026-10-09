import React from 'react';
import { motion } from 'framer-motion';
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
  ChevronRight,
  PhoneCall
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05
    }
  }
};

export default function LandingPage({ onOpenLogin, onOpenRegister }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white relative overflow-x-hidden">
      
      {/* TOP NAVBAR - CLEAN ELEGANT HEADER MATCHING SANGAM STEELS REFERENCE */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center cursor-pointer">
            <img 
              src={logoImg} 
              alt="Guestbooks Logo" 
              className="h-14 sm:h-16 w-auto object-contain transition-transform hover:scale-105"
            />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
            <a href="#features" className="hover:text-slate-950 transition-colors">Features</a>
            <a href="#ocr-scanner" className="hover:text-slate-950 transition-colors">AI OCR Scanner</a>
            <a href="#matrix" className="hover:text-slate-950 transition-colors">Room Matrix</a>
            <a href="#pricing" className="hover:text-slate-950 transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-slate-950 transition-colors">Contact</a>
          </nav>

          {/* Right Phone & Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-5">
            <a 
              href="tel:7823084754" 
              className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-[#0b3c33] transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5 text-[#0b3c33]" />
              <span>7823084754</span>
            </a>

            <div className="h-5 w-px bg-slate-200 hidden lg:block" />

            <button
              onClick={() => onOpenLogin('HOTEL_LOGIN')}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            >
              Login
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenRegister()}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#0b3c33] hover:bg-[#072620] rounded-full transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Register</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.button>
          </div>

        </div>
      </header>

      {/* HERO SECTION - SANGAM STEELS EXACT REFERENCE LAYOUT */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center py-20 lg:py-28 overflow-hidden bg-slate-950">
        
        {/* Background Image with Dark Contrast Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/hotel_hero_bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-slate-950/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 relative z-10 w-full">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-3xl text-left space-y-7"
          >
            {/* Giant Headline matching exact reference line-breaks & color scheme */}
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl sm:text-6xl lg:text-[68px] font-bold text-white tracking-tight leading-[1.12]"
            >
              Next-gen touchscreen hotel guestbooks,{' '}
              <span className="text-[#fbbf24] font-bold">
                ready for 10-second check-in.
              </span>
            </motion.h1>

            {/* Paragraph Text matching reference style */}
            <motion.p 
              variants={fadeInUp}
              className="text-slate-300 text-base sm:text-lg md:text-[19px] font-normal leading-relaxed max-w-2xl"
            >
              Instant document auto-fill for Aadhaar Card, Voter ID, Passport, and Driving License sawn to your property's needs — ISO certified digital registry, independently tested and billed at flat ₹499/month for your entire property. Supplying hotels across India since 2024.
            </motion.p>

            {/* Dual Pill CTA Buttons matching reference design */}
            <motion.div 
              variants={fadeInUp}
              className="pt-3 flex flex-wrap items-center gap-4"
            >
              {/* White Pill Button with Arrow Icon */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenRegister()}
                className="bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm sm:text-base px-7 py-3.5 rounded-full transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-md"
              >
                <span>Request a quotation</span>
                <ArrowRight className="h-4 w-4 text-[#0b3c33] group-hover:translate-x-1 transition-transform" />
              </motion.button>

              {/* Dark Outline Pill Button */}
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenLogin('HOTEL_LOGIN')}
                className="border border-slate-300/40 hover:border-emerald-400/60 text-white font-medium text-sm sm:text-base px-7 py-3.5 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Owner Login</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* QUALITY & TRACEABILITY SECTION - SANGAM STEELS EXACT REFERENCE LAYOUT */}
      <section className="py-24 sm:py-32 bg-[#f8f9fb] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center">
          
          {/* Centered Category Prefix Line with Dashes (— QUALITY & TRACEABILITY —) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-4 text-xs sm:text-sm font-medium uppercase tracking-widest text-emerald-800 font-sans mb-4"
          >
            <span className="w-8 sm:w-12 h-[1px] bg-emerald-200 inline-block" />
            <span>QUALITY & TRACEABILITY</span>
            <span className="w-8 sm:w-12 h-[1px] bg-emerald-200 inline-block" />
          </motion.div>

          {/* Centered Big Section Title */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-[48px] font-bold text-slate-900 tracking-tight leading-[1.18] max-w-4xl mx-auto"
          >
            Verified before it <span className="text-[#0b3c33] font-bold">reaches your floor.</span>
          </motion.h2>

          {/* Centered Subtitle Paragraph */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-slate-600 text-base sm:text-lg font-normal leading-relaxed max-w-2xl mx-auto mt-5 mb-16"
          >
            Every check-in carries an instant AI Indian ID OCR report, an encrypted digital signature record from our touchscreen canvas, and a live occupancy record from our own matrix.
          </motion.p>

          {/* 3 White Cards Grid matching reference image 1-to-1 */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto"
          >
            
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow text-left space-y-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0b3c33]">
                <FileText className="h-5 w-5 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                AI Indian ID OCR, every check-in
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Aadhaar, Voter ID, Passport, and DL extracted automatically per government standards, matched to digital guest profiles in 2 seconds.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow text-left space-y-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0b3c33]">
                <ShieldCheck className="h-5 w-5 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Third-party police compliance ready
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Digital guest ledger formatted and tested for local police station C-Form standards. Independent of physical paper registers.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow text-left space-y-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0b3c33]">
                <Clock className="h-5 w-5 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                ±10 seconds, without negotiation
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Any guest check-in outside 10 seconds is simplified. Digital touchscreen signature recorded before room key release.
              </p>
            </div>

          </motion.div>
        </div>
      </section>

      {/* HOW WE WORK / PROCESS SECTION - SANGAM STEELS EXACT REFERENCE LAYOUT */}
      <section className="py-24 sm:py-32 bg-[#eeeff2] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 text-left">
          
          {/* Category Prefix Line (— HOW WE WORK) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-xs sm:text-sm font-medium uppercase tracking-widest text-emerald-800 font-sans mb-5"
          >
            —  HOW WE WORK
          </motion.div>

          {/* Big Section Title */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-[46px] font-bold text-slate-900 tracking-tight leading-[1.15] mb-20 max-w-4xl"
          >
            From enquiry to dispatch, <span className="text-[#0b3c33] font-bold">in one visible route.</span>
          </motion.h2>

          {/* 5 Steps Horizontal Workflow Timeline */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* Connecting Horizontal Line Behind Badges */}
            <div className="hidden lg:block absolute top-[24px] left-[5%] right-[5%] h-[1px] bg-emerald-200 z-0" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
              
              {/* Step 01 */}
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full border border-emerald-400/80 bg-white flex items-center justify-center text-[#0b3c33] font-medium text-sm shadow-xs font-sans">
                  01
                </div>
                <h3 className="text-base font-bold text-slate-900 pt-1">
                  ID Scan
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Aadhaar, Voter ID, Passport, or DL captured via camera or desk scanner.
                </p>
              </div>

              {/* Step 02 */}
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full border border-emerald-400/80 bg-white flex items-center justify-center text-[#0b3c33] font-medium text-sm shadow-xs font-sans">
                  02
                </div>
                <h3 className="text-base font-bold text-slate-900 pt-1">
                  AI Extraction
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Guest name, DOB, address, and ID number auto-filled in under 2 seconds.
                </p>
              </div>

              {/* Step 03 */}
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full border border-emerald-400/80 bg-white flex items-center justify-center text-[#0b3c33] font-medium text-sm shadow-xs font-sans">
                  03
                </div>
                <h3 className="text-base font-bold text-slate-900 pt-1">
                  Touchscreen Sign
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Guest signs directly on tablet or phone screen for instant verification.
                </p>
              </div>

              {/* Step 04 */}
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full border border-emerald-400/80 bg-white flex items-center justify-center text-[#0b3c33] font-medium text-sm shadow-xs font-sans">
                  04
                </div>
                <h3 className="text-base font-bold text-slate-900 pt-1">
                  Room & Tariff
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Room number assigned, daily tariff locked, and live matrix updated.
                </p>
              </div>

              {/* Step 05 */}
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full border border-emerald-400/80 bg-white flex items-center justify-center text-[#0b3c33] font-medium text-sm shadow-xs font-sans">
                  05
                </div>
                <h3 className="text-base font-bold text-slate-900 pt-1">
                  Express Check-in
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Automated WhatsApp receipt sent and thermal slip printed for key release.
                </p>
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* FEATURES GRID - CLEAN CORPORATE THEME */}
      <section id="features" className="py-24 sm:py-32 bg-[#f8f9fb] border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <div className="flex items-center justify-center gap-4 text-xs sm:text-sm font-medium uppercase tracking-widest text-emerald-800 font-sans">
              <span className="w-8 sm:w-12 h-[1px] bg-emerald-200 inline-block" />
              <span>ENGINEERED FOR HOTELS & LODGES</span>
              <span className="w-8 sm:w-12 h-[1px] bg-emerald-200 inline-block" />
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-[46px] font-bold text-slate-900 tracking-tight leading-[1.18]">
              Everything your property needs <span className="text-[#0b3c33] font-bold">to run smoothly.</span>
            </h2>

            <p className="text-slate-600 text-base sm:text-lg font-normal leading-relaxed">
              Ditch outdated paper registers for an automated, secure digital guestbook system.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow text-left space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0b3c33]">
                <Zap className="h-5 w-5 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI Indian ID OCR Scanner</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Instant document auto-fill for Aadhaar Card, Voter ID, Passport, and Driving License. Extracts Name, DOB, Gender, ID Number, and Address automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow text-left space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0b3c33]">
                <Smartphone className="h-5 w-5 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Touchscreen Digital Signature</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Capture guest digital signatures directly on touchscreen tablet or phone screen during check-in. Signatures remain stored with verified ID proof.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow text-left space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0b3c33]">
                <ShieldCheck className="h-5 w-5 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Automated Guest Register</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Maintain a clean, searchable digital database of all check-ins, check-outs, guest details, and ID photos with zero physical paperwork.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow text-left space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0b3c33]">
                <BedDouble className="h-5 w-5 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Live Room Matrix & Tariffs</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Real-time room occupancy grid (Vacant, Occupied, Cleaning). Easily edit daily room tariffs and process express guest check-outs with 1 click.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow text-left space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0b3c33]">
                <Users className="h-5 w-5 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Frequent Guest Ledger</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Auto-identify returning guests by mobile phone number or Aadhaar. Perform 1-click express re-checkins without asking for details twice.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow text-left space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0b3c33]">
                <FileText className="h-5 w-5 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Receipts & Invoicing</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Generate clean digital check-in receipts and payment vouchers. Persistent database storage guarantees complete record safety.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* PRICING SECTION - CLEAN CORPORATE LAYOUT */}
      <section id="pricing" className="py-24 sm:py-32 bg-[#eeeff2] border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto mb-16 space-y-4"
          >
            <div className="flex items-center justify-center gap-4 text-xs sm:text-sm font-medium uppercase tracking-widest text-emerald-800 font-sans">
              <span className="w-8 sm:w-12 h-[1px] bg-emerald-200 inline-block" />
              <span>TRANSPARENT FLAT RATE PRICING</span>
              <span className="w-8 sm:w-12 h-[1px] bg-emerald-200 inline-block" />
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-[46px] font-bold text-slate-900 tracking-tight leading-[1.18]">
              One subscription plan <span className="text-[#0b3c33] font-bold">for your entire property.</span>
            </h2>

            <p className="text-slate-600 text-base sm:text-lg font-normal leading-relaxed">
              No hidden fees, no per-room limits. Full access to AI OCR, Room Matrix & Digital Signatures included.
            </p>
          </motion.div>

          <div className="max-w-md mx-auto">
            {/* Single Flat Plan Card: ₹499/month */}
            <motion.div 
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 space-y-5 relative shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[#0b3c33] text-[11px] font-semibold uppercase tracking-wider">
                Complete Property Access
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-900">Guestbooks Standard Plan</h3>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold text-slate-900 font-sans">₹499</span>
                  <span className="text-xs text-slate-500 font-normal">/ month</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-normal">Tailored for hotel, lodge, PG, and guest house owners across India.</p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 border-t border-b border-slate-200/80 py-4">
                <li className="flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-[#0b3c33] flex-shrink-0" />
                  <span>AI Indian ID OCR Scanner (Aadhaar/Voter ID/Passport/DL)</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-[#0b3c33] flex-shrink-0" />
                  <span>Touchscreen Digital Signature Capture</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-[#0b3c33] flex-shrink-0" />
                  <span>Real-time Room Occupancy Grid & Tariff Controls</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-[#0b3c33] flex-shrink-0" />
                  <span>Frequent Guest Ledger & Instant Mobile Lookup</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-[#0b3c33] flex-shrink-0" />
                  <span>Printable Check-in Receipts & Billing Archives</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-[#0b3c33] flex-shrink-0" />
                  <span>100% Database Storage & Police C-Form Compliance</span>
                </li>
              </ul>

              <button
                onClick={() => onOpenRegister()}
                className="w-full py-3 px-5 rounded-full bg-[#0b3c33] hover:bg-[#072620] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Register Property at ₹499/mo</span>
                <ArrowRight className="h-3.5 w-3.5 text-white group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* FOOTER - CLEAN CORPORATE */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-slate-600">
          
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Guestbooks Logo" className="h-10 w-auto object-contain" />
            <span className="font-normal text-xs text-slate-500">© 2026 Guestbooks India. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium text-xs text-slate-700">
            <button onClick={() => onOpenLogin('HOTEL_LOGIN')} className="hover:text-slate-950 transition-colors cursor-pointer">Owner Login</button>
            <button onClick={() => onOpenRegister()} className="hover:text-slate-950 transition-colors cursor-pointer">Register Property (₹499/mo)</button>
          </div>

        </div>
      </footer>

    </div>
  );
}

