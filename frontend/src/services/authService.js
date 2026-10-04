// Authentication & Multi-Role System Service

const USERS_STORAGE_KEY = 'staylog_users_v2';
const HOTELS_STORAGE_KEY = 'staylog_hotels_v2';
const POLICE_STORAGE_KEY = 'staylog_police_v2';
const SESSION_STORAGE_KEY = 'staylog_session_v2';

// Pre-seeded Initial Accounts
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

// Initialize Storage & Ensure Demo Credentials Always Exist
const initAuthStorage = () => {
  let storedUsers = [];
  try {
    storedUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
  } catch (e) {
    storedUsers = [];
  }

  // Upsert initial demo users to guarantee working login credentials
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

  if (!savedHotels || savedHotels.length < 5 || !savedHotels[0]?.area) {
    localStorage.setItem(HOTELS_STORAGE_KEY, JSON.stringify(initialHotels));
  } else {
    initialHotels.forEach((seedHotel) => {
      const exists = savedHotels.some((h) => h.id === seedHotel.id || h.email === seedHotel.email);
      if (!exists) {
        savedHotels.push(seedHotel);
      }
    });
    localStorage.setItem(HOTELS_STORAGE_KEY, JSON.stringify(savedHotels));
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

  // Login Handler (Supports Email, Username, or Role shortcuts)
  login: (credential, password) => {
    initAuthStorage();
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || initialUsers;
    const cleanCred = credential.trim().toLowerCase();

    const user = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanCred) ||
        (u.username && u.username.toLowerCase() === cleanCred)
    );

    if (!user) {
      return { success: false, message: 'Invalid credentials. User account not found.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Incorrect password provided.' };
    }

    // If user is a Hotel Manager, check hotel approval status
    if (user.role === 'HOTEL') {
      const hotels = JSON.parse(localStorage.getItem(HOTELS_STORAGE_KEY)) || initialHotels;
      const hotel = hotels.find((h) => h.id === user.hotelId || h.email.toLowerCase() === cleanCred);

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

  // Hotel Self-Registration
  registerHotel: (hotelData) => {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || initialUsers;
    const hotels = JSON.parse(localStorage.getItem(HOTELS_STORAGE_KEY)) || initialHotels;

    const existingUser = users.find((u) => u.email.toLowerCase() === hotelData.email.trim().toLowerCase());
    if (existingUser) {
      return { success: false, message: 'An account with this email address already exists.' };
    }

    const hotelId = `HTL-${Math.floor(100 + Math.random() * 900)}`;
    const userId = `USR-HTL-${Math.floor(1000 + Math.random() * 9000)}`;

    const newHotelRecord = {
      id: hotelId,
      name: hotelData.hotelName,
      ownerName: hotelData.ownerName,
      email: hotelData.email.trim(),
      phone: hotelData.phone,
      address: hotelData.address,
      propertyType: hotelData.propertyType || 'Hostel / Budget Stay',
      subscriptionPlan: hotelData.subscriptionPlan || 'Hostel Standard (₹499/month)',
      subscriptionAmount: hotelData.subscriptionAmount || 499,
      status: 'PENDING',
      regNumber: `REG-${Date.now().toString().slice(-6)}`,
      documents: hotelData.documents || [
        { name: 'Hotel_Trade_License.pdf', size: '1.4 MB', type: 'PDF' },
        { name: 'Owner_Government_ID.pdf', size: '920 KB', type: 'PDF' },
      ],
      registeredAt: new Date().toISOString(),
    };

    const newUserRecord = {
      id: userId,
      email: hotelData.email.trim(),
      password: hotelData.password,
      name: hotelData.hotelName,
      role: 'HOTEL',
      hotelId: hotelId,
    };

    hotels.unshift(newHotelRecord);
    users.push(newUserRecord);

    localStorage.setItem(HOTELS_STORAGE_KEY, JSON.stringify(hotels));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    return {
      success: true,
      message: 'Hotel registration submitted successfully! Awaiting Super Admin document approval.',
      hotel: newHotelRecord,
    };
  },

  // Super Admin: Create Police Station Account
  createPoliceAccount: (policeData) => {
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

  // Super Admin: Hotel Approvals
  approveHotel: (hotelId) => {
    const hotels = JSON.parse(localStorage.getItem(HOTELS_STORAGE_KEY)) || initialHotels;
    const updated = hotels.map((h) =>
      h.id === hotelId ? { ...h, status: 'APPROVED', approvedAt: new Date().toISOString() } : h
    );
    localStorage.setItem(HOTELS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  rejectHotel: (hotelId) => {
    const hotels = JSON.parse(localStorage.getItem(HOTELS_STORAGE_KEY)) || initialHotels;
    const updated = hotels.map((h) =>
      h.id === hotelId ? { ...h, status: 'REJECTED', rejectedAt: new Date().toISOString() } : h
    );
    localStorage.setItem(HOTELS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  // Getters
  getAllHotels: () => {
    try {
      return JSON.parse(localStorage.getItem(HOTELS_STORAGE_KEY)) || initialHotels;
    } catch (e) {
      return initialHotels;
    }
  },

  getAllPoliceAccounts: () => {
    try {
      return JSON.parse(localStorage.getItem(POLICE_STORAGE_KEY)) || initialPoliceAccounts;
    } catch (e) {
      return initialPoliceAccounts;
    }
  },
};
