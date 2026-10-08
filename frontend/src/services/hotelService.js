import { initialRooms, frequentGuestsDatabase, initialActiveStays, initialHistoricalPoliceLogs } from '../mockData.js';

const ROOMS_STORAGE_KEY = 'staylog_rooms_v1';
const GUESTS_STORAGE_KEY = 'staylog_guests_v1';
const ACTIVE_STAYS_STORAGE_KEY = 'staylog_active_stays_v1';
const ALL_STAYS_STORAGE_KEY = 'staylog_all_stays_master_v1';
const POLICE_LOGS_STORAGE_KEY = 'staylog_police_logs_v1';

// ── Unique ID Generator (timestamp + random, no collisions) ──────────────────
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

// ── Multi-PC Dynamic Backend URL Helper ──────────────────────────────────────
export const getBackendFallbackUrl = (path) => {
  const host = (typeof window !== 'undefined' && window.location && window.location.hostname) 
    ? window.location.hostname 
    : '127.0.0.1';
  return `http://${host}:8008${path}`;
};

// ── Initialize LocalStorage if empty ─────────────────────────────────────────
const initStorage = () => {
  if (!localStorage.getItem(ROOMS_STORAGE_KEY)) {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(initialRooms));
  }
  if (!localStorage.getItem(GUESTS_STORAGE_KEY)) {
    localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(frequentGuestsDatabase));
  }
  if (!localStorage.getItem(ACTIVE_STAYS_STORAGE_KEY)) {
    localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(initialActiveStays));
  }
  if (!localStorage.getItem(ALL_STAYS_STORAGE_KEY)) {
    localStorage.setItem(ALL_STAYS_STORAGE_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(POLICE_LOGS_STORAGE_KEY)) {
    localStorage.setItem(POLICE_LOGS_STORAGE_KEY, JSON.stringify(initialHistoricalPoliceLogs));
  }
};

initStorage();

// ── Sync hotel occupancy stats to hotels storage (for Police Portal) ─────────
const syncHotelOccupancyStats = (rooms, targetHotelId = null) => {
  try {
    const hId = targetHotelId || hotelService.getCurrentHotelId();
    const hotels = JSON.parse(localStorage.getItem('staylog_hotels_v2')) || [];
    const occCount = rooms.filter(r => r.status === 'OCCUPIED').length;
    const updatedHotels = hotels.map(h => {
      if (h.id === hId) {
        return {
          ...h,
          totalRooms: rooms.length,
          occupiedRooms: occCount,
          vacantRooms: rooms.filter(r => r.status === 'VACANT').length,
          occupancyRate: rooms.length > 0 ? Math.round((occCount / rooms.length) * 100) : 0
        };
      }
      return h;
    });
    localStorage.setItem('staylog_hotels_v2', JSON.stringify(updatedHotels));
  } catch (e) {
    console.warn('Failed to sync hotel occupancy stats:', e);
  }
};

export const hotelService = {

  getCurrentHotelId: () => {
    try {
      const user = JSON.parse(localStorage.getItem('staylog_session_v2')) || {};
      return user.hotelId || 'HTL-101';
    } catch (e) {
      return 'HTL-101';
    }
  },

  getRoomsStorageKey: (hotelId = null) => {
    const hId = hotelId || hotelService.getCurrentHotelId();
    if (hId === 'HTL-101') {
      return ROOMS_STORAGE_KEY;
    }
    return `staylog_rooms_${hId}`;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ROOMS CRUD API (Partitioned per Hotel)
  // ══════════════════════════════════════════════════════════════════════════

  // Fetch rooms from Central DB and update local cache
  fetchRooms: async (targetHotelId = null) => {
    const hId = targetHotelId || hotelService.getCurrentHotelId();
    try {
      let res = await fetch(`/api/rooms?hotel_id=${encodeURIComponent(hId)}`);
      if (!res.ok) {
        res = await fetch(getBackendFallbackUrl(`/api/rooms?hotel_id=${encodeURIComponent(hId)}`));
      }
      if (res && res.ok) {
        const json = await res.json();
        if (json.rooms && Array.isArray(json.rooms)) {
          const storageKey = hotelService.getRoomsStorageKey(hId);
          localStorage.setItem(storageKey, JSON.stringify(json.rooms));
          syncHotelOccupancyStats(json.rooms, hId);
          return json.rooms;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch rooms from backend DB:', e);
    }
    return hotelService.getRooms(hId);
  },

  getRooms: (targetHotelId = null) => {
    const hId = targetHotelId || hotelService.getCurrentHotelId();
    const storageKey = hotelService.getRoomsStorageKey(hId);

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    // If it's the default demo hotel, use initialRooms
    if (hId === 'HTL-101') {
      return initialRooms;
    }

    // For any newly registered hotel, initialize its own rooms inventory cleanly
    let totalRoomsCount = 15;
    try {
      const hotels = JSON.parse(localStorage.getItem('staylog_hotels_v2')) || [];
      const hRecord = hotels.find(h => h.id === hId);
      if (hRecord && hRecord.totalRooms) {
        totalRoomsCount = Number(hRecord.totalRooms) || 15;
      }
    } catch (e) {}

    const generatedRooms = [];
    const roomTypes = ['Executive Deluxe', 'Super Deluxe', 'Standard Suite', 'Presidential Suite'];
    for (let i = 1; i <= totalRoomsCount; i++) {
      const floorNum = Math.floor((i - 1) / 5) + 1;
      const roomNum = floorNum * 100 + ((i - 1) % 5 + 1);
      const type = roomTypes[(i - 1) % roomTypes.length];
      const rate = type === 'Presidential Suite' ? 3500 : type === 'Super Deluxe' ? 2200 : type === 'Executive Deluxe' ? 1800 : 1500;
      generatedRooms.push({
        id: String(roomNum),
        number: String(roomNum),
        type,
        floor: `${floorNum}${floorNum === 1 ? 'st' : floorNum === 2 ? 'nd' : floorNum === 3 ? 'rd' : 'th'} Floor`,
        rate,
        status: 'VACANT',
      });
    }

    localStorage.setItem(storageKey, JSON.stringify(generatedRooms));
    return generatedRooms;
  },

  /**
   * Add a new room to the hotel's inventory.
   * @param {{ number: string, type: string, floor: string, rate: number }} roomData
   * @param {string|null} targetHotelId
   * @returns {{ success: boolean, message: string, rooms: Array }}
   */
  addRoom: (roomData, targetHotelId = null) => {
    const hId = targetHotelId || hotelService.getCurrentHotelId();
    const storageKey = hotelService.getRoomsStorageKey(hId);
    const rooms = hotelService.getRooms(hId);

    // Validate: room number must be unique within this hotel
    const exists = rooms.find(r => String(r.number) === String(roomData.number));
    if (exists) {
      return { success: false, message: `Room ${roomData.number} already exists in your inventory.`, rooms };
    }

    const newRoom = {
      id: String(roomData.number),
      number: String(roomData.number),
      type: roomData.type || 'Standard Suite',
      floor: roomData.floor || '1st Floor',
      rate: Number(roomData.rate) || 1500,
      status: 'VACANT',
    };

    rooms.push(newRoom);
    localStorage.setItem(storageKey, JSON.stringify(rooms));
    syncHotelOccupancyStats(rooms, hId);

    // Sync room to Central Backend DB
    fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...roomData, hotel_id: hId })
    }).catch(() => {
      fetch(getBackendFallbackUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roomData, hotel_id: hId })
      }).catch(() => {});
    });

    return { success: true, message: `Room ${newRoom.number} added successfully.`, rooms };
  },

  /**
   * Delete a room from inventory. Only VACANT rooms can be deleted.
   * @param {string} roomId - Room ID or number
   * @param {string|null} targetHotelId
   * @returns {{ success: boolean, message: string, rooms: Array }}
   */
  deleteRoom: (roomId, targetHotelId = null) => {
    const hId = targetHotelId || hotelService.getCurrentHotelId();
    const storageKey = hotelService.getRoomsStorageKey(hId);
    const rooms = hotelService.getRooms(hId);
    const room = rooms.find(r => r.id === roomId || String(r.number) === String(roomId));

    if (!room) {
      return { success: false, message: 'Room not found.', rooms };
    }
    if (room.status === 'OCCUPIED') {
      return { success: false, message: `Room ${room.number} is currently OCCUPIED. Check out the guest first.`, rooms };
    }

    const updatedRooms = rooms.filter(r => r.id !== room.id);
    localStorage.setItem(storageKey, JSON.stringify(updatedRooms));
    syncHotelOccupancyStats(updatedRooms, hId);

    return { success: true, message: `Room ${room.number} deleted.`, rooms: updatedRooms };
  },

  /**
   * Update room status (VACANT, OCCUPIED, CLEANING, MAINTENANCE).
   * IMPORTANT: When called with `_skipStaySync = true`, it will NOT auto-create
   * or remove active stays. This prevents circular loops when called from checkInGuest/checkOutGuest.
   */
  updateRoomStatus: (roomId, status, _skipStaySync = false, targetHotelId = null) => {
    const hId = targetHotelId || hotelService.getCurrentHotelId();
    const storageKey = hotelService.getRoomsStorageKey(hId);
    const rooms = hotelService.getRooms(hId);
    const targetRoom = rooms.find(r => r.id === roomId || String(r.number) === String(roomId));
    if (!targetRoom) return rooms;

    const previousStatus = targetRoom.status;
    if (previousStatus === status) return rooms; // no-op

    const updatedRooms = rooms.map(r =>
      (r.id === roomId || String(r.number) === String(roomId)) ? { ...r, status } : r
    );
    localStorage.setItem(storageKey, JSON.stringify(updatedRooms));

    // Only sync active stays when called from RoomManagement UI (not from checkIn/checkOut)
    if (!_skipStaySync) {
      const activeStays = hotelService.getActiveStays(hId);
      const roomNo = String(targetRoom.number);

      if (status === 'OCCUPIED' && previousStatus !== 'OCCUPIED') {
        // If manually marked OCCUPIED from Room Management, create a placeholder stay for this hotel
        const existingStay = activeStays.find(s => String(s.roomNumber) === roomNo);
        if (!existingStay) {
          const newStay = {
            id: generateId('STAY'),
            hotelId: hId,
            roomNumber: roomNo,
            checkInTime: new Date().toISOString(),
            expectedCheckOut: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            stayType: '24 Hours Full Stay',
            primaryGuest: {
              name: `Walk-in Guest (Room ${roomNo})`,
              phone: 'N/A',
              idType: 'N/A',
              idNumber: 'N/A',
              address: 'Manual Room Allocation',
              city: 'N/A'
            },
            accompanyingGuest: null,
            comingFrom: 'Direct',
            goingTo: 'Direct',
            purpose: 'Personal Stay',
            vehicleNo: 'N/A',
            roomRate: Number(targetRoom.rate) || 1800,
            advancePaid: Number(targetRoom.rate) || 1800,
            paymentMode: 'Cash',
            policeSubmitted: false,
            policeSubmittedAt: null,
            status: 'CHECKED_IN',
          };
          const rawStays = hotelService.getRawActiveStays();
          rawStays.unshift(newStay);
          localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(rawStays));
          hotelService.addPoliceLogEntry(newStay);
        }
      } else if (status !== 'OCCUPIED' && previousStatus === 'OCCUPIED') {
        // If moved away from OCCUPIED, remove from active stays for this hotel
        const rawStays = hotelService.getRawActiveStays();
        const stayToRemove = rawStays.find(s => (s.hotelId === hId || (!s.hotelId && hId === 'HTL-101')) && String(s.roomNumber) === roomNo);
        const updatedStays = rawStays.filter(s => !((s.hotelId === hId || (!s.hotelId && hId === 'HTL-101')) && String(s.roomNumber) === roomNo));
        localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(updatedStays));

        if (stayToRemove) {
          hotelService.updatePoliceLogCheckOut(roomNo, stayToRemove.primaryGuest?.name);
        }
      }
    }

    syncHotelOccupancyStats(updatedRooms, hId);

    // Sync room status change to central DB
    const roomNoToUpdate = String(targetRoom.number);
    fetch(`/api/rooms/${roomNoToUpdate}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotel_id: hId, status })
    }).catch(() => {
      fetch(getBackendFallbackUrl(`/api/rooms/${roomNoToUpdate}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hId, status })
      }).catch(() => {});
    });

    return updatedRooms;
  },

  updateRoomTariff: (roomId, newRate, targetHotelId = null) => {
    const hId = targetHotelId || hotelService.getCurrentHotelId();
    const storageKey = hotelService.getRoomsStorageKey(hId);
    const rooms = hotelService.getRooms(hId);
    const updated = rooms.map(r =>
      (r.id === roomId || String(r.number) === String(roomId))
        ? { ...r, rate: Number(newRate) || r.rate }
        : r
    );
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Sync room tariff change to central DB
    fetch(`/api/rooms/${roomId}/tariff`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotel_id: hId, rate: Number(newRate) })
    }).catch(() => {
      fetch(getBackendFallbackUrl(`/api/rooms/${roomId}/tariff`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hId, rate: Number(newRate) })
      }).catch(() => {});
    });

    return updated;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIVE STAYS API (Partitioned per Hotel)
  // ══════════════════════════════════════════════════════════════════════════

  getRawActiveStays: () => {
    try {
      return JSON.parse(localStorage.getItem(ACTIVE_STAYS_STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  },

  // Fetch active stays from Central DB and update local cache
  fetchActiveStays: async (targetHotelId = null) => {
    const hId = targetHotelId || hotelService.getCurrentHotelId();
    try {
      let res = await fetch(`/api/guests/active-stays?hotel_id=${encodeURIComponent(hId)}`);
      if (!res.ok) {
        res = await fetch(getBackendFallbackUrl(`/api/guests/active-stays?hotel_id=${encodeURIComponent(hId)}`));
      }
      if (res && res.ok) {
        const json = await res.json();
        if (json.stays && Array.isArray(json.stays)) {
          // Merge active stays for this hotel into storage
          const rawStays = hotelService.getRawActiveStays();
          const otherHotelsStays = rawStays.filter(s => s.hotelId !== hId && (s.hotelId || hId !== 'HTL-101'));
          const merged = [...json.stays, ...otherHotelsStays];
          localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(merged));
          return json.stays;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch active stays from backend DB:', e);
    }
    return hotelService.getActiveStays(hId);
  },

  getActiveStays: (targetHotelId = null) => {
    const hId = targetHotelId || hotelService.getCurrentHotelId();
    const rawStays = hotelService.getRawActiveStays();
    return rawStays.filter(s => s.hotelId === hId || (!s.hotelId && hId === 'HTL-101'));
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GUEST DATABASE (Frequent Guest Ledger)
  // ══════════════════════════════════════════════════════════════════════════

  lookupGuestByPhoneOrAadhaar: (query) => {
    if (!query || query.trim().length < 3) return null;
    const cleanQuery = query.trim().replace(/\s+/g, '');
    const guests = hotelService.getAllGuests();

    const match = guests.find(g => {
      const phoneMatch = g.phone && g.phone.replace(/\s+/g, '').includes(cleanQuery);
      const aadhaarMatch = g.aadhaar && g.aadhaar.replace(/\s+/g, '').includes(cleanQuery);
      const nameMatch = g.primaryGuest && g.primaryGuest.name.toLowerCase().includes(cleanQuery.toLowerCase());
      return phoneMatch || aadhaarMatch || nameMatch;
    });

    return match || null;
  },

  getAllGuests: () => {
    try {
      return JSON.parse(localStorage.getItem(GUESTS_STORAGE_KEY)) || frequentGuestsDatabase;
    } catch (e) {
      return frequentGuestsDatabase;
    }
  },

  saveOrUpdateGuestHistory: (primaryGuest, accompanyingGuest) => {
    const guests = hotelService.getAllGuests();
    const existingIndex = guests.findIndex(g =>
      (g.phone && g.phone === primaryGuest.phone) ||
      (g.aadhaar && g.aadhaar === primaryGuest.idNumber)
    );

    const todayStr = new Date().toISOString().split('T')[0];

    if (existingIndex >= 0) {
      // Update visit count & last visit date
      guests[existingIndex].totalVisits = (guests[existingIndex].totalVisits || 1) + 1;
      guests[existingIndex].lastVisited = todayStr;
      guests[existingIndex].primaryGuest = { ...guests[existingIndex].primaryGuest, ...primaryGuest };
      if (accompanyingGuest) {
        guests[existingIndex].accompanyingGuest = { ...guests[existingIndex].accompanyingGuest, ...accompanyingGuest };
      }
    } else {
      // Create new profile
      const newProfile = {
        phone: primaryGuest.phone || '',
        aadhaar: primaryGuest.idType === 'Aadhaar Card' ? primaryGuest.idNumber : '',
        primaryGuest: { ...primaryGuest },
        accompanyingGuest: accompanyingGuest ? { ...accompanyingGuest } : null,
        totalVisits: 1,
        lastVisited: todayStr,
        isBlacklisted: false,
        vipStatus: false,
      };
      guests.unshift(newProfile);
    }

    localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(guests));
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHECK-IN (Express or New Guest)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Performs guest check-in. This is the SINGLE source of truth for check-in flow:
   * 1. Save to backend SQLite DB (async, fire-and-forget on failure)
   * 2. Create active stay record in localStorage scoped to the hotel
   * 3. Mark room as OCCUPIED (with _skipStaySync to prevent circular loop)
   * 4. Update frequent guest ledger
   * 5. Add police log entry with hotelId
   */
  checkInGuest: async (stayData) => {
    // Get current user's hotel ID
    let currentHotelId = 'HTL-101';
    try {
      const user = JSON.parse(localStorage.getItem('staylog_session_v2')) || {};
      currentHotelId = stayData.hotelId || user.hotelId || 'HTL-101';
    } catch (e) {
      currentHotelId = stayData.hotelId || 'HTL-101';
    }

    const roomNo = String(stayData.roomNumber);
    const hotelActiveStays = hotelService.getActiveStays(currentHotelId);

    // Prevent double check-in to same room within THIS hotel
    const alreadyOccupied = hotelActiveStays.find(s => String(s.roomNumber) === roomNo);
    if (alreadyOccupied) {
      console.warn(`Room ${roomNo} already has an active stay in hotel ${currentHotelId}. Skipping duplicate check-in.`);
      return alreadyOccupied;
    }

    const newStayId = generateId('STAY');
    let regNo = `REG-${String(hotelActiveStays.length + 1).padStart(4, '0')}`;
    let dbId = null;

    // Save to backend SQLite DB
    try {
      const payload = {
        roomNumber: roomNo,
        stayType: stayData.stayType || '24 Hours Full Stay',
        roomRate: Number(stayData.roomRate) || 1800,
        advancePaid: Number(stayData.advancePaid) || Number(stayData.roomRate) || 1800,
        paymentMode: stayData.paymentMode || 'Cash',
        comingFrom: stayData.comingFrom || 'Local / Direct',
        goingTo: stayData.goingTo || 'Local / Direct',
        purpose: stayData.purpose || 'Personal Stay',
        vehicleNo: stayData.vehicleNo || 'N/A',
        primaryGuest: stayData.primaryGuest,
        accompanyingGuest: stayData.accompanyingGuest || null,
        partnerDocumentFront: stayData.accompanyingGuest?.documentFront || stayData.documentFrontPartner || null,
        partnerDocumentBack: stayData.accompanyingGuest?.documentBack || stayData.documentBackPartner || null,
        documentFront: stayData.documentFront || null,
        documentBack: stayData.documentBack || null,
        signature: stayData.signature || null,
        hotelId: currentHotelId,
      };

      let res = null;
      try {
        res = await fetch('/api/guests/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch {
        res = await fetch(getBackendFallbackUrl('/api/guests/checkin'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res && res.ok) {
        const json = await res.json();
        if (json.record) {
          regNo = json.record.reg_no || regNo;
          dbId = json.record.id || null;
        }
      }
    } catch (dbErr) {
      console.warn('Backend database check-in warning:', dbErr);
    }

    // Create the stay record
    const newStayRecord = {
      id: newStayId,
      regNo: regNo,
      dbId: null,
      hotelId: currentHotelId,
      roomNumber: roomNo,
      checkInTime: new Date().toISOString(),
      expectedCheckOut: stayData.expectedCheckOut || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      stayType: stayData.stayType || '24 Hours Full Stay',
      primaryGuest: stayData.primaryGuest,
      accompanyingGuest: stayData.accompanyingGuest || null,
      comingFrom: stayData.comingFrom || 'Local / Direct',
      goingTo: stayData.goingTo || 'Local / Direct',
      purpose: stayData.purpose || 'Personal Stay',
      vehicleNo: stayData.vehicleNo || 'N/A',
      roomRate: Number(stayData.roomRate) || 1800,
      advancePaid: Number(stayData.advancePaid) || Number(stayData.roomRate) || 1800,
      paymentMode: stayData.paymentMode || 'Cash',
      documentFront: stayData.documentFront || null,
      documentBack: stayData.documentBack || null,
      signature: stayData.signature || null,
      checkOutSignature: null,
      policeSubmitted: true,
      policeSubmittedAt: new Date().toISOString(),
      status: 'CHECKED_IN',
    };

    // 1. Add to active stays master (PRESERVES all hotels' active stays!)
    const rawStays = hotelService.getRawActiveStays();
    rawStays.unshift(newStayRecord);
    localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(rawStays));

    // 2. Add to master all-stays log
    try {
      const allStays = JSON.parse(localStorage.getItem(ALL_STAYS_STORAGE_KEY)) || [];
      allStays.unshift(newStayRecord);
      localStorage.setItem(ALL_STAYS_STORAGE_KEY, JSON.stringify(allStays));
    } catch (e) {
      console.warn('Failed to append to master stays log:', e);
    }

    // 3. Mark room as OCCUPIED in THIS hotel (_skipStaySync = true to prevent circular loop!)
    hotelService.updateRoomStatus(roomNo, 'OCCUPIED', true, currentHotelId);

    // 4. Update frequent guest ledger
    hotelService.saveOrUpdateGuestHistory(stayData.primaryGuest, stayData.accompanyingGuest);

    // 5. Add police log entry with hotelId
    hotelService.addPoliceLogEntry(newStayRecord);

    return newStayRecord;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHECK-OUT
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Checks out a guest. Accepts either a stay ID or room number, scoped by hotelId.
   * Also accepts checkOutData containing { checkOutSignature, settlementMode, notes }.
   */
  checkOutGuest: async (stayIdOrRoom, targetHotelId = null, checkOutData = null) => {
    const hId = targetHotelId || hotelService.getCurrentHotelId();
    const rawStays = hotelService.getRawActiveStays();

    // Find the stay: try by ID first, then by room number within THIS hotel
    let stayToCheckout = rawStays.find(s => s.id === stayIdOrRoom);
    if (!stayToCheckout) {
      stayToCheckout = rawStays.find(s =>
        (s.hotelId === hId || (!s.hotelId && hId === 'HTL-101')) &&
        String(s.roomNumber) === String(stayIdOrRoom)
      );
    }

    if (!stayToCheckout) {
      console.warn(`No active stay found for: ${stayIdOrRoom} in hotel: ${hId}`);
      return null;
    }

    const stayHotelId = stayToCheckout.hotelId || hId;
    const checkoutSignature = checkOutData?.checkOutSignature || null;

    // Notify backend database with checkout signature
    try {
      const checkoutPayload = {
        checkout_signature: checkoutSignature,
        signature: checkoutSignature,
      };
      let res = null;
      try {
        res = await fetch(`/api/guests/checkout/${stayToCheckout.roomNumber}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkoutPayload)
        });
      } catch {
        res = await fetch(getBackendFallbackUrl(`/api/guests/checkout/${stayToCheckout.roomNumber}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkoutPayload)
        });
      }
    } catch (e) {
      console.warn('Backend checkout failed:', e);
    }

    // Remove this specific stay from master active stays (preserves all other hotels!)
    const updatedRawStays = rawStays.filter(s => s.id !== stayToCheckout.id);
    localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(updatedRawStays));

    // Update check-out timestamp & signature in master all-stays log
    const nowIso = new Date().toISOString();
    try {
      const allStays = JSON.parse(localStorage.getItem(ALL_STAYS_STORAGE_KEY)) || [];
      const updatedAllStays = allStays.map(s => {
        if (s.id === stayToCheckout.id || (s.hotelId === stayHotelId && String(s.roomNumber) === String(stayToCheckout.roomNumber) && s.status === 'CHECKED_IN')) {
          return {
            ...s,
            status: 'CHECKED_OUT',
            checkOutTime: nowIso,
            checkOutSignature: checkoutSignature || s.checkOutSignature || null,
            settlementMode: checkOutData?.settlementMode || s.paymentMode || 'Cash',
          };
        }
        return s;
      });
      localStorage.setItem(ALL_STAYS_STORAGE_KEY, JSON.stringify(updatedAllStays));
    } catch (e) {}

    // Update room status to CLEANING for this specific hotel (_skipStaySync = true!)
    hotelService.updateRoomStatus(stayToCheckout.roomNumber, 'CLEANING', true, stayHotelId);

    // Update check-out timestamp in Police log
    hotelService.updatePoliceLogCheckOut(stayToCheckout.roomNumber, stayToCheckout.primaryGuest?.name, stayHotelId);

    // Add checkout time & signature to the returned record for receipt
    stayToCheckout.checkOutTime = nowIso;
    stayToCheckout.status = 'CHECKED_OUT';
    stayToCheckout.checkOutSignature = checkoutSignature;
    if (checkOutData?.settlementMode) {
      stayToCheckout.settlementMode = checkOutData.settlementMode;
    }

    return stayToCheckout;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MASTER STAYS & HOTEL-WISE GUEST ENTRIES WITH ID PHOTOS (Admin Portal)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Retrieves all historical & active stays, optionally filtered by hotelId.
   */
  getAllStays: (hotelId = null) => {
    let allStays = [];
    try {
      allStays = JSON.parse(localStorage.getItem(ALL_STAYS_STORAGE_KEY)) || [];
    } catch (e) {
      allStays = [];
    }

    // Merge active stays if not already present
    const rawActive = hotelService.getRawActiveStays();
    rawActive.forEach(active => {
      const exists = allStays.some(s => s.id === active.id);
      if (!exists) {
        allStays.unshift(active);
      }
    });

    if (hotelId && hotelId !== 'ALL') {
      return allStays.filter(s => s.hotelId === hotelId || (!s.hotelId && hotelId === 'HTL-101'));
    }
    return allStays;
  },

  /**
   * Retrieves date-wise guest registrations for a specific hotel, merging
   * both backend SQLite/PostgreSQL records and frontend master stays.
   * Ensures front and back ID document images are always included.
   */
  getHotelGuestHistory: async (hotelId = null) => {
    const localStays = hotelService.getAllStays(hotelId);
    let backendRecords = [];

    try {
      const url = hotelId && hotelId !== 'ALL'
        ? `/api/guests/records?hotel_id=${encodeURIComponent(hotelId)}`
        : '/api/guests/records';

      let res = null;
      try {
        res = await fetch(url);
      } catch {
        res = await fetch(getBackendFallbackUrl(url));
      }

      if (res && res.ok) {
        const json = await res.json();
        backendRecords = json.records || [];
      }
    } catch (e) {
      console.warn('Backend fetch in getHotelGuestHistory failed:', e);
    }

    // Merge local and backend records by id/regNo
    const combinedMap = new Map();

    localStays.forEach(stay => {
      combinedMap.set(stay.id || stay.regNo, {
        id: stay.id,
        regNo: stay.regNo || 'REG-0000',
        hotelId: stay.hotelId || 'HTL-101',
        roomNumber: stay.roomNumber,
        checkInTime: stay.checkInTime,
        checkOutTime: stay.checkOutTime || null,
        stayType: stay.stayType || '24 Hours Full Stay',
        roomRate: stay.roomRate || 0,
        advancePaid: stay.advancePaid || 0,
        paymentMode: stay.paymentMode || 'Cash',
        status: stay.status || (stay.checkOutTime ? 'CHECKED_OUT' : 'CHECKED_IN'),
        guestName: stay.primaryGuest?.name || 'Guest',
        phone: stay.primaryGuest?.phone || 'N/A',
        idType: stay.primaryGuest?.idType || 'Aadhaar Card',
        idNumber: stay.primaryGuest?.idNumber || 'N/A',
        age: stay.primaryGuest?.age || 'N/A',
        gender: stay.primaryGuest?.gender || 'N/A',
        address: stay.primaryGuest?.address || '',
        city: stay.primaryGuest?.city || '',
        purpose: stay.purpose || 'Personal Stay',
        vehicleNo: stay.vehicleNo || 'N/A',
        documentFront: stay.documentFront || null,
        documentBack: stay.documentBack || null,
        signature: stay.signature || null,
        checkOutSignature: stay.checkOutSignature || null,
        accompanyingGuest: stay.accompanyingGuest || null,
        partnerDocumentFront: stay.accompanyingGuest?.documentFront || stay.accompanyingGuest?.document_front || null,
        partnerDocumentBack: stay.accompanyingGuest?.documentBack || stay.accompanyingGuest?.document_back || null,
        hasDocFront: !!stay.documentFront,
        hasDocBack: !!stay.documentBack,
        hasSignature: !!stay.signature,
        hasPartnerDoc: !!(stay.accompanyingGuest?.documentFront || stay.accompanyingGuest?.documentBack),
        hasCheckoutSignature: !!stay.checkOutSignature,
        source: 'local',
      });
    });

    backendRecords.forEach(bRec => {
      const key = `DB-${bRec.id}` || bRec.reg_no;
      if (!combinedMap.has(key)) {
        const partner = bRec.accompanying_guest;
        const pFront = bRec.partner_document_front || partner?.documentFront || partner?.document_front || null;
        const pBack = bRec.partner_document_back || partner?.documentBack || partner?.document_back || null;
        combinedMap.set(key, {
          id: key,
          regNo: bRec.reg_no,
          hotelId: bRec.hotel_id || 'HTL-101',
          roomNumber: bRec.room_number,
          checkInTime: bRec.created_at,
          checkOutTime: bRec.checked_out_at || null,
          stayType: bRec.stay_type,
          roomRate: bRec.room_rate,
          advancePaid: bRec.advance_paid,
          paymentMode: bRec.payment_mode,
          status: bRec.status,
          guestName: bRec.guest_name,
          phone: bRec.phone,
          idType: bRec.id_type,
          idNumber: bRec.id_number,
          address: bRec.address,
          city: bRec.city,
          purpose: bRec.purpose,
          vehicleNo: bRec.vehicle_no,
          documentFront: bRec.document_front || null,
          documentBack: bRec.document_back || null,
          signature: bRec.signature || null,
          checkOutSignature: bRec.checkout_signature || null,
          accompanyingGuest: partner || null,
          partnerDocumentFront: pFront,
          partnerDocumentBack: pBack,
          hasDocFront: bRec.has_doc_front === 1 || !!bRec.document_front,
          hasDocBack: bRec.has_doc_back === 1 || !!bRec.document_back,
          hasSignature: bRec.has_signature === 1 || !!bRec.signature,
          hasPartnerDoc: (bRec.has_partner_doc === 1) || !!pFront || !!pBack,
          hasCheckoutSignature: (bRec.has_checkout_signature === 1) || !!bRec.checkout_signature,
          source: 'backend',
        });
      }
    });

    const list = Array.from(combinedMap.values());
    // Sort descending by checkInTime
    list.sort((a, b) => new Date(b.checkInTime || 0) - new Date(a.checkInTime || 0));
    return list;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BACKEND DATABASE RECORDS (SQLite / PostgreSQL)
  // ══════════════════════════════════════════════════════════════════════════

  getDatabaseRecords: async (search = '', targetHotelId = null) => {
    const hId = targetHotelId || hotelService.getCurrentHotelId();
    let backendRecords = [];
    try {
      let queryParams = [];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (hId && hId !== 'ALL') queryParams.push(`hotel_id=${encodeURIComponent(hId)}`);
      const qs = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const url = `/api/guests/records${qs}`;

      let res = null;
      try {
        res = await fetch(url);
      } catch {
        res = await fetch(getBackendFallbackUrl(url));
      }
      if (res && res.ok) {
        const json = await res.json();
        backendRecords = json.records || [];
      }
    } catch (e) {
      console.warn('Failed to fetch from backend database:', e);
    }

    if (backendRecords.length > 0) {
      return backendRecords;
    }

    // Fallback: populate from local stays if backend returned empty/offline
    const localStays = hotelService.getAllStays(hId);
    let mapped = localStays.map(s => {
      const partner = s.accompanyingGuest;
      const partnerFront = partner?.documentFront || partner?.document_front || null;
      const partnerBack = partner?.documentBack || partner?.document_back || null;
      return {
        id: s.id,
        reg_no: s.regNo || 'REG-0000',
        created_at: s.checkInTime || new Date().toISOString(),
        room_number: s.roomNumber,
        stay_type: s.stayType || '24 Hours Full Stay',
        room_rate: s.roomRate || 0,
        advance_paid: s.advancePaid || 0,
        payment_mode: s.paymentMode || 'Cash',
        guest_name: s.primaryGuest?.name || 'Guest',
        phone: s.primaryGuest?.phone || 'N/A',
        id_type: s.primaryGuest?.idType || 'Aadhaar Card',
        id_number: s.primaryGuest?.idNumber || 'N/A',
        address: s.primaryGuest?.address || '',
        city: s.primaryGuest?.city || '',
        pincode: s.primaryGuest?.pincode || '',
        status: s.status || (s.checkOutTime ? 'CHECKED_OUT' : 'CHECKED_IN'),
        checked_out_at: s.checkOutTime || null,
        hotel_id: s.hotelId || hId,
        document_front: s.documentFront || null,
        document_back: s.documentBack || null,
        signature: s.signature || null,
        checkout_signature: s.checkOutSignature || null,
        partner_document_front: partnerFront,
        partner_document_back: partnerBack,
        accompanying_guest: partner || null,
        has_doc_front: s.documentFront ? 1 : 0,
        has_doc_back: s.documentBack ? 1 : 0,
        has_signature: s.signature ? 1 : 0,
        has_partner_doc: (partnerFront || partnerBack) ? 1 : 0,
        has_checkout_signature: s.checkOutSignature ? 1 : 0,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      mapped = mapped.filter(r =>
        (r.guest_name && r.guest_name.toLowerCase().includes(q)) ||
        (r.phone && r.phone.includes(q)) ||
        (r.reg_no && r.reg_no.toLowerCase().includes(q)) ||
        (String(r.room_number).includes(q))
      );
    }
    return mapped;
  },

  getDatabaseRecordById: async (recordId) => {
    try {
      let res = null;
      try {
        res = await fetch(`/api/guests/records/${recordId}`);
      } catch {
        res = await fetch(getBackendFallbackUrl(`/api/guests/records/${recordId}`));
      }
      if (res && res.ok) {
        const json = await res.json();
        if (json.record) {
          const rec = json.record;
          const partner = rec.accompanying_guest || (rec.accompanying_guest_json ? (typeof rec.accompanying_guest_json === 'string' ? JSON.parse(rec.accompanying_guest_json) : rec.accompanying_guest_json) : null);
          if (partner) {
            rec.accompanying_guest = partner;
            if (!rec.partner_document_front) rec.partner_document_front = partner.documentFront || partner.document_front;
            if (!rec.partner_document_back) rec.partner_document_back = partner.documentBack || partner.document_back;
          }
          return rec;
        }
      }
    } catch (e) {
      console.warn('Backend getDatabaseRecordById error:', e);
    }

    // Fallback: check local storage stays
    const allStays = hotelService.getAllStays('ALL');
    const match = allStays.find(s => String(s.id) === String(recordId) || String(s.regNo) === String(recordId));
    if (match) {
      const partner = match.accompanyingGuest;
      return {
        id: match.id,
        reg_no: match.regNo,
        created_at: match.checkInTime,
        room_number: match.roomNumber,
        stay_type: match.stayType,
        room_rate: match.roomRate,
        advance_paid: match.advancePaid,
        payment_mode: match.paymentMode,
        guest_name: match.primaryGuest?.name,
        phone: match.primaryGuest?.phone,
        id_type: match.primaryGuest?.idType,
        id_number: match.primaryGuest?.idNumber,
        address: match.primaryGuest?.address,
        city: match.primaryGuest?.city,
        pincode: match.primaryGuest?.pincode,
        status: match.status,
        checked_out_at: match.checkOutTime,
        hotel_id: match.hotelId,
        document_front: match.documentFront,
        document_back: match.documentBack,
        signature: match.signature,
        checkout_signature: match.checkOutSignature,
        partner_document_front: partner?.documentFront || partner?.document_front,
        partner_document_back: partner?.documentBack || partner?.document_back,
        accompanying_guest: partner,
      };
    }
    return null;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // POLICE LOGS
  // ══════════════════════════════════════════════════════════════════════════

  getPoliceLogs: (targetHotelId = null) => {
    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem(POLICE_LOGS_STORAGE_KEY)) || initialHistoricalPoliceLogs;
    } catch (e) {
      logs = initialHistoricalPoliceLogs;
    }
    if (!targetHotelId || targetHotelId === 'ALL') {
      return logs;
    }
    return logs.filter(l => l.hotelId === targetHotelId || (!l.hotelId && targetHotelId === 'HTL-101'));
  },

  addPoliceLogEntry: (stayRecord) => {
    const logs = hotelService.getPoliceLogs('ALL');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newLog = {
      id: generateId('LOG'),
      hotelId: stayRecord.hotelId || hotelService.getCurrentHotelId(),
      date: dateStr,
      checkInTime: `${dateStr} ${timeStr}`,
      checkOutTime: 'Active Stay',
      roomNumber: stayRecord.roomNumber,
      guestName: stayRecord.primaryGuest?.name || 'Unknown',
      ageGender: `${stayRecord.primaryGuest?.age || 'N/A'} / ${stayRecord.primaryGuest?.gender || 'N/A'}`,
      mobile: stayRecord.primaryGuest?.phone || 'N/A',
      address: `${stayRecord.primaryGuest?.address || ''}, ${stayRecord.primaryGuest?.city || ''}`,
      idTypeNo: `${stayRecord.primaryGuest?.idType || 'N/A'}: ${stayRecord.primaryGuest?.idNumber || 'N/A'}`,
      accompanying: stayRecord.accompanyingGuest
        ? `${stayRecord.accompanyingGuest.name} (${stayRecord.accompanyingGuest.age || ''}/${stayRecord.accompanyingGuest.gender ? stayRecord.accompanyingGuest.gender[0] : ''}, ${stayRecord.accompanyingGuest.idType}: ${stayRecord.accompanyingGuest.idNumber})`
        : 'Single Guest',
      purpose: stayRecord.purpose || 'Personal',
      policeSubmitted: true,
    };

    logs.unshift(newLog);
    localStorage.setItem(POLICE_LOGS_STORAGE_KEY, JSON.stringify(logs));
  },

  updatePoliceLogCheckOut: (roomNumber, guestName, targetHotelId = null) => {
    const hId = targetHotelId || hotelService.getCurrentHotelId();
    const logs = hotelService.getPoliceLogs('ALL');
    const logIndex = logs.findIndex(l =>
      (l.hotelId === hId || (!l.hotelId && hId === 'HTL-101')) &&
      String(l.roomNumber) === String(roomNumber) &&
      (!guestName || l.guestName === guestName) &&
      l.checkOutTime === 'Active Stay'
    );

    if (logIndex >= 0) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      logs[logIndex].checkOutTime = `${dateStr} ${timeStr}`;
      localStorage.setItem(POLICE_LOGS_STORAGE_KEY, JSON.stringify(logs));
    }
  },

  toggleBlacklist: (phoneOrAadhaar) => {
    const guests = hotelService.getAllGuests();
    const updated = guests.map(g => {
      if (g.phone === phoneOrAadhaar || g.aadhaar === phoneOrAadhaar) {
        return { ...g, isBlacklisted: !g.isBlacklisted };
      }
      return g;
    });
    localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AREA & MULTI-HOTEL OCCUPANCY (Police Portal)
  // ══════════════════════════════════════════════════════════════════════════

  getAreasList: () => {
    return [
      { id: 'ALL', name: 'All Jurisdictions / Areas' },
      { id: 'Metro Division Sector 4', name: 'Metro Division Sector 4' },
      { id: 'Central Market & Station Road', name: 'Central Market & Station Road' },
      { id: 'East IT Park Zone', name: 'East IT Park Zone' },
      { id: 'South Suburban Zone', name: 'South Suburban Zone' },
    ];
  },

  getHotelsWithOccupancy: (selectedArea = 'ALL') => {
    const HOTELS_KEY = 'staylog_hotels_v2';
    let hotels = [];
    try {
      hotels = JSON.parse(localStorage.getItem(HOTELS_KEY)) || [];
    } catch (e) {
      hotels = [];
    }

    const hotelsWithLiveStats = hotels.map(hotel => {
      const hotelRooms = hotelService.getRooms(hotel.id);
      const liveOccupied = hotelRooms.filter(r => r.status === 'OCCUPIED').length;
      const liveVacant = hotelRooms.filter(r => r.status === 'VACANT').length;
      const liveTotal = hotelRooms.length || hotel.totalRooms || 15;
      return {
        ...hotel,
        totalRooms: liveTotal,
        occupiedRooms: liveOccupied,
        vacantRooms: liveVacant,
        occupancyRate: liveTotal > 0 ? Math.round((liveOccupied / liveTotal) * 100) : 0,
        isLiveSync: true,
      };
    });

    if (selectedArea === 'ALL') {
      return hotelsWithLiveStats;
    }
    return hotelsWithLiveStats.filter(h => h.area === selectedArea);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // POLICE DOCUMENT REQUISITION SYSTEM
  // ══════════════════════════════════════════════════════════════════════════

  getDocumentRequests: () => {
    const DOC_REQUESTS_KEY = 'staylog_police_doc_requests_v1';
    try {
      const stored = localStorage.getItem(DOC_REQUESTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    // Initial pre-seeded requests
    const initialDocRequests = [];

    localStorage.setItem(DOC_REQUESTS_KEY, JSON.stringify(initialDocRequests));
    return initialDocRequests;
  },

  createDocumentRequest: (reqData) => {
    const DOC_REQUESTS_KEY = 'staylog_police_doc_requests_v1';
    const requests = hotelService.getDocumentRequests();

    const allGuests = hotelService.getAllGuests();
    const matchGuest = allGuests.find(g =>
      g.primaryGuest?.name?.toLowerCase() === reqData.guestName?.toLowerCase()
    );

    const primaryDoc = {
      type: `${matchGuest?.primaryGuest?.idType || 'Aadhaar Card'} (Primary Guest)`,
      holderName: reqData.guestName,
      idNumber: reqData.idTypeNo?.split(':')?.[1]?.trim() || matchGuest?.primaryGuest?.idNumber || '4821 9901 3342',
      dob: matchGuest?.primaryGuest?.dob || '12/05/1996',
      gender: matchGuest?.primaryGuest?.gender || 'Male',
      address: matchGuest?.primaryGuest?.address || 'Metro City Residential Colony',
      photoUrl: matchGuest?.primaryGuest?.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
      issuer: 'Government of India Statutory Authority',
    };

    const docs = [primaryDoc];

    if (matchGuest?.accompanyingGuest?.name) {
      docs.push({
        type: `${matchGuest.accompanyingGuest.idType || 'Aadhaar Card'} (Accompanying Partner)`,
        holderName: matchGuest.accompanyingGuest.name,
        idNumber: matchGuest.accompanyingGuest.idNumber || '7721 8890 1144',
        dob: '19/09/1998',
        gender: matchGuest.accompanyingGuest.gender || 'Female',
        address: matchGuest.accompanyingGuest.address || matchGuest.primaryGuest?.address || 'Metro City',
        photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
        issuer: 'Government of India Statutory Authority',
      });
    }

    const newRequest = {
      id: generateId('REQ-DOC'),
      guestName: reqData.guestName,
      roomNumber: reqData.roomNumber,
      idTypeNo: reqData.idTypeNo,
      hotelId: reqData.hotelId || 'HTL-101',
      hotelName: reqData.hotelName || 'Guestbooks Hotel & Lodge',
      officerName: reqData.officerName || 'Inspector In-Charge',
      stationName: reqData.stationName || 'State Police Station',
      badgeNo: reqData.badgeNo || 'POL-INSP-8891',
      caseRef: reqData.caseRef || `GD-${Math.floor(1000 + Math.random() * 9000)}/2026`,
      reason: reqData.reason || 'Official Law Enforcement Verification',
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      notes: reqData.notes || '',
      documents: docs,
    };

    requests.unshift(newRequest);
    localStorage.setItem(DOC_REQUESTS_KEY, JSON.stringify(requests));
    return newRequest;
  },

  approveDocumentRequest: (requestId, reviewer = 'Guestbooks Manager', notes = '') => {
    const DOC_REQUESTS_KEY = 'staylog_police_doc_requests_v1';
    const requests = hotelService.getDocumentRequests();
    const updated = requests.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'APPROVED',
          reviewedAt: new Date().toISOString(),
          reviewedBy: reviewer,
          approvalNotes: notes || 'Documents released under statutory law enforcement cooperation.',
        };
      }
      return r;
    });
    localStorage.setItem(DOC_REQUESTS_KEY, JSON.stringify(updated));
    return updated;
  },

  rejectDocumentRequest: (requestId, rejectReason = 'Requires SHO signed court order or formal warrant.') => {
    const DOC_REQUESTS_KEY = 'staylog_police_doc_requests_v1';
    const requests = hotelService.getDocumentRequests();
    const updated = requests.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'REJECTED',
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Guestbooks Hotel Manager',
          rejectReason: rejectReason,
        };
      }
      return r;
    });
    localStorage.setItem(DOC_REQUESTS_KEY, JSON.stringify(updated));
    return updated;
  },

  getRequestByGuestAndRoom: (guestName, roomNumber) => {
    const requests = hotelService.getDocumentRequests();
    return requests.find(r =>
      r.guestName?.toLowerCase() === guestName?.toLowerCase() &&
      String(r.roomNumber) === String(roomNumber)
    ) || null;
  }
};
