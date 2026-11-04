import React, { useState, useEffect } from 'react';
import { Clock, Check } from 'lucide-react';
import { getExpectedCheckoutPreview } from '../../lib/dateUtils';

const PRESET_OPTIONS = [
  { label: '24 Hours Full Stay (Standard)', value: '24 Hours Full Stay', hours: 24 },
  { label: '12 Hours Day Stay', value: '12 Hours Day Stay', hours: 12 },
  { label: '6 Hours Flexi Slot', value: '6 Hours Flexi', hours: 6 },
  { label: '3 Hours Express Slot', value: '3 Hours Express', hours: 3 },
  { label: '48 Hours (2 Days Stay)', value: '48 Hours Stay', hours: 48 },
];

export default function StayPackageSelector({
  value,
  onChange,
  checkInTime = new Date(),
  className = '',
  required = true
}) {
  const matchedPreset = PRESET_OPTIONS.find(p => p.value === value);
  const [isCustom, setIsCustom] = useState(() => {
    if (!value) return false;
    return !matchedPreset;
  });

  // Extract initial custom hours if any
  const extractHours = (val) => {
    if (!val) return 24;
    const match = String(val).match(/(\d+)\s*hour/i);
    return match ? parseInt(match[1], 10) : 24;
  };

  const [customHours, setCustomHours] = useState(() => extractHours(value));

  // Sync when prop value changes from outside
  useEffect(() => {
    const isPreset = PRESET_OPTIONS.some(p => p.value === value);
    if (!isPreset && value) {
      setIsCustom(true);
      const h = extractHours(value);
      if (h) setCustomHours(h);
    } else if (isPreset) {
      setIsCustom(false);
    }
  }, [value]);

  const handleSelectChange = (newVal) => {
    if (newVal === 'CUSTOM') {
      setIsCustom(true);
      const h = customHours || 4;
      onChange(`${h} Hours Stay`);
    } else {
      setIsCustom(false);
      onChange(newVal);
    }
  };

  const handleCustomHoursChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setCustomHours('');
      return;
    }
    const val = Math.max(1, parseInt(raw, 10) || 1);
    setCustomHours(val);
    onChange(`${val} Hours Stay`);
  };

  const handleCustomHoursBlur = () => {
    if (!customHours || customHours < 1) {
      setCustomHours(24);
      onChange('24 Hours Stay');
    }
  };

  // Preview checkout timestamp
  const effectiveHours = isCustom ? (Number(customHours) || 24) : (matchedPreset?.hours || 24);
  const preview = getExpectedCheckoutPreview(effectiveHours, checkInTime);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-[#0b3c33]" />
        Stay Package / Duration {required && <span className="text-rose-500">*</span>}
      </label>

      {/* Standard presets dropdown */}
      <select
        value={isCustom ? 'CUSTOM' : (value || '24 Hours Full Stay')}
        onChange={(e) => handleSelectChange(e.target.value)}
        required={required}
        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0b3c33] focus:ring-2 focus:ring-emerald-100 shadow-2xs cursor-pointer"
      >
        {PRESET_OPTIONS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
        <option value="CUSTOM">Custom Hours (Enter Manually...)</option>
      </select>

      {/* Simple, tiny custom hours input - only when Custom is chosen */}
      {isCustom && (
        <div className="relative animate-in fade-in duration-150">
          <input
            type="number"
            min="1"
            max="720"
            value={customHours}
            onChange={handleCustomHoursChange}
            onBlur={handleCustomHoursBlur}
            placeholder="Enter custom hours"
            className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 pr-14 text-xs font-black text-slate-900 font-mono outline-none focus:border-[#0b3c33] focus:ring-2 focus:ring-emerald-100 shadow-2xs"
            required={required}
            autoFocus
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
            Hours
          </span>
        </div>
      )}

      {/* Real-time Checkout Due Preview Helper */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span>Scheduled Check-Out:</span>
        <span className="font-bold text-emerald-800 font-mono flex items-center gap-1">
          <Check className="h-3 w-3 text-emerald-600" />
          {preview.formatted} (+{effectiveHours}h)
        </span>
      </div>
    </div>
  );
}
