import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Printer, 
  Copy, 
  ExternalLink, 
  Download, 
  Sparkles, 
  Building2, 
  Smartphone, 
  ShieldCheck, 
  Check, 
  Wifi, 
  QrCode,
  ScanLine,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import logoImg from '../assets/logo.png';

export default function CounterQRModal({ isOpen, onClose, hotel }) {
  const hotelId = hotel?.id || 'HTL-101';
  const hotelName = hotel?.name || 'Hotel Front Desk';
  const hotelAddress = hotel?.address || 'Reception Counter';

  const [lanIp, setLanIp] = useState('');
  const [hostUrl, setHostUrl] = useState(() => localStorage.getItem('guestbooks_qr_host') || '');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isLoadingIp, setIsLoadingIp] = useState(true);
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // 1. Fetch server LAN IP to avoid 'localhost' on mobile devices
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingIp(true);
    fetch('/api/qr-drop/network-info')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.localIp) {
          const detectedIp = data.localIp;
          setLanIp(detectedIp);

          // If current host is localhost or 127.0.0.1, always use LAN IP with the current port
          const currentH = window.location.hostname;
          const port = window.location.port ? `:${window.location.port}` : '';

          if (currentH === 'localhost' || currentH === '127.0.0.1') {
            const resolvedLanUrl = `http://${detectedIp}${port}`;
            setHostUrl(resolvedLanUrl);
            localStorage.setItem('guestbooks_qr_host', resolvedLanUrl);
          } else if (!hostUrl) {
            setHostUrl(window.location.origin);
          }
        }
      })
      .catch(err => {
        console.warn('Network info fetch note:', err);
        if (!hostUrl) {
          setHostUrl(window.location.origin);
        }
      })
      .finally(() => {
        setIsLoadingIp(false);
      });
  }, [isOpen]);

  // Construct target guest upload URL
  // Guard: If hostname is still localhost, try replacing with detected LAN IP
  let effectiveBaseUrl = hostUrl || window.location.origin;
  if ((effectiveBaseUrl.includes('localhost') || effectiveBaseUrl.includes('127.0.0.1')) && lanIp) {
    const port = window.location.port ? `:${window.location.port}` : '';
    effectiveBaseUrl = `http://${lanIp}${port}`;
  }

  const guestUploadUrl = `${effectiveBaseUrl}/?view=guest-upload&hotelId=${encodeURIComponent(hotelId)}`;

  // 2. Generate QR Code
  useEffect(() => {
    if (!isOpen || !guestUploadUrl) return;

    QRCode.toDataURL(guestUploadUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error('QR code generation failed:', err);
      });
  }, [guestUploadUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(guestUploadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `FrontDesk-QR-${hotelId}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleHostChange = (newVal) => {
    setHostUrl(newVal);
    localStorage.setItem('guestbooks_qr_host', newVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
      
      {/* Modal Dialog Box (Hidden on Print) */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 flex flex-col md:flex-row overflow-hidden max-h-[92vh] print:hidden">
        
        {/* Left Column: Standee Preview */}
        <div className="flex-1 bg-slate-950/70 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
          
          <div className="w-full max-w-xs bg-white text-slate-900 rounded-2xl p-5 shadow-2xl border-4 border-slate-900 flex flex-col items-center text-center relative overflow-hidden">
            {/* Top Standee Header Band */}
            <div className="w-full bg-slate-900 text-white py-2 px-3 rounded-xl mb-3 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="Logo" className="h-5 w-auto object-contain bg-white rounded p-0.5" />
                <span className="text-[11px] font-black tracking-wider uppercase font-sans">GUESTBOOKS</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">
                COUNTER
              </span>
            </div>

            {/* Hotel Name */}
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-1">
              {hotelName}
            </h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5 mb-3">
              ★ Front-Desk Self Check-In ★
            </p>

            {/* QR Code */}
            <div className="relative p-2.5 bg-white rounded-2xl border-2 border-indigo-200 shadow-inner flex items-center justify-center aspect-square w-52 mb-3">
              {qrDataUrl && !isLoadingIp ? (
                <img src={qrDataUrl} alt="Counter QR" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <ScanLine className="w-8 h-8 text-indigo-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-semibold">Generating QR...</span>
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold mb-3">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Scan with phone camera to upload ID</span>
            </div>

            {/* Instructions */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left text-[10px] space-y-1.5 text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[9px] shrink-0">1</span>
                <span>Scan this QR code using your phone camera</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[9px] shrink-0">2</span>
                <span>Take a clear photo of your Indian ID</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[9px] shrink-0">3</span>
                <span>Documents transfer directly to front desk</span>
              </div>
            </div>

            <p className="text-[8px] text-slate-400 mt-3 uppercase tracking-wider font-semibold">
              No App Install Required • Safe & Encrypted
            </p>
          </div>

          <p className="text-xs text-slate-400 mt-4 text-center">
            Standard Acrylic Table-Tent / Counter Standee Display
          </p>
        </div>

        {/* Right Column: Configuration & Controls */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1.5">
                  <QrCode className="w-3.5 h-3.5" /> Front-Desk QR Generator
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Front-Desk Counter QR Standee
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hotel Identifier: <strong className="text-white font-mono">{hotelId}</strong>
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target URL Configuration */}
            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Mobile Upload URL:
                  </label>
                  {lanIp && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Wifi className="w-3 h-3" /> Wi-Fi LAN IP: {lanIp}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={effectiveBaseUrl}
                    onChange={(e) => handleHostChange(e.target.value)}
                    placeholder={`http://${lanIp || '192.168.0.106'}:5173`}
                    className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Production vs Local Development Mode Status */}
              {!isLocalDev ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Production Server Active (No Hotel Wi-Fi Required):</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-200/90">
                    System is live on your server domain (<strong>{window.location.host}</strong>). Guests can scan this QR code using their normal mobile phone data (4G/5G Jio, Airtel, etc.) from anywhere without connecting to hotel Wi-Fi.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Production vs Local Testing Mode:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    • <strong>On Your Server (Production):</strong> Once deployed on your server/domain, guests scan & upload directly via their 4G/5G mobile cellular data — <strong>no Wi-Fi connection required!</strong><br />
                    • <strong>Local PC Testing (Right Now):</strong> Because this is running locally on your laptop, your phone needs to be on the same Wi-Fi (<code className="text-white font-mono bg-black/40 px-1 rounded">{lanIp || '192.168.0.106'}</code>) to access this computer.
                  </p>
                </div>
              )}

              {/* How it works banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> How It Works
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Guests scan the standee card with their smartphone camera, snap photos of their ID documents, and tap Submit. The documents instantly stream to your New Check-In screen and auto-fill via AI OCR!
                </p>
              </div>

              {/* Direct Browser Test Link */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs">
                <span className="text-slate-300 font-medium">Test in your browser:</span>
                <a
                  href={guestUploadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  <span>Open Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap gap-2.5">
            <Button
              onClick={handlePrint}
              className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50"
            >
              <Printer className="w-4 h-4" />
              <span>Print Acrylic Standee</span>
            </Button>

            <Button
              onClick={handleDownloadQR}
              variant="outline"
              className="h-11 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Save PNG</span>
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="h-11 border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl"
            >
              Close
            </Button>
          </div>
        </div>

      </div>

      {/* DEDICATED PRINT SHEET: Clean, Professional English for Front-Desk Table Tent */}
      <div className="hidden print:flex flex-col items-center justify-center w-full min-h-screen p-8 bg-white text-slate-900 font-sans">
        <div className="w-[380px] max-w-full border-4 border-slate-900 rounded-3xl p-8 flex flex-col items-center text-center shadow-none bg-white">
          
          {/* Header */}
          <div className="w-full bg-slate-900 text-white py-3 px-4 rounded-2xl mb-4 flex items-center justify-between">
            <span className="text-xs font-black tracking-wider uppercase font-sans">GUESTBOOKS HOTEL PORTAL</span>
            <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
              SELF-CHECKIN
            </span>
          </div>

          <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
            {hotelName}
          </h1>
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest mt-1 mb-4">
            ★ FRONT-DESK ID SCANNER ★
          </p>

          {/* QR */}
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 flex items-center justify-center w-64 h-64 mb-4">
            {qrDataUrl && <img src={qrDataUrl} alt="Standee QR" className="w-full h-full object-contain" />}
          </div>

          <div className="w-full py-1.5 px-3 rounded-full bg-slate-100 border border-slate-300 text-slate-900 text-xs font-black uppercase tracking-wider mb-4">
            📱 SCAN WITH SMARTPHONE CAMERA
          </div>

          {/* Steps */}
          <div className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-left text-xs space-y-2 text-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
              <span className="font-semibold">Open camera app and point at the QR code</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
              <span className="font-semibold">Snap photos of your ID (Aadhaar / Voter / Passport)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
              <span className="font-semibold">Documents transfer instantly to front desk</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 w-full flex justify-between text-[9px] text-slate-500 font-semibold">
            <span>Hotel ID: {hotelId}</span>
            <span>100% Encrypted & Gov-Approved</span>
          </div>

        </div>

        <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest print:block">
          Cut along the outer border to fit into an A5 / 4x6 Acrylic Table-Tent Standee
        </p>
      </div>

    </div>
  );
}
