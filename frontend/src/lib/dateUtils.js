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

/**
 * Calculates accurate ISO checkout timestamp based on check-in time and stayType package.
 * Supported packages:
 * - "3 Hours Express" -> +3h
 * - "6 Hours Flexi" -> +6h
 * - "12 Hours Day Stay" -> +12h
 * - "24 Hours Full Stay" -> +24h
 * - Custom "X Hours" string
 *
 * @param {string|Date} checkInVal
 * @param {string} stayType
 * @returns {string} ISO Date String
 */
export function calculateExpectedCheckout(checkInVal, stayType = '24 Hours Full Stay') {
  let baseDate = new Date();
  if (checkInVal) {
    try {
      let clean = String(checkInVal).trim();
      if (clean.includes('T') && !clean.includes('Z') && !clean.includes('+')) {
        clean = clean + '+05:30';
      }
      const parsed = new Date(clean);
      if (!isNaN(parsed.getTime())) {
        baseDate = parsed;
      }
    } catch (_) {}
  }

  let hours = 24;
  const st = String(stayType || '').toLowerCase();
  if (st.includes('3 hour')) hours = 3;
  else if (st.includes('6 hour')) hours = 6;
  else if (st.includes('12 hour')) hours = 12;
  else if (st.includes('24 hour')) hours = 24;
  else {
    const match = st.match(/(\d+)\s*hour/);
    if (match) hours = parseInt(match[1], 10);
  }

  return new Date(baseDate.getTime() + hours * 3600 * 1000).toISOString();
}

/**
 * Analyzes active stay record to determine if checkout time is due or overdue.
 *
 * @param {object} stay
 * @returns {{
 *   isOverdue: boolean,
 *   isDueSoon: boolean,
 *   diffMinutes: number,
 *   overdueMinutes: number,
 *   remainingMinutes: number,
 *   statusBadgeText: string,
 *   expectedFormatted: string,
 *   expectedIso: string
 * }}
 */
export function getStayExpiryStatus(stay) {
  if (!stay) {
    return {
      isOverdue: false,
      isDueSoon: false,
      diffMinutes: 0,
      overdueMinutes: 0,
      remainingMinutes: 0,
      statusBadgeText: '',
      expectedFormatted: '',
      expectedIso: '',
    };
  }

  // Calculate expected check-out time accurately
  const expectedIso = stay.expectedCheckOut || calculateExpectedCheckout(stay.checkInTime, stay.stayType);
  let expectedTime = new Date(expectedIso).getTime();
  if (isNaN(expectedTime)) {
    expectedTime = Date.now() + 24 * 3600 * 1000;
  }

  const now = Date.now();
  const diffMs = expectedTime - now;
  const diffMinutes = Math.round(diffMs / 60000);

  const expectedFormatted = formatRegisterTime(expectedIso);

  if (diffMinutes <= 0) {
    const overdueMinutes = Math.abs(diffMinutes);
    const hrs = Math.floor(overdueMinutes / 60);
    const mins = overdueMinutes % 60;
    const timeAgo = hrs > 0 ? `${hrs}h ${mins}m ago` : `${mins}m ago`;

    return {
      isOverdue: true,
      isDueSoon: false,
      diffMinutes,
      overdueMinutes,
      remainingMinutes: 0,
      statusBadgeText: `Overdue (${timeAgo})`,
      expectedFormatted,
      expectedIso,
    };
  } else if (diffMinutes <= 30) {
    return {
      isOverdue: false,
      isDueSoon: true,
      diffMinutes,
      overdueMinutes: 0,
      remainingMinutes: diffMinutes,
      statusBadgeText: `Due in ${diffMinutes}m`,
      expectedFormatted,
      expectedIso,
    };
  }

  const remainingHours = Math.round(diffMinutes / 60);
  return {
    isOverdue: false,
    isDueSoon: false,
    diffMinutes,
    overdueMinutes: 0,
    remainingMinutes: diffMinutes,
    statusBadgeText: remainingHours > 0 ? `${remainingHours}h left` : `${diffMinutes}m left`,
    expectedFormatted,
    expectedIso,
  };
}

/**
 * Plays a discrete, pleasant notification chime for front-desk alerts using Web Audio API.
 * Safe to call; handles browser autoplay policies gracefully without errors.
 */
export function playCheckoutAlertSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';

    const now = ctx.currentTime;
    // Two-tone pleasant receptionist alert: D5 (587.33Hz) -> A5 (880Hz)
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch (_) {
    // Autoplay restrictions or audio disabled
  }
}
