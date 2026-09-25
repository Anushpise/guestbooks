import { initialRooms, frequentGuestsDatabase, initialActiveStays, initialHistoricalPoliceLogs } from '../mockData';

const ROOMS_STORAGE_KEY = 'staylog_rooms_v1';
const GUESTS_STORAGE_KEY = 'staylog_guests_v1';
const ACTIVE_STAYS_STORAGE_KEY = 'staylog_active_stays_v1';
const POLICE_LOGS_STORAGE_KEY = 'staylog_police_logs_v1';

// Helper to initialize LocalStorage if empty
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
  if (!localStorage.getItem(POLICE_LOGS_STORAGE_KEY)) {
    localStorage.setItem(POLICE_LOGS_STORAGE_KEY, JSON.stringify(initialHistoricalPoliceLogs));
  }
};

initStorage();

export const hotelService = {
  // Rooms API
  getRooms: () => {
    try {
      return JSON.parse(localStorage.getItem(ROOMS_STORAGE_KEY)) || initialRooms;
    } catch (e) {
      return initialRooms;
    }
  },

  updateRoomStatus: (roomId, status) => {
    const rooms = hotelService.getRooms();
    const targetRoom = rooms.find(r => r.id === roomId || r.number === roomId);
    if (!targetRoom) return rooms;

    const previousStatus = targetRoom.status;
    const updatedRooms = rooms.map(r => r.id === roomId || r.number === roomId ? { ...r, status } : r);
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(updatedRooms));

    // Keep active stays synchronized
    const activeStays = hotelService.getActiveStays();
    const roomNo = String(targetRoom.number);

    if (status === 'OCCUPIED' && previousStatus !== 'OCCUPIED') {
      // If marked OCCUPIED, ensure active stay exists
      const existingStay = activeStays.find(s => String(s.roomNumber) === roomNo);
      if (!existingStay) {
        const newStay = {
          id: `STAY-${1000 + activeStays.length + 1}`,
          roomNumber: roomNo,
          checkInTime: new Date().toISOString(),
          expectedCheckOut: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          stayType: '24 Hours Full Stay',
          primaryGuest: {
            name: `Guest in Room ${roomNo}`,
            phone: '9876543210',
            idType: 'Aadhaar Card',
            idNumber: '4000 1234 5678',
            address: 'Allocated Stay',
            city: 'Metro City'
          },
          accompanyingGuest: null,
          comingFrom: 'Direct',
          goingTo: 'Direct',
          purpose: 'Personal Stay',
          vehicleNo: 'N/A',
          roomRate: Number(targetRoom.rate) || 1800,
          advancePaid: Number(targetRoom.rate) || 1800,
          paymentMode: 'Cash',
          policeSubmitted: true,
          policeSubmittedAt: new Date().toISOString(),
        };
        activeStays.unshift(newStay);
        localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(activeStays));
        hotelService.addPoliceLogEntry(newStay);
      }
    } else if (status !== 'OCCUPIED' && previousStatus === 'OCCUPIED') {
      // If moved away from OCCUPIED, remove from active stays
      const updatedStays = activeStays.filter(s => String(s.roomNumber) !== roomNo);
      localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(updatedStays));
      
      const existingStay = activeStays.find(s => String(s.roomNumber) === roomNo);
      if (existingStay) {
        hotelService.updatePoliceLogCheckOut(roomNo, existingStay.primaryGuest?.name);
      }
    }

    // Synchronize HTL-101 in hotels storage for Police Portal live sync
    try {
      const hotels = JSON.parse(localStorage.getItem('staylog_hotels_v2')) || [];
      const occCount = updatedRooms.filter(r => r.status === 'OCCUPIED').length;
      const updatedHotels = hotels.map(h => {
        if (h.id === 'HTL-101') {
          return {
            ...h,
            totalRooms: updatedRooms.length,
            occupiedRooms: occCount,
            vacantRooms: updatedRooms.filter(r => r.status === 'VACANT').length,
            occupancyRate: Math.round((occCount / updatedRooms.length) * 100)
          };
        }
        return h;
      });
      localStorage.setItem('staylog_hotels_v2', JSON.stringify(updatedHotels));
    } catch (e) {}

    return updatedRooms;
  },

  updateRoomTariff: (roomId, newRate) => {
    const rooms = hotelService.getRooms();
    const updated = rooms.map(r => 
      r.id === roomId || r.number === roomId ? { ...r, rate: Number(newRate) || r.rate } : r
    );
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  // Active Stays API
  getActiveStays: () => {
    try {
      return JSON.parse(localStorage.getItem(ACTIVE_STAYS_STORAGE_KEY)) || initialActiveStays;
    } catch (e) {
      return initialActiveStays;
    }
  },

  // Guest Database Lookup for Express Auto-Fill
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

  // Perform Express or New Check-In
  checkInGuest: (stayData) => {
    const activeStays = hotelService.getActiveStays();
    const newStayId = `STAY-${1000 + activeStays.length + 1}`;
    const newStayRecord = {
      id: newStayId,
      roomNumber: stayData.roomNumber,
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
      policeSubmitted: true,
      policeSubmittedAt: new Date().toISOString(),
    };

    activeStays.unshift(newStayRecord);
    localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(activeStays));

    // Mark room as OCCUPIED
    hotelService.updateRoomStatus(stayData.roomNumber, 'OCCUPIED');

    // Update frequent guest ledger database
    hotelService.saveOrUpdateGuestHistory(stayData.primaryGuest, stayData.accompanyingGuest);

    // Add entry to police historical logs
    hotelService.addPoliceLogEntry(newStayRecord);

    return newStayRecord;
  },

  // Check-Out Guest
  checkOutGuest: (stayId) => {
    const activeStays = hotelService.getActiveStays();
    const stayToCheckout = activeStays.find(s => s.id === stayId || s.roomNumber === stayId);

    if (!stayToCheckout) return null;

    const updatedActiveStays = activeStays.filter(s => s.id !== stayId && s.roomNumber !== stayId);
    localStorage.setItem(ACTIVE_STAYS_STORAGE_KEY, JSON.stringify(updatedActiveStays));

    // Update room status to CLEANING
    hotelService.updateRoomStatus(stayToCheckout.roomNumber, 'CLEANING');

    // Update check-out timestamp in Police log
    hotelService.updatePoliceLogCheckOut(stayToCheckout.roomNumber, stayToCheckout.primaryGuest.name);

    return stayToCheckout;
  },

  // Police Historical Logs
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
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      date: dateStr,
      checkInTime: `${dateStr} ${timeStr}`,
      checkOutTime: 'Active Stay',
      roomNumber: stayRecord.roomNumber,
      guestName: stayRecord.primaryGuest.name,
      ageGender: `${stayRecord.primaryGuest.age || 'N/A'} / ${stayRecord.primaryGuest.gender || 'N/A'}`,
      mobile: stayRecord.primaryGuest.phone || 'N/A',
      address: `${stayRecord.primaryGuest.address || ''}, ${stayRecord.primaryGuest.city || ''}`,
      idTypeNo: `${stayRecord.primaryGuest.idType}: ${stayRecord.primaryGuest.idNumber}`,
      accompanying: stayRecord.accompanyingGuest ? 
        `${stayRecord.accompanyingGuest.name} (${stayRecord.accompanyingGuest.age || ''}/${stayRecord.accompanyingGuest.gender ? stayRecord.accompanyingGuest.gender[0] : ''}, ${stayRecord.accompanyingGuest.idType}: ${stayRecord.accompanyingGuest.idNumber})` 
        : 'Single Guest',
      purpose: stayRecord.purpose || 'Personal',
      policeSubmitted: true,
    };

    logs.unshift(newLog);
    localStorage.setItem(POLICE_LOGS_STORAGE_KEY, JSON.stringify(logs));
  },

  updatePoliceLogCheckOut: (roomNumber, guestName) => {
    const logs = hotelService.getPoliceLogs();
    const logIndex = logs.findIndex(l => l.roomNumber === roomNumber && l.guestName === guestName && l.checkOutTime === 'Active Stay');

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

  // ── Area & Multi-Hotel Occupancy APIs ──────────────────────────────────────
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

    // Synchronize live rooms & occupancy for StayLog Hotel (HTL-101)
    const liveRooms = hotelService.getRooms();
    const liveOccupied = liveRooms.filter(r => r.status === 'OCCUPIED').length;
    const liveVacant = liveRooms.filter(r => r.status === 'VACANT').length;
    const liveTotal = liveRooms.length || 15;

    const hotelsWithLiveStats = hotels.map(hotel => {
      if (hotel.id === 'HTL-101') {
        return {
          ...hotel,
          totalRooms: liveTotal,
          occupiedRooms: liveOccupied,
          vacantRooms: liveVacant,
          occupancyRate: Math.round((liveOccupied / liveTotal) * 100),
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

  // ── Police Document Requisition System ─────────────────────────────────────
  getDocumentRequests: () => {
    const DOC_REQUESTS_KEY = 'staylog_police_doc_requests_v1';
    try {
      const stored = localStorage.getItem(DOC_REQUESTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    // Initial pre-seeded requests
    const initialDocRequests = [
      {
        id: 'REQ-DOC-701',
        guestName: 'Rahul Sharma',
        roomNumber: '101',
        idTypeNo: 'Aadhaar: 4532 8910 2241',
        hotelId: 'HTL-101',
        hotelName: 'StayLog Boutique Hotel & Lodge',
        officerName: 'Inspector V. K. Sharma',
        stationName: 'Central City Police Station',
        badgeNo: 'POL-INSP-8891',
        caseRef: 'GD-4021/2026',
        reason: 'Statutory Verification & Identity Dossier Inspection',
        status: 'PENDING',
        requestedAt: new Date(Date.now() - 3600 * 4 * 1000).toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        notes: 'Statutory verification requested for inter-state visitor record.',
        documents: [
          {
            type: 'Aadhaar Card (Primary Guest)',
            holderName: 'Rahul Sharma',
            idNumber: '4532 8910 2241',
            dob: '14/08/1999',
            gender: 'Male',
            address: 'H.No 42, Green Park Extension, New Delhi - 110016',
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
            issuer: 'Unique Identification Authority of India (UIDAI)',
          },
          {
            type: 'Aadhaar Card (Accompanying Partner)',
            holderName: 'Priya Verma',
            idNumber: '7812 9043 1120',
            dob: '22/11/2001',
            gender: 'Female',
            address: 'H.No 18, Block B, Rohini, New Delhi - 110085',
            photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
            issuer: 'Unique Identification Authority of India (UIDAI)',
          }
        ]
      },
      {
        id: 'REQ-DOC-702',
        guestName: 'Vikram Singh',
        roomNumber: '102',
        idTypeNo: 'Aadhaar: 3344 5566 7788',
        hotelId: 'HTL-101',
        hotelName: 'StayLog Boutique Hotel & Lodge',
        officerName: 'Sub-Inspector M. R. Deshmukh',
        stationName: 'Central City Police Station',
        badgeNo: 'POL-SI-4412',
        caseRef: 'FIR-882/2026',
        reason: 'Verification on Vehicle Transit Entry MH-12-PQ-9081',
        status: 'APPROVED',
        requestedAt: new Date(Date.now() - 3600 * 24 * 1000).toISOString(),
        reviewedAt: new Date(Date.now() - 3600 * 20 * 1000).toISOString(),
        reviewedBy: 'Hotel Manager (Authorized)',
        notes: 'Released under official Police FIR requisition order.',
        documents: [
          {
            type: 'Aadhaar Card (Primary Guest)',
            holderName: 'Vikram Singh',
            idNumber: '3344 5566 7788',
            dob: '05/03/1997',
            gender: 'Male',
            address: 'Flat 302, Royal Palms, Koregaon Park, Pune - 411001',
            photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
            issuer: 'Unique Identification Authority of India (UIDAI)',
          },
          {
            type: 'Voter ID Card (Accompanying Partner)',
            holderName: 'Ananya Roy',
            idNumber: 'WB/04/112/9041',
            dob: '18/07/2000',
            gender: 'Female',
            address: 'Salt Lake Sector 5, Kolkata - 700091',
            photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
            issuer: 'Election Commission of India (ECI)',
          }
        ]
      }
    ];

    localStorage.setItem(DOC_REQUESTS_KEY, JSON.stringify(initialDocRequests));
    return initialDocRequests;
  },

  createDocumentRequest: (reqData) => {
    const DOC_REQUESTS_KEY = 'staylog_police_doc_requests_v1';
    const requests = hotelService.getDocumentRequests();
    
    // Check if guest already has an active stay or frequent guest entry for realistic ID mock
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
      id: `REQ-DOC-${Math.floor(100 + Math.random() * 900)}`,
      guestName: reqData.guestName,
      roomNumber: reqData.roomNumber,
      idTypeNo: reqData.idTypeNo,
      hotelId: reqData.hotelId || 'HTL-101',
      hotelName: reqData.hotelName || 'StayLog Boutique Hotel & Lodge',
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

  approveDocumentRequest: (requestId, reviewer = 'StayLog Hotel Manager', notes = '') => {
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
          reviewedBy: 'StayLog Hotel Manager',
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
