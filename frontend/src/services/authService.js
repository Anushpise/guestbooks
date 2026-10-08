// Authentication & Multi-Role System Service (Central Multi-Device Shared DB)

const USERS_STORAGE_KEY = 'staylog_users_v2';
const HOTELS_STORAGE_KEY = 'staylog_hotels_v2';
const POLICE_STORAGE_KEY = 'staylog_police_v2';
const SESSION_STORAGE_KEY = 'staylog_session_v2';

// Pre-seeded Initial Accounts (Offline Fallback & Defaults)
const initialUsers = [
  {
    id: 'USR-ADMIN-1',
    email: 'admin@guestbooks.com',
    password: 'admin123',
    name: 'Super System Administrator',
    role: 'ADMIN',
  },
  {
    id: 'USR-POLICE-1',
    email: 'police@station.gov.in',
    username: 'police',
    password: 'police123',
    name: 'Inspector V. K. Sharma',
    stationName: 'Central City Police Station',
    jurisdiction: 'Metro Division 4',
    role: 'POLICE',
  },
  {
    id: 'USR-HOTEL-1',
    email: 'hotel@guestbooks.com',
    password: 'hotel123',
    name: 'Guestbooks Hotel Management & Lodge',
    role: 'HOTEL',
    hotelId: 'HTL-101',
  },
];

const initialHotels = [
  {
    id: 'HTL-101',
    name: 'Guestbooks Hotel Management & Lodge',
    hotelName: 'Guestbooks Hotel Management & Lodge',
    ownerName: 'NexOpps Hospitality',
    email: 'hotel@guestbooks.com',
    phone: '9876543210',
    area: 'Metro Division Sector 4',
    address: '102 MG Road, Sector 14, Metro City',
    propertyType: 'Boutique Hotel & Lodge',
    subscriptionPlan: 'Guestbooks Standard Plan (₹499/month)',
    subscriptionAmount: 499,
    status: 'APPROVED',
    regNumber: 'HTL-MH-2026-9041',
    totalRooms: 15,
    occupiedRooms: 0,
    starRating: '3 Star',
    documents: [
      { name: 'Trade_License_2026.pdf', size: '1.2 MB', type: 'PDF' },
      { name: 'Owner_Aadhaar_Scan.pdf', size: '850 KB', type: 'PDF' },
    ],
    registeredAt: '2026-09-01T10:00:00.000Z',
    approvedAt: '2026-09-01T11:30:00.000Z',
    guestCount: 0,
  },
];

const initialPoliceAccounts = [
  {
    id: 'POL-101',
    userId: 'USR-POLICE-1',
    stationName: 'Central City Police Station',
    officerName: 'Inspector V. K. Sharma',
    badgeNo: 'POL-INSP-8891',
    email: 'police@station.gov.in',
    username: 'police',
    jurisdiction: 'Metro Division 4',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
];

// Helper to make API calls to the central backend (with multi-PC IP fallback)
const apiFetch = async (path, options = {}) => {
  try {
    const res = await fetch(path, options);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // If relative proxy failed and hostname is defined, try direct port 8008 on the host machine
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      try {
        const directUrl = `http://${window.location.hostname}:8008${path}`;
        const directRes = await fetch(directUrl, options);
        if (directRes.ok) {
          return await directRes.json();
        }
      } catch (fallbackErr) {
        // Quiet fail, fallback gracefully
      }
    }
  }
  return null;
};

// Initialize Storage & Ensure Demo Credentials Always Exist
const initAuthStorage = () => {
  let storedUsers = [];
  try {
    storedUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
  } catch (e) {
    storedUsers = [];
  }

  initialUsers.forEach((seedUser) => {
    const idx = storedUsers.findIndex(
      (u) =>
        (u.email && u.email.toLowerCase() === seedUser.email.toLowerCase()) ||
        (u.username && seedUser.username && u.username.toLowerCase() === seedUser.username.toLowerCase())
    );
    if (idx !== -1) {
      storedUsers[idx] = { ...storedUsers[idx], ...seedUser };
    } else {
      storedUsers.push(seedUser);
    }
  });

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(storedUsers));

  let savedHotels = [];
  try {
    savedHotels = JSON.parse(localStorage.getItem(HOTELS_STORAGE_KEY)) || [];
  } catch (e) {
    savedHotels = [];
  }

  if (!savedHotels || savedHotels.length === 0) {
    localStorage.setItem(HOTELS_STORAGE_KEY, JSON.stringify(initialHotels));
  }

  if (!localStorage.getItem(POLICE_STORAGE_KEY)) {
    localStorage.setItem(POLICE_STORAGE_KEY, JSON.stringify(initialPoliceAccounts));
  }
};

initAuthStorage();

export const authService = {
  // Current Session Management
  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)) || null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser: (user) => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },

  // Asynchronously fetch fresh list of all hotels from central backend DB
  fetchHotels: async () => {
    const data = await apiFetch('/api/auth/hotels');
    if (data && data.hotels) {
      localStorage.setItem(HOTELS_STORAGE_KEY, JSON.stringify(data.hotels));
      try {
        window.dispatchEvent(new CustomEvent('guestbooks_hotel_registered', { detail: data.hotels }));
      } catch (e) {}
      return data.hotels;
    }
    return authService.getAllHotels();
  },

  // Synchronously returns cached hotels (instant render)
  getAllHotels: () => {
    try {
      const list = JSON.parse(localStorage.getItem(HOTELS_STORAGE_KEY));
      if (Array.isArray(list) && list.length > 0) return list;
      return initialHotels;
    } catch (e) {
      return initialHotels;
    }
  },

  // Asynchronously fetch fresh list of all police accounts
  fetchPoliceAccounts: async () => {
    const data = await apiFetch('/api/auth/police');
    if (data && data.policeAccounts) {
      localStorage.setItem(POLICE_STORAGE_KEY, JSON.stringify(data.policeAccounts));
      return data.policeAccounts;
    }
    return authService.getAllPoliceAccounts();
  },

  getAllPoliceAccounts: () => {
    try {
      return JSON.parse(localStorage.getItem(POLICE_STORAGE_KEY)) || initialPoliceAccounts;
    } catch (e) {
      return initialPoliceAccounts;
    }
  },

  // Central Login Handler (Checks SQLite Backend First, falls back locally if offline)
  login: async (credential, password) => {
    const cleanCred = (credential || '').trim();

    // 1. Try central backend authentication
    const backendRes = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: cleanCred, password })
    });

    if (backendRes) {
      if (backendRes.success && backendRes.user) {
        authService.setCurrentUser(backendRes.user);
        // Also refresh hotels in background
        authService.fetchHotels();
        return { success: true, user: backendRes.user };
      }
      return { success: false, message: backendRes.message || 'Login failed.' };
    }

    // 2. Offline Fallback to LocalStorage
    initAuthStorage();
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || initialUsers;
    const cleanLower = cleanCred.toLowerCase();

    const user = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanLower) ||
        (u.username && u.username.toLowerCase() === cleanLower)
    );

    if (!user) {
      return { success: false, message: 'Invalid credentials. User account not found.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Incorrect password provided.' };
    }

    if (user.role === 'HOTEL') {
      const hotels = JSON.parse(localStorage.getItem(HOTELS_STORAGE_KEY)) || initialHotels;
      const hotel = hotels.find((h) => h.id === user.hotelId || (h.email && h.email.toLowerCase() === cleanLower));

      if (hotel && hotel.status === 'PENDING') {
        return {
          success: false,
          message: 'Your Hotel Registration is currently PENDING Super Admin approval & document verification.',
        };
      }

      if (hotel && hotel.status === 'REJECTED') {
        return {
          success: false,
          message: 'Your Hotel Registration was rejected by Admin. Please contact support.',
        };
      }
    }

    authService.setCurrentUser(user);
    return { success: true, user };
  },

  // Hotel Self-Registration (Saves directly to Central DB so all PCs see it immediately)
  registerHotel: async (hotelData) => {
    // 1. Submit to central backend DB
    const backendRes = await apiFetch('/api/auth/register-hotel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hotelData)
    });

    if (backendRes && backendRes.success && backendRes.hotel) {
      // Upsert into local storage for immediate UI sync
      const hotels = authService.getAllHotels();
      const filtered = hotels.filter(h => h.id !== backendRes.hotel.id);
      filtered.unshift(backendRes.hotel);
      localStorage.setItem(HOTELS_STORAGE_KEY, JSON.stringify(filtered));

      try {
        window.dispatchEvent(new CustomEvent('guestbooks_hotel_registered', { detail: backendRes.hotel }));
      } catch (e) {}

      return {
        success: true,
        message: backendRes.message || 'Hotel registration submitted successfully! Awaiting Super Admin approval.',
        hotel: backendRes.hotel
      };
    }

    if (backendRes && !backendRes.success) {
      return { success: false, message: backendRes.message || 'Hotel registration rejected.' };
    }

    // 2. Offline Fallback
    initAuthStorage();
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || initialUsers;
    const hotels = JSON.parse(localStorage.getItem(HOTELS_STORAGE_KEY)) || initialHotels;

    const cleanEmail = hotelData.email.trim().toLowerCase();
    const existingUser = users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return { success: false, message: 'An account with this email address already exists.' };
    }

    const hotelId = `HTL-${Math.floor(1000 + Math.random() * 9000)}`;
    const userId = `USR-HTL-${Math.floor(1000 + Math.random() * 9000)}`;

    const newHotelRecord = {
      id: hotelId,
      name: hotelData.hotelName,
      hotelName: hotelData.hotelName,
      ownerName: hotelData.ownerName,
      email: cleanEmail,
      phone: hotelData.phone,
      address: hotelData.address || 'Address provided during registration',
      area: hotelData.area || 'Metro Division Sector 4',
      propertyType: hotelData.propertyType || 'Hotel / Lodge Stay',
      subscriptionPlan: hotelData.subscriptionPlan || 'Guestbooks Standard Plan (₹499/month)',
      subscriptionAmount: hotelData.subscriptionAmount || 499,
      status: 'PENDING',
      regNumber: `REG-${Date.now().toString().slice(-6)}`,
      totalRooms: Number(hotelData.totalRooms) || 15,
      occupiedRooms: 0,
      documents: hotelData.documents && hotelData.documents.length > 0 ? hotelData.documents : [
        { name: `${hotelData.hotelName.replace(/\s+/g, '_')}_Trade_License.pdf`, size: '1.4 MB', type: 'PDF' },
        { name: 'Owner_Aadhaar_Verification.pdf', size: '920 KB', type: 'PDF' },
      ],
      registeredAt: new Date().toISOString(),
      guestCount: 0,
    };

    const newUserRecord = {
      id: userId,
      email: cleanEmail,
      password: hotelData.password,
      name: hotelData.hotelName,
      role: 'HOTEL',
      hotelId: hotelId,
    };

    hotels.unshift(newHotelRecord);
    users.push(newUserRecord);

    localStorage.setItem(HOTELS_STORAGE_KEY, JSON.stringify(hotels));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    try {
      window.dispatchEvent(new CustomEvent('guestbooks_hotel_registered', { detail: newHotelRecord }));
    } catch (e) {}

    return {
      success: true,
      message: 'Hotel registration submitted successfully! Awaiting Super Admin document approval.',
      hotel: newHotelRecord,
    };
  },

  // Super Admin: Create Police Station Account
  createPoliceAccount: async (policeData) => {
    // 1. Try central backend DB
    const backendRes = await apiFetch('/api/auth/police', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policeData)
    });

    if (backendRes && backendRes.success && backendRes.policeAccount) {
      const list = authService.getAllPoliceAccounts();
      list.unshift(backendRes.policeAccount);
      localStorage.setItem(POLICE_STORAGE_KEY, JSON.stringify(list));
      return { success: true, policeAccount: backendRes.policeAccount };
    }

    if (backendRes && !backendRes.success) {
      return { success: false, message: backendRes.message || 'Police account creation failed.' };
    }

    // 2. Offline Fallback
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || initialUsers;
    const policeList = JSON.parse(localStorage.getItem(POLICE_STORAGE_KEY)) || initialPoliceAccounts;

    const existingUser = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === policeData.email.trim().toLowerCase()) ||
        (u.username && u.username.toLowerCase() === policeData.username.trim().toLowerCase())
    );

    if (existingUser) {
      return { success: false, message: 'Police username or email already exists.' };
    }

    const userId = `USR-POL-${Math.floor(100 + Math.random() * 900)}`;
    const policeId = `POL-${Math.floor(100 + Math.random() * 900)}`;

    const newPoliceAccount = {
      id: policeId,
      userId: userId,
      stationName: policeData.stationName,
      officerName: policeData.officerName,
      badgeNo: policeData.badgeNo || `POL-${Math.floor(1000 + Math.random() * 9000)}`,
      email: policeData.email.trim(),
      username: policeData.username.trim(),
      jurisdiction: policeData.jurisdiction || 'City Jurisdiction Zone',
      createdAt: new Date().toISOString(),
    };

    const newUserRecord = {
      id: userId,
      email: policeData.email.trim(),
      username: policeData.username.trim(),
      password: policeData.password,
      name: policeData.officerName,
      stationName: policeData.stationName,
      jurisdiction: policeData.jurisdiction,
      role: 'POLICE',
    };

    policeList.unshift(newPoliceAccount);
    users.push(newUserRecord);

    localStorage.setItem(POLICE_STORAGE_KEY, JSON.stringify(policeList));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    return { success: true, policeAccount: newPoliceAccount };
  },

  // Super Admin: Hotel Approvals (Central DB)
  approveHotel: async (hotelId) => {
    // 1. Update central backend DB
    await apiFetch('/api/auth/hotel-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelId, status: 'APPROVED' })
    });

    // 2. Update local storage for immediate UI reflect
    const hotels = authService.getAllHotels();
    const updated = hotels.map((h) =>
      h.id === hotelId ? { ...h, status: 'APPROVED', approvedAt: new Date().toISOString() } : h
    );
    localStorage.setItem(HOTELS_STORAGE_KEY, JSON.stringify(updated));

    try {
      window.dispatchEvent(new CustomEvent('guestbooks_hotel_status_changed', { detail: { hotelId, status: 'APPROVED' } }));
    } catch (e) {}

    // 3. Background fetch fresh list
    authService.fetchHotels();
    return updated;
  },

  rejectHotel: async (hotelId) => {
    // 1. Update central backend DB
    await apiFetch('/api/auth/hotel-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelId, status: 'REJECTED' })
    });

    // 2. Update local storage
    const hotels = authService.getAllHotels();
    const updated = hotels.map((h) =>
      h.id === hotelId ? { ...h, status: 'REJECTED', rejectedAt: new Date().toISOString() } : h
    );
    localStorage.setItem(HOTELS_STORAGE_KEY, JSON.stringify(updated));

    try {
      window.dispatchEvent(new CustomEvent('guestbooks_hotel_status_changed', { detail: { hotelId, status: 'REJECTED' } }));
    } catch (e) {}

    authService.fetchHotels();
    return updated;
  },
};

// Automatic background initial sync with server
if (typeof window !== 'undefined') {
  authService.fetchHotels();
  authService.fetchPoliceAccounts();
}
