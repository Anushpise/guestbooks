import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Printer, 
  Copy, 
  ExternalLink, 
  Download, 
  Smartphone, 
  Check, 
  ScanLine
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export default function CounterQRModal({ isOpen, onClose, hotel }) {
  const hotelId = hotel?.id || 'HTL-101';
  const hotelName = hotel?.name || 'Hotel Front Desk';

  const [lanIp, setLanIp] = useState('');
  const [hostUrl, setHostUrl] = useState(() => localStorage.getItem('guestbooks_qr_host') || '');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isLoadingIp, setIsLoadingIp] = useState(true);

  // Fetch server LAN IP
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingIp(true);
    fetch('/api/qr-drop/network-info')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.localIp) {
          const detectedIp = data.localIp;
          setLanIp(detectedIp);
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
        console.warn('Network info note:', err);
        if (!hostUrl) {
          setHostUrl(window.location.origin);
        }
      })
      .finally(() => {
        setIsLoadingIp(false);
      });
  }, [isOpen]);

  let effectiveBaseUrl = hostUrl || window.location.origin;
  if ((effectiveBaseUrl.includes('localhost') || effectiveBaseUrl.includes('127.0.0.1')) && lanIp) {
    const port = window.location.port ? `:${window.location.port}` : '';
    effectiveBaseUrl = `http://${lanIp}${port}`;
  }

  const guestUploadUrl = `${effectiveBaseUrl}/?view=guest-upload&hotelId=${encodeURIComponent(hotelId)}`;

  // Generate QR Code
  useEffect(() => {
    if (!isOpen || !guestUploadUrl) return;

    QRCode.toDataURL(guestUploadUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#072620',
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
    link.download = `Guestbooks-QR-${hotelId}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md print:p-0 print:bg-white select-none">
      
      {/* Modal Card Container with fixed max-height & flex layout */}
      <div className="relative w-full max-w-md max-h-[90vh] bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col print:hidden">
        
        {/* Fixed Header Bar */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b3c33] text-white shadow-2xs">
              <Smartphone className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading tracking-tight leading-none">
                Counter QR Standee
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Hotel ID: <span className="font-mono font-bold text-[#0b3c33]">{hotelId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col items-center">
          
          {/* Compact Standee Card */}
          <div className="w-full max-w-[320px] bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-md flex flex-col items-center text-center">
            
            {/* Brand Header */}
            <div className="w-full bg-[#0b3c33] text-white py-1.5 px-3 rounded-xl mb-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-1.5">
                <img src={logoImg} alt="Logo" className="h-4 w-auto object-contain bg-white rounded p-0.5" />
                <span className="text-[10px] font-black tracking-wider uppercase font-heading">GUESTBOOKS</span>
              </div>
              <span className="text-[8px] font-mono font-extrabold bg-emerald-400 text-[#072620] px-1.5 py-0.5 rounded">
                SELF CHECK-IN
              </span>
            </div>

            {/* Hotel Name */}
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight font-heading line-clamp-1">
              {hotelName}
            </h2>
            <p className="text-[9px] font-extrabold text-[#0b3c33] uppercase tracking-widest mt-0.5 mb-2.5">
              ★ Scan ID to Check-In ★
            </p>

            {/* QR Code Container */}
            <div className="relative p-2 bg-white rounded-xl border border-emerald-300 shadow-2xs flex items-center justify-center w-40 h-40 mb-3">
              {qrDataUrl && !isLoadingIp ? (
                <img src={qrDataUrl} alt="Counter QR" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                  <ScanLine className="w-6 h-6 text-[#0b3c33] animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-semibold">Generating QR...</span>
                </div>
              )}
            </div>

            {/* Step Instructions */}
            <div className="w-full bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 text-left text-[11px] space-y-1.5 text-slate-700 font-medium leading-tight">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#0b3c33] text-white font-extrabold flex items-center justify-center text-[9px] shrink-0">1</span>
                <span>Scan QR code with smartphone camera</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#0b3c33] text-white font-extrabold flex items-center justify-center text-[9px] shrink-0">2</span>
                <span>Snap photo of Indian ID (Aadhaar/Voter)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-[9px] shrink-0">3</span>
                <span>Instant front desk check-in stream</span>
              </div>
            </div>

            <p className="text-[8px] text-slate-400 mt-2 uppercase tracking-wider font-bold">
              Safe & Encrypted • No App Download Needed
            </p>
          </div>

          {/* URL Input Bar */}
          <div className="w-full max-w-[320px] mt-3 flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={guestUploadUrl}
              className="flex-1 px-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href={guestUploadUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
              title="Test link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Fixed Action Buttons Footer */}
        <div className="shrink-0 px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex-1 h-9 bg-[#0b3c33] hover:bg-[#072620] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 font-heading"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-300" />
            <span>Print Standee</span>
          </button>

          <button
            onClick={handleDownloadQR}
            className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#0b3c33]" />
            <span>Save PNG</span>
          </button>
        </div>

      </div>

      {/* DEDICATED PRINT SHEET FOR STANDEE */}
      <div className="hidden print:flex flex-col items-center justify-center w-full min-h-screen p-8 bg-white text-slate-900 font-sans">
        <div className="w-[380px] max-w-full border-4 border-slate-900 rounded-3xl p-8 flex flex-col items-center text-center shadow-none bg-white">
          
          <div className="w-full bg-[#0b3c33] text-white py-3 px-4 rounded-2xl mb-4 flex items-center justify-between">
            <span className="text-xs font-black tracking-wider uppercase font-sans">GUESTBOOKS HOTEL PORTAL</span>
            <span className="text-[10px] font-mono font-bold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded">
              SELF CHECK-IN
            </span>
          </div>

          <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight font-heading">
            {hotelName}
          </h1>
          <p className="text-xs font-bold text-[#0b3c33] uppercase tracking-widest mt-1 mb-4">
            ★ FRONT-DESK ID SCANNER ★
          </p>

          <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 flex items-center justify-center w-64 h-64 mb-4">
            {qrDataUrl && <img src={qrDataUrl} alt="Standee QR" className="w-full h-full object-contain" />}
          </div>

          <div className="w-full py-1.5 px-3 rounded-full bg-slate-100 border border-slate-300 text-slate-900 text-xs font-black uppercase tracking-wider mb-4">
            📱 SCAN WITH SMARTPHONE CAMERA
          </div>

          <div className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-left text-xs space-y-2 text-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#0b3c33] text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
              <span className="font-semibold">Open camera app & scan QR code</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#0b3c33] text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
              <span className="font-semibold">Snap photo of ID (Aadhaar / Voter / Passport)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
              <span className="font-semibold">Documents transfer instantly to front desk</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 w-full flex justify-between text-[9px] text-slate-500 font-semibold">
            <span>Hotel ID: {hotelId}</span>
            <span>100% Encrypted & Safe</span>
          </div>

        </div>
      </div>

    </div>
  );
}
