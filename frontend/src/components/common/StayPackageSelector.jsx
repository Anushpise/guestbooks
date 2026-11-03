import React, { useState, useEffect } from 'react';
import { Clock, Sliders, Check } from 'lucide-react';
import { calculateExpectedCheckout, getExpectedCheckoutPreview } from '../../lib/dateUtils';

const PRESET_OPTIONS = [
  { label: '24 Hours Full Stay (Standard)', value: '24 Hours Full Stay', hours: 24 },
  { label: '12 Hours Day Stay', value: '12 Hours Day Stay', hours: 12 },
  { label: '6 Hours Flexi Slot', value: '6 Hours Flexi', hours: 6 },
  { label: '3 Hours Express Slot', value: '3 Hours Express', hours: 3 },
  { label: '48 Hours (2 Days Stay)', value: '48 Hours Stay', hours: 48 },
];

const QUICK_HOURS_CHIPS = [2, 4, 5, 8, 10, 14, 18, 36];

export default function StayPackageSelector({
  value,
  onChange,
  checkInTime = new Date(),
  className = '',
  required = true
}) {
  // Determine if incoming value is a standard preset or custom
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

  const handlePresetSelect = (selectedVal) => {
    if (selectedVal === 'CUSTOM') {
      setIsCustom(true);
      const h = customHours || 4;
      onChange(`${h} Hours Stay`);
    } else {
      setIsCustom(false);
      onChange(selectedVal);
    }
  };

  const handleCustomHoursChange = (hrs) => {
    const val = Math.max(1, parseInt(hrs, 10) || 1);
    setCustomHours(val);
    onChange(`${val} Hours Stay`);
  };

  // Preview checkout timestamp
  const effectiveHours = isCustom ? customHours : (matchedPreset?.hours || 24);
  const preview = getExpectedCheckoutPreview(effectiveHours, checkInTime);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#0b3c33]" />
          Stay Package / Duration {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => {
            if (isCustom) {
              handlePresetSelect('24 Hours Full Stay');
            } else {
              handlePresetSelect('CUSTOM');
            }
          }}
          className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
        >
          <Sliders className="h-3 w-3" />
          {isCustom ? 'Switch to Standard Presets' : 'Custom Hours (Manual)'}
        </button>
      </div>

      {!isCustom ? (
        <select
          value={value || '24 Hours Full Stay'}
          onChange={(e) => handlePresetSelect(e.target.value)}
          required={required}
          className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0b3c33] focus:ring-2 focus:ring-emerald-100 shadow-2xs"
        >
          {PRESET_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
          <option value="CUSTOM">Custom Hours (Enter Manually...)</option>
        </select>
      ) : (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-900 shrink-0">Duration:</span>
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                max="720"
                value={customHours}
                onChange={(e) => handleCustomHoursChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-emerald-300 bg-white px-3 pr-12 text-xs font-black text-slate-900 font-mono outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                placeholder="Enter hours"
                required={required}
              />
              <span className="absolute right-3 top-2 text-xs font-bold text-slate-500 pointer-events-none">
                Hours
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleCustomHoursChange(Math.max(1, customHours - 1))}
                className="w-8 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 text-sm shadow-2xs flex items-center justify-center cursor-pointer"
                title="Minus 1 Hour"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => handleCustomHoursChange(customHours + 1)}
                className="w-8 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 text-sm shadow-2xs flex items-center justify-center cursor-pointer"
                title="Plus 1 Hour"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick hour chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Quick Slots:</span>
            {QUICK_HOURS_CHIPS.map((hrs) => (
              <button
                key={hrs}
                type="button"
                onClick={() => handleCustomHoursChange(hrs)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  customHours === hrs
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
                }`}
              >
                {hrs}h
              </button>
            ))}
          </div>
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
