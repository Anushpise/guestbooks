import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Sparkles, SwitchCamera } from 'lucide-react';
import { compressImageForOCR } from '../../lib/imageCompressor';

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = "Capture Document Photo",
  sideLabel = "Front Side",
}) {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  // Stop active camera stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (_) {}
      });
      setStream(null);
    }
  }, [stream]);

  // Start WebRTC live camera stream
  const startCamera = useCallback(async (facing = facingMode) => {
    stopStream();
    setCameraError(null);
    setCapturedImage(null);

    // Check if mediaDevices is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Live browser camera preview is not supported on this browser or requires HTTPS. Use the Native Tablet Camera button below.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      };

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err1) {
        // Fallback to basic video without resolution constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
      }

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      let errMsg = 'Could not access device camera. Please check camera permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission was denied. Please allow camera access in browser settings, or use the Native Camera button.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No camera found on this device. Please connect a webcam or use the Native Camera button.';
      }
      setCameraError(errMsg);
    }
  }, [facingMode, stopStream]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
      setCapturedImage(null);
      setCameraError(null);
    }
    return () => {
      stopStream();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Take photo from live video stream
  const handleCaptureSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `document_camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const compressed = await compressImageForOCR(file, 1200, 0.85);
        const previewUrl = URL.createObjectURL(compressed);
        setCapturedImage({ file: compressed, preview: previewUrl });
        stopStream();
      }, 'image/jpeg', 0.92);
    } catch (err) {
      console.error('Snapshot capture error:', err);
    }
  };

  // Switch between rear and front camera
  const handleToggleCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Retake photo
  const handleRetake = () => {
    if (capturedImage?.preview) {
      URL.revokeObjectURL(capturedImage.preview);
    }
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Confirm and use captured photo
  const handleConfirmPhoto = () => {
    if (!capturedImage) return;
    setIsProcessing(true);
    try {
      onCapture(capturedImage.file);
      onClose();
    } catch (e) {
      console.error('Failed to apply captured photo:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Native Tablet Camera Input Handler (direct camera capture fallback)
  const handleNativeCameraFile = (e) => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    const file = files[0];
    onCapture(file);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Hidden native tablet camera file input */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeCameraFile}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400">
                Capturing <strong className="text-emerald-400">{sideLabel}</strong> • Tablet & Mobile Camera
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close camera"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Viewfinder Area */}
        <div className="relative flex-1 bg-black min-h-[320px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
          
          {/* 1. Captured Photo Preview */}
          {capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={capturedImage.preview}
                alt="Captured Document"
                className="max-h-[50vh] w-auto max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
              />
              <span className="absolute top-4 left-4 bg-emerald-500/90 text-white text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                <Check className="h-3 w-3" /> Photo Captured
              </span>
            </div>
          ) : cameraError ? (
            /* 2. Error / Fallback State */
            <div className="p-6 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl bg-[#0b3c33] hover:bg-[#072620] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Camera className="h-4 w-4 text-emerald-400" />
                Launch Tablet Camera App
              </button>
            </div>
          ) : (
            /* 3. Live Video Viewfinder Stream */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover max-h-[55vh]"
              />

              {/* ID Document Alignment Frame Overlay */}
              <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-emerald-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-3 shadow-inner">
                <div className="flex justify-between items-center text-[10px] text-emerald-300 font-mono font-bold bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md self-start">
                  <span>📄 ALIGN ID DOCUMENT INSIDE BOX</span>
                </div>
                <div className="text-[10px] text-slate-300 text-center bg-black/60 backdrop-blur-xs py-1 rounded-md">
                  Ensure full card edges, photo, and text are clearly readable
                </div>
              </div>

              {/* Flip Camera Button (if multiple cameras available) */}
              <button
                type="button"
                onClick={handleToggleCamera}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors cursor-pointer border border-white/20 shadow-md"
                title="Switch Front / Rear Camera"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Controls Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          {capturedImage ? (
            /* Preview Action Buttons */
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retake Photo
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Use This Photo (Apply OCR)
              </button>
            </>
          ) : (
            /* Live Capture Controls */
            <>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                title="Open native tablet camera app"
              >
                <Camera className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline">Tablet App</span>
              </button>

              {/* Main Shutter Snap Button */}
              <div className="flex-1 flex justify-center">
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  disabled={!stream || !!cameraError}
                  className="group relative flex items-center justify-center h-14 w-14 rounded-full bg-white hover:bg-slate-100 ring-4 ring-emerald-500/50 shadow-xl transition-all cursor-pointer active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Capture Document Photo"
                >
                  <div className="h-11 w-11 rounded-full border-2 border-slate-900 bg-emerald-500 group-hover:bg-emerald-400 transition-colors flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
