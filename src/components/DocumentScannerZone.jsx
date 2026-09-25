import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, Loader2, Upload, Trash2, Clipboard, X, ScanLine } from 'lucide-react';
import { scanDocumentWithOCR, parseIndianIDText } from '../lib/ocrUtils';

export default function DocumentScannerZone({
  label = "Guest Document",
  targetGuestName = "Primary Guest",
  onApplyExtractedData,
  accentColor = "indigo"
}) {
  const [images, setImages] = useState([]); // Array of { file, preview }
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [extractedResult, setExtractedResult] = useState(null);

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const isIndigo = accentColor !== 'emerald';
  const accent = isIndigo
    ? { ring: 'ring-indigo-400', border: 'border-indigo-500', bg: 'bg-indigo-600', text: 'text-indigo-700', light: 'bg-indigo-50', lightBorder: 'border-indigo-200' }
    : { ring: 'ring-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-600', text: 'text-emerald-700', light: 'bg-emerald-50', lightBorder: 'border-emerald-200' };

  // Auto-run OCR whenever images change
  useEffect(() => {
    if (images.length > 0) {
      runOCR(images);
    } else {
      setExtractedResult(null);
    }
  }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

  const addImages = useCallback((files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;

    setExtractedResult(null);
    setImages(prev => {
      // Max 2 images total
      const remaining = 2 - prev.length;
      if (remaining <= 0) return prev;
      const toAdd = imageFiles.slice(0, remaining).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      return [...prev, ...toAdd];
    });
  }, []);

  const removeImage = useCallback((index) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
  }, []);

  const runOCR = async (imgs) => {
    if (!imgs || imgs.length === 0) return;
    setIsScanning(true);
    setScanStatus('Processing document...');

    try {
      let combinedText = '';
      for (let i = 0; i < imgs.length; i++) {
        setScanStatus(`Reading ${i === 0 ? 'Front' : 'Back'} document...`);
        const text = await scanDocumentWithOCR(imgs[i].file);
        combinedText += `\n--- ${i === 0 ? 'FRONT' : 'BACK'} ---\n` + text;
      }

      setScanStatus('Extracting details...');
      const parsed = parseIndianIDText(combinedText);
      setExtractedResult(parsed);

      if (onApplyExtractedData) {
        onApplyExtractedData(parsed);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setScanStatus('');
    } finally {
      setIsScanning(false);
      setScanStatus('');
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      addImages(e.dataTransfer.files);
    }
  };

  // File input change
  const handleFileInput = (e) => {
    if (e.target.files?.length) {
      addImages(e.target.files);
      e.target.value = '';
    }
  };

  // Global paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) imageFiles.push(blob);
        }
      }
      if (imageFiles.length > 0) addImages(imageFiles);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addImages]);

  // Paste button
  const handlePasteButton = async () => {
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find(t => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            addImages([blob]);
            return;
          }
        }
      }
      alert('Copy an image first, then press Ctrl+V to paste here!');
    } catch {
      alert('Press Ctrl+V anywhere to paste a copied document image.');
    }
  };

  const canAddMore = images.length < 2;

  return (
    <div className={`rounded-xl border ${isIndigo ? 'border-indigo-200 bg-indigo-50/30' : 'border-emerald-200 bg-emerald-50/30'} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <ScanLine className={`h-4 w-4 ${accent.text}`} />
        <h4 className="text-xs font-bold text-slate-800">{label}</h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${accent.bg} text-white`}>
          {targetGuestName}
        </span>
        <span className="text-[10px] text-slate-400 font-medium ml-auto">
          {images.length}/2 photos • 1 photo also works
        </span>
      </div>

      {/* Drop Zone */}
      {canAddMore && (
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-200 select-none ${
            isDragging
              ? `${accent.border} ${accent.light} scale-[1.01] shadow-md`
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />

          {isDragging ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className={`h-10 w-10 rounded-full ${accent.light} ${accent.border} border flex items-center justify-center`}>
                <Upload className={`h-5 w-5 ${accent.text}`} />
              </div>
              <span className={`text-sm font-bold ${accent.text}`}>Drop here!</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <div className={`h-10 w-10 rounded-full ${accent.light} border ${accent.lightBorder} flex items-center justify-center`}>
                <Upload className={`h-5 w-5 ${accent.text}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">
                  {images.length === 0
                    ? 'Upload document photo(s)'
                    : 'Add back side photo (optional)'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click to browse • Drag & drop • Ctrl+V to paste
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePasteButton(); }}
                className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <Clipboard className="h-3 w-3" /> Paste from Clipboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className={`grid gap-3 ${images.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {images.map((img, idx) => (
            <div key={idx} className="relative rounded-lg overflow-hidden bg-slate-900 group" style={{ height: '140px' }}>
              <img
                src={img.preview}
                alt={idx === 0 ? 'Front document' : 'Back document'}
                className="h-full w-full object-cover"
              />
              {/* Label */}
              <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                {idx === 0 ? '📄 Front' : '📄 Back'}
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 bg-red-600/90 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* If max reached - show clear all */}
      {images.length === 2 && (
        <button
          type="button"
          onClick={() => setImages([])}
          className="w-full text-[11px] font-semibold text-slate-500 hover:text-red-600 py-1.5 border border-dashed border-slate-200 rounded-lg hover:border-red-200 transition-colors"
        >
          <X className="h-3 w-3 inline mr-1" /> Clear all photos & rescan
        </button>
      )}

      {/* Scanning Status */}
      {isScanning && (
        <div className={`flex items-center gap-3 rounded-lg border ${accent.lightBorder} ${accent.light} p-3`}>
          <Loader2 className={`h-4 w-4 animate-spin ${accent.text} flex-shrink-0`} />
          <div>
            <p className={`text-xs font-bold ${accent.text}`}>Auto-scanning document...</p>
            <p className="text-[11px] text-slate-500">{scanStatus}</p>
          </div>
        </div>
      )}

      {/* Extracted Result */}
      {!isScanning && extractedResult && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-extrabold text-emerald-800">Auto-filled from document</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] bg-white rounded-lg border border-emerald-200 p-2.5">
            {extractedResult.name && (
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">Name</span>
                <span className="text-slate-900 font-bold">{extractedResult.name}</span>
              </div>
            )}
            {extractedResult.idType && (
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">ID Type</span>
                <span className="text-indigo-700 font-bold">{extractedResult.idType}</span>
              </div>
            )}
            {extractedResult.idNumber && (
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">ID Number</span>
                <span className="font-mono font-bold text-slate-900">{extractedResult.idNumber}</span>
              </div>
            )}
            {extractedResult.dob && (
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">DOB</span>
                <span className="text-slate-900">{extractedResult.dob}{extractedResult.age ? ` (${extractedResult.age} yrs)` : ''}</span>
              </div>
            )}
            {extractedResult.gender && (
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">Gender</span>
                <span className="text-slate-900">{extractedResult.gender}</span>
              </div>
            )}
            {extractedResult.address && (
              <div className="col-span-2">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">Address</span>
                <span className="text-slate-900">{extractedResult.address}</span>
              </div>
            )}
          </div>

          {!extractedResult.name && !extractedResult.idNumber && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠️ Could not extract data clearly. Try uploading a clearer, well-lit photo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
