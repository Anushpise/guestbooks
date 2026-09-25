import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, X } from 'lucide-react';
import { Button } from './ui/button';

export default function SignatureModal({ isOpen, onClose, onSave, existingSignature = null }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to allow DOM modal animation to render before sizing canvas
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      // Set high DPI display for crisp lines
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a'; // slate-900 dark ink
      ctx.lineWidth = 2.5;

      // Draw faint baseline guide
      drawBaseline(ctx, rect.width, rect.height);

      if (existingSignature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          setHasContent(true);
        };
        img.src = existingSignature;
      } else {
        setHasContent(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, existingSignature]);

  const drawBaseline = (ctx, w, h) => {
    ctx.save();
    ctx.strokeStyle = '#cbd5e1'; // slate-300
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, h * 0.72);
    ctx.lineTo(w - 30, h * 0.72);
    ctx.stroke();
    ctx.restore();
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasContent(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    const rect = canvas.getBoundingClientRect();
    drawBaseline(ctx, rect.width, rect.height);
    setHasContent(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) {
      alert('Please provide a signature before saving.');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-lg leading-tight">
                Guest Digital Signature
              </h3>
              <p className="text-xs text-slate-500">
                Sign inside the box using your mouse, stylus, or fingertip.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Canvas Body */}
        <div className="p-6 flex flex-col items-center bg-slate-50/30">
          <div className="w-full relative rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden shadow-inner group">
            <canvas
              ref={canvasRef}
              className="w-full h-56 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="absolute bottom-2 left-4 text-[11px] font-medium text-slate-400 select-none pointer-events-none">
              Sign above line ──────────────────
            </div>
          </div>
          <div className="flex items-center justify-between w-full mt-3 text-xs text-slate-500">
            <span>Legally binding guest declaration under Hotel Registration Act.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-slate-600 hover:text-rose-600 hover:border-rose-200 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasContent}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-semibold shadow-xs"
          >
            <Check className="h-4 w-4" />
            Save Signature
          </Button>
        </div>
      </div>
    </div>
  );
}
