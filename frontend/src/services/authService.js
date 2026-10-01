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
    subscriptionPlan: 'Hostel Standard (₹499/month)',
    subscriptionAmount: 499,
    status: 'APPROVED',
    regNumber: 'HTL-MH-2026-9041',
    totalRooms: 15,
    occupiedRooms: 3, // dynamically synced with rooms
    starRating: '3 Star',
    documents: [
      { name: 'Trade_License_2026.pdf', size: '1.2 MB', type: 'PDF' },
      { name: 'FSSAI_Certificate.pdf', size: '850 KB', type: 'PDF' },
      { name: 'Owner_Aadhaar_Scan.jpg', size: '2.1 MB', type: 'IMAGE' },
    ],
    registeredAt: '2026-09-01T10:00:00.000Z',
    approvedAt: '2026-09-01T11:30:00.000Z',
  },
  {
    id: 'HTL-102',
    name: 'Grand Regency Luxury Suites',
    ownerName: 'Raman Singhania',
    email: 'contact@grandregency.com',
    phone: '9822019283',
    area: 'Metro Division Sector 4',
    address: 'Plot 48, Sector 14 Main Road, Metro City',
    propertyType: 'Luxury Hotel',
    subscriptionPlan: 'Enterprise Hotel (₹999/month)',
    subscriptionAmount: 999,
    status: 'APPROVED',
    regNumber: 'HTL-MH-2026-7712',
    totalRooms: 24,
    occupiedRooms: 19,
    starRating: '4 Star',
    documents: [
      { name: 'Fire_Safety_NOC.pdf', size: '2.1 MB', type: 'PDF' },
      { name: 'Police_Clearance_2026.pdf', size: '1.4 MB', type: 'PDF' },
    ],
    registeredAt: '2026-09-05T09:00:00.000Z',
    approvedAt: '2026-09-05T10:30:00.000Z',
  },
  {
    id: 'HTL-103',
    name: 'Royal Residency & Inn',
    ownerName: 'Harish Choudhary',
    email: 'info@royalresidency.com',
    phone: '9765431290',
    area: 'Metro Division Sector 4',
    address: '15 Civil Lines, Sector 14, Metro City',
    propertyType: 'Budget Hotel',
    subscriptionPlan: 'Hostel Standard (₹499/month)',
    subscriptionAmount: 499,
    status: 'APPROVED',
    regNumber: 'HTL-MH-2026-5509',
    totalRooms: 12,
    occupiedRooms: 5,
    starRating: '2 Star',
    documents: [
      { name: 'Trade_License.pdf', size: '1.1 MB', type: 'PDF' },
    ],
    registeredAt: '2026-09-10T14:00:00.000Z',
    approvedAt: '2026-09-10T15:00:00.000Z',
  },
  {
    id: 'HTL-104',
    name: 'City Comfort Inn',
    ownerName: 'Sunil Mehra',
    email: 'stay@citycomfort.in',
    phone: '9811224466',
    area: 'Central Market & Station Road',
    address: '12 Railway Station Road, Metro Central',
    propertyType: 'Transit Hotel',
    subscriptionPlan: 'Hostel Standard (₹499/month)',
    subscriptionAmount: 499,
    status: 'APPROVED',
    regNumber: 'HTL-MH-2026-3391',
    totalRooms: 20,
    occupiedRooms: 16,
    starRating: '3 Star',
    documents: [
      { name: 'License_2026.pdf', size: '1.3 MB', type: 'PDF' },
    ],
    registeredAt: '2026-09-12T11:00:00.000Z',
    approvedAt: '2026-09-12T12:00:00.000Z',
  },
  {
    id: 'HTL-105',
    name: 'Express Transit Lodge',
    ownerName: 'Mahesh Joshi',
    email: 'booking@expresstransit.com',
    phone: '9933445566',
    area: 'Central Market & Station Road',
    address: 'Opp. Junction Platform 1, Station Road',
    propertyType: 'Budget Lodge',
    subscriptionPlan: 'Hostel Standard (₹499/month)',
    subscriptionAmount: 499,
    status: 'APPROVED',
    regNumber: 'HTL-MH-2026-8821',
    totalRooms: 10,
    occupiedRooms: 9,
    starRating: '2 Star',
    documents: [
      { name: 'Hostel_Permit.pdf', size: '950 KB', type: 'PDF' },
    ],
    registeredAt: '2026-09-14T08:30:00.000Z',
    approvedAt: '2026-09-14T09:15:00.000Z',
  },
  {
    id: 'HTL-106',
    name: 'Green Palms Executive Hostel',
    ownerName: 'Sanjay Kapoor',
    email: 'sanjay@greenpalms.com',
    phone: '9988776655',
    area: 'East IT Park Zone',
    address: '45 IT Park Road, Whitefield Tech Park',
    propertyType: 'Executive Hostel / PG',
    subscriptionPlan: 'Enterprise Hotel (₹999/month)',
    subscriptionAmount: 999,
    status: 'APPROVED',
    regNumber: 'HST-KA-2026-4412',
    totalRooms: 30,
    occupiedRooms: 22,
    starRating: '3 Star',
    documents: [
      { name: 'Hostel_Permit_Doc.pdf', size: '1.5 MB', type: 'PDF' },
      { name: 'Identity_Proof.png', size: '1.1 MB', type: 'IMAGE' },
    ],
    registeredAt: '2026-09-15T08:15:00.000Z',
    approvedAt: '2026-09-15T09:30:00.000Z',
  },
  {
    id: 'HTL-107',
    name: 'Blue Horizon Business Stay',
    ownerName: 'Vikramaditya Roy',
    email: 'desk@bluehorizon.com',
    phone: '9845012345',
    area: 'East IT Park Zone',
    address: '88 Cyber City Highway, Tech Corridor',
    propertyType: 'Business Stay',
    subscriptionPlan: 'Enterprise Hotel (₹999/month)',
    subscriptionAmount: 999,
    status: 'APPROVED',
    regNumber: 'HTL-KA-2026-9901',
    totalRooms: 18,
    occupiedRooms: 8,
    starRating: '3 Star',
    documents: [
      { name: 'Permit.pdf', size: '1.2 MB', type: 'PDF' },
    ],
    registeredAt: '2026-09-16T12:00:00.000Z',
    approvedAt: '2026-09-16T13:00:00.000Z',
  },
  {
    id: 'HTL-108',
    name: 'Green Valley Nature Resort',
    ownerName: 'Deepak Deshmukh',
    email: 'deepak@greenvalley.com',
    phone: '9871100223',
    area: 'South Suburban Zone',
    address: 'Khadakwasla Lake Road, South Suburb',
    propertyType: 'Resort & Cottages',
    subscriptionPlan: 'Enterprise Hotel (₹999/month)',
    subscriptionAmount: 999,
    status: 'APPROVED',
    regNumber: 'RES-MH-2026-1144',
    totalRooms: 16,
    occupiedRooms: 6,
    starRating: '4 Star',
    documents: [
      { name: 'Resort_License.pdf', size: '2.5 MB', type: 'PDF' },
    ],
    registeredAt: '2026-09-18T10:00:00.000Z',
    approvedAt: '2026-09-18T11:00:00.000Z',
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

// Initialize Storage
const initAuthStorage = () => {
  if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
  }
  const savedHotels = localStorage.getItem(HOTELS_STORAGE_KEY);
  if (!savedHotels || JSON.parse(savedHotels).length < 5 || !JSON.parse(savedHotels)[0].area) {
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

  // Login Handler (Supports Email, Username, or Role shortcuts)
  login: (credential, password) => {
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
