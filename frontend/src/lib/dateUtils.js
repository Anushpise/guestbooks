/**
 * dateUtils.js - Standardized Indian Standard Time (IST, UTC+5:30) Date & Time Formatting
 */

/**
 * Format any timestamp or date string into Indian Standard Time (IST).
 * Accurately parses ISO strings without timezone offsets (treating them as IST).
 * 
 * @param {string|number|Date} val
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string} Formatted date/time string e.g. "30/10/2026, 03:20 PM"
 */
export function formatDateTimeIST(val, options = {}) {
  if (!val) return '—';
  const str = String(val).trim();
  if (str === 'Active Stay' || str === '—' || str === 'N/A') return str;

  try {
    let clean = str;
    // If it has ISO 'T' without timezone offset ('Z' or '+'), treat as IST
    if (clean.includes('T') && !clean.includes('Z') && !clean.includes('+')) {
      clean = clean + '+05:30';
    }
    const d = new Date(clean);
    if (isNaN(d.getTime())) {
      // Try parsing "YYYY-MM-DD HH:mm" or "YYYY-MM-DD HH:mm:ss"
      const parts = clean.split(' ');
      if (parts.length >= 2 && parts[0].includes('-')) {
        const d2 = new Date(`${parts[0]}T${parts[1]}+05:30`);
        if (!isNaN(d2.getTime())) {
          return d2.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            ...options
          });
        }
      }
      return str;
    }
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options
    });
  } catch {
    return str;
  }
}

/**
 * Formats date and time cleanly for registers and tables: e.g. "30 Oct 03:20 PM"
 * 
 * @param {string|number|Date} val
 * @returns {string}
 */
export function formatRegisterTime(val) {
  if (!val) return '—';
  const str = String(val).trim();
  if (str === 'Active Stay' || str === '—') return str;

  try {
    let clean = str;
    if (clean.includes('T') && !clean.includes('Z') && !clean.includes('+')) {
      clean = clean + '+05:30';
    }
    const d = new Date(clean);
    if (isNaN(d.getTime())) {
      const parts = clean.split(' ');
      if (parts.length >= 2 && parts[0].includes('-')) {
        const d2 = new Date(`${parts[0]}T${parts[1]}+05:30`);
        if (!isNaN(d2.getTime())) {
          const datePart = d2.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          const timePart = d2.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          return `${datePart} ${timePart}`;
        }
      }
      return str;
    }
    const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${datePart} ${timePart}`;
  } catch {
    return str;
  }
}

/**
 * Checks whether a given timestamp falls within the requested filter range:
 * 'today' | '3days' | '15days' | '1month' | 'all'
 * 
 * @param {string|number|Date} dateVal
 * @param {string} rangeKey
 * @returns {boolean}
 */
export function isDateInFilterRange(dateVal, rangeKey = 'all') {
  if (!rangeKey || rangeKey === 'all') return true;
  if (!dateVal) return true;

  try {
    let clean = String(dateVal).trim();
    if (clean.includes('T') && !clean.includes('Z') && !clean.includes('+')) {
      clean = clean + '+05:30';
    }
    let d = new Date(clean);
    if (isNaN(d.getTime())) {
      const parts = clean.split(' ');
      if (parts.length >= 2 && parts[0].includes('-')) {
        d = new Date(`${parts[0]}T${parts[1]}+05:30`);
      }
    }
    if (isNaN(d.getTime())) return true;

    const now = new Date();
    if (rangeKey === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return d.getTime() >= startOfToday;
    }

    let days = 3;
    if (rangeKey === '3days') days = 3;
    if (rangeKey === '15days') days = 15;
    if (rangeKey === '1month') days = 30;

    const cutoff = now.getTime() - (days * 24 * 60 * 60 * 1000);
    return d.getTime() >= cutoff;
  } catch {
    return true;
  }
}
