import { initialRooms, frequentGuestsDatabase, initialActiveStays, initialHistoricalPoliceLogs } from '../mockData.js';

const ROOMS_STORAGE_KEY = 'staylog_rooms_v1';
const GUESTS_STORAGE_KEY = 'staylog_guests_v1';
const ACTIVE_STAYS_STORAGE_KEY = 'staylog_active_stays_v1';
const ALL_STAYS_STORAGE_KEY = 'staylog_all_stays_master_v1';
const POLICE_LOGS_STORAGE_KEY = 'staylog_police_logs_v1';

// ── Unique ID Generator (timestamp + random, no collisions) ──────────────────
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

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
const syncHotelOccupancyStats = (rooms) => {
  try {
    const hotels = JSON.parse(localStorage.getItem('staylog_hotels_v2')) || [];
    const occCount = rooms.filter(r => r.status === 'OCCUPIED').length;
    const updatedHotels = hotels.map(h => {
      if (h.id === 'HTL-101') {
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

  // ══════════════════════════════════════════════════════════════════════════
  // ROOMS CRUD API
  // ══════════════════════════════════════════════════════════════════════════

  getRooms: () => {
    try {
      return JSON.parse(localStorage.getItem(ROOMS_STORAGE_KEY)) || initialRooms;
    } catch (e) {
      return initialRooms;
    }
  },

  /**
   * Add a new room to the inventory.
   * @param {{ number: string, type: string, floor: string, rate: number }} roomData
   * @returns {{ success: boolean, message: string, rooms: Array }}
   */
  addRoom: (roomData) => {
    const rooms = hotelService.getRooms();

    // Validate: room number must be unique
    const exists = rooms.find(r => String(r.number) === String(roomData.number));
    if (exists) {
      return { success: false, message: `Room ${roomData.number} already exists.`, rooms };
    }

    const newRoom = {
      id: String(roomData.number), // use room number as ID for consistency
      number: String(roomData.number),
      type: roomData.type || 'Standard Suite',
      floor: roomData.floor || '1st Floor',
      rate: Number(roomData.rate) || 1500,
      status: 'VACANT',
    };

    rooms.push(newRoom);
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    syncHotelOccupancyStats(rooms);

    return { success: true, message: `Room ${newRoom.number} added successfully.`, rooms };
  },

  /**
   * Delete a room from inventory. Only VACANT rooms can be deleted.
   * @param {string} roomId - Room ID or number
   * @returns {{ success: boolean, message: string, rooms: Array }}
   */
  deleteRoom: (roomId) => {
    const rooms = hotelService.getRooms();
    const room = rooms.find(r => r.id === roomId || String(r.number) === String(roomId));

    if (!room) {
      return { success: false, message: 'Room not found.', rooms };
    }
    if (room.status === 'OCCUPIED') {
      return { success: false, message: `Room ${room.number} is currently OCCUPIED. Check out the guest first.`, rooms };
    }

    const updatedRooms = rooms.filter(r => r.id !== room.id);
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(updatedRooms));
    syncHotelOccupancyStats(updatedRooms);

    return { success: true, message: `Room ${room.number} deleted.`, rooms: updatedRooms };
  },

  /**
   * Update room status (VACANT, OCCUPIED, CLEANING, MAINTENANCE).
   * IMPORTANT: When called with `_skipStaySync = true`, it will NOT auto-create
   * or remove active stays. This prevents circular loops when called from checkInGuest/checkOutGuest.
   */
  updateRoomStatus: (roomId, status, _skipStaySync = false) => {
    const rooms = hotelService.getRooms();
    const targetRoom = rooms.find(r => r.id === roomId || String(r.number) === String(roomId));
    if (!targetRoom) return rooms;

    const previousStatus = targetRoom.status;
    if (previousStatus === status) return rooms; // no-op

    const updatedRooms = rooms.map(r =>
      (r.id === roomId || String(r.number) === String(roomId)) ? { ...r, status } : r
    );
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(updatedRooms));

    // Only sync active stays when called from RoomManagement UI (not from checkIn/checkOut)
    if (!_skipStaySync) {
      const activeStays = hotelService.getActiveStays();
      const roomNo = String(targetRoom.number);

      if (status === 'OCCUPIED' && previousStatus !== 'OCCUPIED') {
        // If manually marked OCCUPIED from Room Management, create a placeholder stay
        const existingStay = activeStays.find(s => String(s.roomNumber) === roomNo);
        if (!existingStay) {
          const newStay = {
            id: generateId('STAY'),
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
          };
          activeStays.unshift(newStay);
          localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(activeStays));
          hotelService.addPoliceLogEntry(newStay);
        }
      } else if (status !== 'OCCUPIED' && previousStatus === 'OCCUPIED') {
        // If moved away from OCCUPIED, remove from active stays
        const stayToRemove = activeStays.find(s => String(s.roomNumber) === roomNo);
        const updatedStays = activeStays.filter(s => String(s.roomNumber) !== roomNo);
        localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(updatedStays));

        if (stayToRemove) {
          hotelService.updatePoliceLogCheckOut(roomNo, stayToRemove.primaryGuest?.name);
        }
      }
    }

    syncHotelOccupancyStats(updatedRooms);
    return updatedRooms;
  },

  updateRoomTariff: (roomId, newRate) => {
    const rooms = hotelService.getRooms();
    const updated = rooms.map(r =>
      (r.id === roomId || String(r.number) === String(roomId))
        ? { ...r, rate: Number(newRate) || r.rate }
        : r
    );
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIVE STAYS API
  // ══════════════════════════════════════════════════════════════════════════

  getActiveStays: () => {
    try {
      return JSON.parse(localStorage.getItem(ACTIVE_STAYS_STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
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
   * 2. Create active stay record in localStorage
   * 3. Mark room as OCCUPIED (with _skipStaySync to prevent circular loop)
   * 4. Update frequent guest ledger
   * 5. Add police log entry
   */
  checkInGuest: (stayData) => {
    const activeStays = hotelService.getActiveStays();
    const roomNo = String(stayData.roomNumber);

    // Prevent double check-in to same room
    const alreadyOccupied = activeStays.find(s => String(s.roomNumber) === roomNo);
    if (alreadyOccupied) {
      console.warn(`Room ${roomNo} already has an active stay. Skipping duplicate check-in.`);
      return alreadyOccupied;
    }

    const newStayId = generateId('STAY');
    const regNo = `REG-${String(activeStays.length + 1).padStart(4, '0')}`;

    // Get current user's hotel ID
    let currentHotelId = 'HTL-101';
    try {
      const user = JSON.parse(localStorage.getItem('staylog_session_v2')) || {};
      currentHotelId = stayData.hotelId || user.hotelId || 'HTL-101';
    } catch (e) {
      currentHotelId = stayData.hotelId || 'HTL-101';
    }

    // Fire backend DB save async (non-blocking)
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
        documentFront: stayData.documentFront || null,
        documentBack: stayData.documentBack || null,
        signature: stayData.signature || null,
        hotelId: currentHotelId,
      };

      fetch('/api/guests/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {
        fetch('http://127.0.0.1:8008/api/guests/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.warn('Backend DB check-in failed (non-critical):', err));
      });
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
      policeSubmitted: true,
      policeSubmittedAt: new Date().toISOString(),
      status: 'CHECKED_IN',
    };

    // 1. Add to active stays
    activeStays.unshift(newStayRecord);
    localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(activeStays));

    // 2. Add to master all-stays log
    try {
      const allStays = JSON.parse(localStorage.getItem(ALL_STAYS_STORAGE_KEY)) || [];
      allStays.unshift(newStayRecord);
      localStorage.setItem(ALL_STAYS_STORAGE_KEY, JSON.stringify(allStays));
    } catch (e) {
      console.warn('Failed to append to master stays log:', e);
    }

    // 3. Mark room as OCCUPIED (_skipStaySync = true to prevent circular loop!)
    hotelService.updateRoomStatus(roomNo, 'OCCUPIED', true);

    // 4. Update frequent guest ledger
    hotelService.saveOrUpdateGuestHistory(stayData.primaryGuest, stayData.accompanyingGuest);

    // 5. Add police log entry
    hotelService.addPoliceLogEntry(newStayRecord);

    return newStayRecord;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHECK-OUT
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Checks out a guest. Accepts either a stay ID or room number.
   * 1. Find the stay by ID first, then by room number
   * 2. Remove from active stays
   * 3. Update master all-stays record status to CHECKED_OUT
   * 4. Mark room as CLEANING (_skipStaySync to prevent circular loop)
   * 5. Update police log checkout time
   * 6. Notify backend DB (fire-and-forget)
   */
  checkOutGuest: (stayIdOrRoom) => {
    const activeStays = hotelService.getActiveStays();

    // Find the stay: try by ID first, then by room number
    let stayToCheckout = activeStays.find(s => s.id === stayIdOrRoom);
    if (!stayToCheckout) {
      stayToCheckout = activeStays.find(s => String(s.roomNumber) === String(stayIdOrRoom));
    }

    if (!stayToCheckout) {
      console.warn(`No active stay found for: ${stayIdOrRoom}`);
      return null;
    }

    // Notify backend SQLite database (fire-and-forget)
    try {
      fetch(`/api/guests/checkout/${stayToCheckout.roomNumber}`, { method: 'POST' }).catch(() => {
        fetch(`http://127.0.0.1:8008/api/guests/checkout/${stayToCheckout.roomNumber}`, { method: 'POST' }).catch(() => {});
      });
    } catch {}

    // Remove this specific stay from active stays
    const updatedActiveStays = activeStays.filter(s => s.id !== stayToCheckout.id);
    localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(updatedActiveStays));

    // Update check-out timestamp in master all-stays log
    const nowIso = new Date().toISOString();
    try {
      const allStays = JSON.parse(localStorage.getItem(ALL_STAYS_STORAGE_KEY)) || [];
      const updatedAllStays = allStays.map(s => {
        if (s.id === stayToCheckout.id || (String(s.roomNumber) === String(stayToCheckout.roomNumber) && s.status === 'CHECKED_IN')) {
          return { ...s, status: 'CHECKED_OUT', checkOutTime: nowIso };
        }
        return s;
      });
      localStorage.setItem(ALL_STAYS_STORAGE_KEY, JSON.stringify(updatedAllStays));
    } catch (e) {}

    // Update room status to CLEANING (_skipStaySync = true!)
    hotelService.updateRoomStatus(stayToCheckout.roomNumber, 'CLEANING', true);

    // Update check-out timestamp in Police log
    hotelService.updatePoliceLogCheckOut(stayToCheckout.roomNumber, stayToCheckout.primaryGuest?.name);

    // Add checkout time to the returned record for receipt
    stayToCheckout.checkOutTime = nowIso;
    stayToCheckout.status = 'CHECKED_OUT';

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
    const activeStays = hotelService.getActiveStays();
    activeStays.forEach(active => {
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
        res = await fetch(`http://127.0.0.1:8008${url}`);
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
        hasDocFront: !!stay.documentFront,
        hasDocBack: !!stay.documentBack,
        hasSignature: !!stay.signature,
        source: 'local',
      });
    });

    backendRecords.forEach(bRec => {
      const key = `DB-${bRec.id}` || bRec.reg_no;
      if (!combinedMap.has(key)) {
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
          hasDocFront: bRec.has_doc_front === 1 || !!bRec.document_front,
          hasDocBack: bRec.has_doc_back === 1 || !!bRec.document_back,
          hasSignature: bRec.has_signature === 1 || !!bRec.signature,
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

  getDatabaseRecords: async (search = '') => {
    try {
      const url = search ? `/api/guests/records?search=${encodeURIComponent(search)}` : '/api/guests/records';
      let res = null;
      try {
        res = await fetch(url);
      } catch {
        res = await fetch(`http://127.0.0.1:8008${url}`);
      }
      if (res && res.ok) {
        const json = await res.json();
        return json.records || [];
      }
    } catch (e) {
      console.warn('Failed to fetch from backend database:', e);
    }
    return [];
  },

  // ══════════════════════════════════════════════════════════════════════════
  // POLICE LOGS
  // ══════════════════════════════════════════════════════════════════════════

  getPoliceLogs: () => {
    try {
      return JSON.parse(localStorage.getItem(POLICE_LOGS_STORAGE_KEY)) || initialHistoricalPoliceLogs;
    } catch (e) {
      return initialHistoricalPoliceLogs;
    }
  },

  addPoliceLogEntry: (stayRecord) => {
    const logs = hotelService.getPoliceLogs();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newLog = {
      id: generateId('LOG'),
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

  updatePoliceLogCheckOut: (roomNumber, guestName) => {
    const logs = hotelService.getPoliceLogs();
    const logIndex = logs.findIndex(l =>
      String(l.roomNumber) === String(roomNumber) &&
      l.guestName === guestName &&
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

    // Synchronize live rooms & occupancy for HTL-101
    const liveRooms = hotelService.getRooms();
    const liveOccupied = liveRooms.filter(r => r.status === 'OCCUPIED').length;
    const liveVacant = liveRooms.filter(r => r.status === 'VACANT').length;
    const liveTotal = liveRooms.length;

    const hotelsWithLiveStats = hotels.map(hotel => {
      if (hotel.id === 'HTL-101') {
        return {
          ...hotel,
          totalRooms: liveTotal,
          occupiedRooms: liveOccupied,
          vacantRooms: liveVacant,
          occupancyRate: liveTotal > 0 ? Math.round((liveOccupied / liveTotal) * 100) : 0,
          isLiveSync: true,
        };
      }
      const total = hotel.totalRooms || 15;
      const occupied = hotel.occupiedRooms !== undefined ? hotel.occupiedRooms : Math.floor(total * 0.6);
      const vacant = Math.max(0, total - occupied);
      return {
        ...hotel,
        totalRooms: total,
        occupiedRooms: occupied,
        vacantRooms: vacant,
        occupancyRate: Math.round((occupied / total) * 100),
        isLiveSync: false,
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
