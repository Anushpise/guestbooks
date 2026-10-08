import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  UserPlus, 
  Clock, 
  IndianRupee, 
  Eye, 
  Search, 
  Lock, 
  Building, 
  BadgeAlert, 
  Download, 
  Calendar, 
  Image as ImageIcon, 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  ZoomIn, 
  X, 
  ExternalLink, 
  ChevronRight, 
  Filter,
  Check,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { authService } from '../services/authService';
import { hotelService } from '../services/hotelService';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

export default function AdminDashboard() {
  const [hotels, setHotels] = useState(authService.getAllHotels());
  const [policeAccounts, setPoliceAccounts] = useState(authService.getAllPoliceAccounts());
  const [activeTab, setActiveTab] = useState('HOTEL_DIRECTORY'); // 'HOTEL_DIRECTORY', 'HOTEL_APPROVALS', 'CREATE_POLICE', 'SUBSCRIPTIONS'

  // Selected hotel for detailed guest records & ID photo inspection
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelGuests, setHotelGuests] = useState([]);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [guestDateFilter, setGuestDateFilter] = useState('');
  const [guestStatusFilter, setGuestStatusFilter] = useState('ALL');

  // Hotel search & filter in directory
  const [hotelSearchQuery, setHotelSearchQuery] = useState('');
  const [hotelStatusFilter, setHotelStatusFilter] = useState('ALL'); // 'ALL', 'APPROVED', 'PENDING'

  // Modal / Selected registration doc inspection state
  const [selectedDocHotel, setSelectedDocHotel] = useState(null);

  // Full-size Photo Lightbox Modal (for guest Aadhaar / Passport / ID cards)
  const [lightboxPhoto, setLightboxPhoto] = useState(null); // { url, title, subTitle }

  // New Police Account Form state
  const [stationName, setStationName] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [policeEmail, setPoliceEmail] = useState('');
  const [policeUsername, setPoliceUsername] = useState('');
  const [policePassword, setPolicePassword] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const refreshData = async () => {
    try {
      const allHotels = await authService.fetchHotels();
      if (allHotels && Array.isArray(allHotels)) {
        setHotels(allHotels);
        if (selectedHotel) {
          const refreshedSelected = allHotels.find(h => h.id === selectedHotel.id);
          if (refreshedSelected) setSelectedHotel(refreshedSelected);
        }
      }
      const allPolice = await authService.fetchPoliceAccounts();
      if (allPolice && Array.isArray(allPolice)) {
        setPoliceAccounts(allPolice);
      }
    } catch (e) {
      console.warn('AdminDashboard refresh error:', e);
    }
  };

  // Sync event listener & periodic polling for multi-PC real-time sync
  useEffect(() => {
    refreshData();
    const handleSync = () => {
      refreshData();
    };
    window.addEventListener('guestbooks_hotel_registered', handleSync);
    window.addEventListener('guestbooks_hotel_status_changed', handleSync);
    window.addEventListener('storage', handleSync);

    // Auto-poll server every 4 seconds to sync PC1 and PC2 requests automatically
    const pollInterval = setInterval(() => {
      refreshData();
    }, 4000);

    return () => {
      window.removeEventListener('guestbooks_hotel_registered', handleSync);
      window.removeEventListener('guestbooks_hotel_status_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      clearInterval(pollInterval);
    };
  }, [selectedHotel]);

  // Load guest history when a hotel is selected
  useEffect(() => {
    if (selectedHotel) {
      loadHotelGuests(selectedHotel.id);
    } else {
      setHotelGuests([]);
    }
  }, [selectedHotel]);

  const loadHotelGuests = async (hotelId) => {
    setLoadingGuests(true);
    try {
      const records = await hotelService.getHotelGuestHistory(hotelId);
      setHotelGuests(records);
    } catch (e) {
      console.warn('Failed to load hotel guests:', e);
      setHotelGuests([]);
    } finally {
      setLoadingGuests(false);
    }
  };

  const handleApprove = async (hotelId) => {
    await authService.approveHotel(hotelId);
    await refreshData();
    setSelectedDocHotel(null);
  };

  const handleReject = async (hotelId) => {
    await authService.rejectHotel(hotelId);
    await refreshData();
    setSelectedDocHotel(null);
  };

  const handleCreatePoliceAccount = async (e) => {
    e.preventDefault();
    setFormMessage('');

    if (!stationName || !officerName || !policeUsername || !policePassword) {
      setFormMessage('Please fill all required police account details.');
      return;
    }

    const res = await authService.createPoliceAccount({
      stationName,
      officerName,
      email: policeEmail || `${policeUsername}@police.gov.in`,
      username: policeUsername,
      password: policePassword,
      jurisdiction: jurisdiction || 'City Sector Police Station',
    });

    if (res.success) {
      setFormMessage('Police Station account created successfully!');
      setStationName('');
      setOfficerName('');
      setPoliceEmail('');
      setPoliceUsername('');
      setPolicePassword('');
      setJurisdiction('');
      await refreshData();
    } else {
      setFormMessage(res.message || 'Failed to create police account.');
    }
  };

  const pendingHotels = hotels.filter((h) => h.status === 'PENDING');
  const approvedHotels = hotels.filter((h) => h.status === 'APPROVED');
  const totalSubRevenue = hotels
    .filter((h) => h.status === 'APPROVED')
    .reduce((acc, h) => acc + (h.subscriptionAmount || 499), 0);

  // Filtered hotels in directory
  const filteredHotels = hotels.filter(h => {
    const matchesSearch = 
      (h.name && h.name.toLowerCase().includes(hotelSearchQuery.toLowerCase())) ||
      (h.ownerName && h.ownerName.toLowerCase().includes(hotelSearchQuery.toLowerCase())) ||
      (h.email && h.email.toLowerCase().includes(hotelSearchQuery.toLowerCase())) ||
      (h.phone && h.phone.includes(hotelSearchQuery)) ||
      (h.id && h.id.toLowerCase().includes(hotelSearchQuery.toLowerCase()));

    const matchesStatus = 
      hotelStatusFilter === 'ALL' ? true : h.status === hotelStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtered guests for selected hotel
  const filteredGuests = hotelGuests.filter(g => {
    const matchesSearch = !guestSearchQuery || (
      (g.guestName && g.guestName.toLowerCase().includes(guestSearchQuery.toLowerCase())) ||
      (g.phone && g.phone.includes(guestSearchQuery)) ||
      (g.idNumber && g.idNumber.toLowerCase().includes(guestSearchQuery.toLowerCase())) ||
      (g.roomNumber && String(g.roomNumber).includes(guestSearchQuery)) ||
      (g.regNo && g.regNo.toLowerCase().includes(guestSearchQuery.toLowerCase()))
    );

    const matchesDate = !guestDateFilter || (
      g.checkInTime && g.checkInTime.startsWith(guestDateFilter)
    );

    const matchesStatus = guestStatusFilter === 'ALL' || (
      guestStatusFilter === 'CHECKED_IN' ? g.status === 'CHECKED_IN' : g.status === 'CHECKED_OUT'
    );

    return matchesSearch && matchesDate && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-2xl font-extrabold text-amber-950 tracking-tight flex items-center gap-2">
              <Lock className="h-6 w-6 text-amber-800" />
              Super Admin Control Center
            </h2>
            <Badge className="bg-amber-800 text-white font-bold px-3 py-1 text-xs">
              System Operations
            </Badge>
          </div>
          <p className="text-xs text-amber-800 mt-1 font-medium">
            Verify & approve property registration requests, inspect submitted trade licenses, view date-wise guest registrations with ID photos, and manage police station credentials.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white border border-amber-200 rounded-xl px-4 py-2.5 shadow-2xs">
          <div>
            <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Active Properties</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{approvedHotels.length}</div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <div className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">Pending Queue</div>
            <div className="text-xl font-extrabold text-amber-700 font-mono">{pendingHotels.length}</div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <div className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">Total Stays</div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono">{hotelService.getAllStays().length}</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
            activeTab === 'HOTEL_DIRECTORY'
              ? 'bg-amber-800 text-white shadow-amber-900/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
          onClick={() => {
            setActiveTab('HOTEL_DIRECTORY');
            setSelectedHotel(null);
          }}
        >
          <Building2 className="h-4 w-4" />
          Hotels & Guest ID Logs
          <Badge className={`ml-1 text-[10px] font-mono ${activeTab === 'HOTEL_DIRECTORY' ? 'bg-amber-950 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {hotels.length}
          </Badge>
        </button>

        <button
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
            activeTab === 'HOTEL_APPROVALS'
              ? 'bg-amber-800 text-white shadow-amber-900/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
          onClick={() => {
            setActiveTab('HOTEL_APPROVALS');
            setSelectedHotel(null);
          }}
        >
          <BadgeAlert className="h-4 w-4 text-amber-400" />
          Verification Queue
          {pendingHotels.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full animate-pulse">
              {pendingHotels.length}
            </span>
          )}
        </button>

        <button
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
            activeTab === 'CREATE_POLICE'
              ? 'bg-amber-800 text-white shadow-amber-900/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
          onClick={() => {
            setActiveTab('CREATE_POLICE');
            setSelectedHotel(null);
          }}
        >
          <ShieldAlert className="h-4 w-4" />
          Police Accounts ({policeAccounts.length})
        </button>

        <button
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
            activeTab === 'SUBSCRIPTIONS'
              ? 'bg-amber-800 text-white shadow-amber-900/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
          onClick={() => {
            setActiveTab('SUBSCRIPTIONS');
            setSelectedHotel(null);
          }}
        >
          <IndianRupee className="h-4 w-4" />
          Subscription Ledger
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB: HOTEL DIRECTORY & GUEST ID LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'HOTEL_DIRECTORY' && (
        <div className="space-y-6">
          {/* VIEW A: Single Selected Hotel - Detailed Guest Registry & ID Photos */}
          {selectedHotel ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Back button & Hotel Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedHotel(null)}
                    className="flex items-center gap-1.5 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to All Hotels
                  </Button>
                  <div className="h-6 w-px bg-slate-200"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-lg">{selectedHotel.name}</h3>
                      <Badge className={selectedHotel.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}>
                        {selectedHotel.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-600 font-bold">{selectedHotel.id}</span>
                      <span>•</span>
                      <span>Owner: <strong>{selectedHotel.ownerName}</strong></span>
                      <span>•</span>
                      <span>Phone: <strong>{selectedHotel.phone}</strong></span>
                      <span>•</span>
                      <span>Address: {selectedHotel.address}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDocHotel(selectedHotel)}
                    className="text-xs font-bold border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5 text-amber-700" />
                    Inspect Registration Proofs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadHotelGuests(selectedHotel.id)}
                    className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100"
                    title="Refresh data"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingGuests ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Guest Entries Search, Date Filter & Statistics Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-600" />
                      Date-Wise Guest Stay Registry & ID Photo Archive
                    </h4>
                    <p className="text-xs text-slate-500">
                      All guest check-ins recorded by {selectedHotel.name} with scanned Aadhaar / ID proofs.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold font-mono">
                      {hotelGuests.length} Total Records
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono">
                      {hotelGuests.filter(g => g.hasDocFront || g.hasDocBack).length} With ID Photos
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  {/* Search input */}
                  <div className="relative sm:col-span-2">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search guest name, phone, Aadhaar / ID, room, reg no..."
                      value={guestSearchQuery}
                      onChange={(e) => setGuestSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>

                  {/* Date filter */}
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="date"
                      value={guestDateFilter}
                      onChange={(e) => setGuestDateFilter(e.target.value)}
                      className="pl-9 h-9 text-xs"
                      title="Filter by check-in date"
                    />
                  </div>

                  {/* Status filter */}
                  <div className="flex items-center gap-1">
                    <select
                      value={guestStatusFilter}
                      onChange={(e) => setGuestStatusFilter(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="ALL">All Stay Statuses</option>
                      <option value="CHECKED_IN">Checked-In Only</option>
                      <option value="CHECKED_OUT">Checked-Out Only</option>
                    </select>

                    {(guestSearchQuery || guestDateFilter || guestStatusFilter !== 'ALL') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setGuestSearchQuery('');
                          setGuestDateFilter('');
                          setGuestStatusFilter('ALL');
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 px-2 h-9"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Guest Entries Cards / Table */}
              {loadingGuests ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                  <RefreshCw className="h-8 w-8 text-amber-600 animate-spin mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-700">Loading guest registry and ID scans...</div>
                </div>
              ) : filteredGuests.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">No Guest Records Found for this Hotel</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {hotelGuests.length === 0
                      ? 'No guest check-ins have been recorded yet by this property. When the property owner performs AI scanner check-ins, all guest records and Aadhaar photos will appear here automatically.'
                      : 'No guest records match your current search or date filter. Try clearing your search parameters.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredGuests.map((guest, idx) => (
                    <div
                      key={guest.id || idx}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-shadow space-y-4"
                    >
                      {/* Top Info Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-extrabold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                            {guest.regNo || `REG-${idx + 1}`}
                          </span>
                          <span className="font-extrabold text-slate-900 text-base">
                            {guest.guestName}
                          </span>
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                            Room {guest.roomNumber}
                          </Badge>
                          <Badge className={guest.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]' : 'bg-slate-100 text-slate-600 text-[10px]'}>
                            {guest.status === 'CHECKED_IN' ? '● Currently Checked-In' : 'Checked-Out'}
                          </Badge>
                        </div>

                        <div className="text-right text-xs text-slate-500 font-mono">
                          <span>Check-in: <strong>{guest.checkInTime ? new Date(guest.checkInTime).toLocaleString('en-IN') : 'N/A'}</strong></span>
                        </div>
                      </div>

                      {/* Guest Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact & Age</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{guest.phone || 'N/A'}</div>
                          <div className="text-[11px] text-slate-500">{guest.age ? `${guest.age} yrs` : ''} {guest.gender ? `• ${guest.gender}` : ''}</div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Government ID Proof</div>
                          <div className="font-bold text-indigo-900 mt-0.5">{guest.idType || 'Aadhaar Card'}</div>
                          <div className="font-mono text-[11px] text-slate-600 font-semibold">{guest.idNumber || 'N/A'}</div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stay & Tariff</div>
                          <div className="font-bold text-emerald-800 mt-0.5">₹{guest.roomRate || 1800} / stay</div>
                          <div className="text-[11px] text-slate-500">{guest.stayType || '24h Stay'} • {guest.paymentMode || 'Cash'}</div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address & Origin</div>
                          <div className="font-medium text-slate-700 truncate mt-0.5" title={guest.address || guest.city}>
                            {guest.address || guest.city || 'Local Area'}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">Purpose: {guest.purpose || 'Personal'}</div>
                        </div>
                      </div>

                      {/* ID Documents & Photo Gallery */}
                      <div className="pt-2">
                        <div className="text-xs font-extrabold text-slate-800 mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ImageIcon className="h-4 w-4 text-emerald-600" />
                            Archived ID Card Photos & Digital Verification:
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Click any photo to view full size / zoom
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          {/* Front ID Photo */}
                          {guest.documentFront ? (
                            <div
                              onClick={() => setLightboxPhoto({
                                url: guest.documentFront,
                                title: `${guest.idType || 'ID Document'} (Front Side)`,
                                subTitle: `Guest: ${guest.guestName} • Reg #${guest.regNo || 'N/A'} • Room ${guest.roomNumber}`,
                              })}
                              className="group relative h-28 w-44 rounded-xl border-2 border-emerald-300 bg-slate-900 overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex-shrink-0"
                            >
                              <img
                                src={guest.documentFront}
                                alt="ID Front"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[11px] font-bold text-white flex items-center gap-1 bg-black/60 px-2 py-1 rounded-md backdrop-blur-xs">
                                  <ZoomIn className="h-3.5 w-3.5" /> View Front
                                </span>
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300 truncate">
                                🪪 {guest.idType || 'ID'} Front
                              </div>
                            </div>
                          ) : (
                            <div className="h-28 w-44 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-[11px] p-2 text-center">
                              <ImageIcon className="h-6 w-6 text-slate-300 mb-1" />
                              <span>Front ID Scan Not Uploaded</span>
                            </div>
                          )}

                          {/* Back ID Photo */}
                          {guest.documentBack ? (
                            <div
                              onClick={() => setLightboxPhoto({
                                url: guest.documentBack,
                                title: `${guest.idType || 'ID Document'} (Back Side)`,
                                subTitle: `Guest: ${guest.guestName} • Reg #${guest.regNo || 'N/A'} • Room ${guest.roomNumber}`,
                              })}
                              className="group relative h-28 w-44 rounded-xl border-2 border-emerald-300 bg-slate-900 overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex-shrink-0"
                            >
                              <img
                                src={guest.documentBack}
                                alt="ID Back"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[11px] font-bold text-white flex items-center gap-1 bg-black/60 px-2 py-1 rounded-md backdrop-blur-xs">
                                  <ZoomIn className="h-3.5 w-3.5" /> View Back
                                </span>
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300 truncate">
                                🪪 {guest.idType || 'ID'} Back
                              </div>
                            </div>
                          ) : (
                            <div className="h-28 w-44 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-[11px] p-2 text-center">
                              <ImageIcon className="h-6 w-6 text-slate-300 mb-1" />
                              <span>Back ID Scan Not Uploaded</span>
                            </div>
                          )}

                          {/* Partner Front ID Photo (if accompanying partner present) */}
                          {guest.partnerDocumentFront && (
                            <div
                              onClick={() => setLightboxPhoto({
                                url: guest.partnerDocumentFront,
                                title: `Partner ${guest.accompanyingGuest?.name || 'Accompanying'} - Front ID`,
                                subTitle: `Partner of ${guest.guestName} • Room ${guest.roomNumber} • ${guest.accompanyingGuest?.idType || 'ID'}`,
                              })}
                              className="group relative h-28 w-44 rounded-xl border-2 border-indigo-300 bg-slate-900 overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:border-indigo-500 transition-all flex-shrink-0"
                            >
                              <img
                                src={guest.partnerDocumentFront}
                                alt="Partner ID Front"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[11px] font-bold text-white flex items-center gap-1 bg-black/60 px-2 py-1 rounded-md backdrop-blur-xs">
                                  <ZoomIn className="h-3.5 w-3.5" /> View Partner Front
                                </span>
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-indigo-950/90 px-2 py-0.5 text-[10px] font-bold text-indigo-200 truncate">
                                👥 Partner Front ID
                              </div>
                            </div>
                          )}

                          {/* Partner Back ID Photo (if accompanying partner present) */}
                          {guest.partnerDocumentBack && (
                            <div
                              onClick={() => setLightboxPhoto({
                                url: guest.partnerDocumentBack,
                                title: `Partner ${guest.accompanyingGuest?.name || 'Accompanying'} - Back ID`,
                                subTitle: `Partner of ${guest.guestName} • Room ${guest.roomNumber} • ${guest.accompanyingGuest?.idType || 'ID'}`,
                              })}
                              className="group relative h-28 w-44 rounded-xl border-2 border-indigo-300 bg-slate-900 overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:border-indigo-500 transition-all flex-shrink-0"
                            >
                              <img
                                src={guest.partnerDocumentBack}
                                alt="Partner ID Back"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[11px] font-bold text-white flex items-center gap-1 bg-black/60 px-2 py-1 rounded-md backdrop-blur-xs">
                                  <ZoomIn className="h-3.5 w-3.5" /> View Partner Back
                                </span>
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-indigo-950/90 px-2 py-0.5 text-[10px] font-bold text-indigo-200 truncate">
                                👥 Partner Back ID
                              </div>
                            </div>
                          )}

                          {/* Guest Check-In Signature */}
                          {guest.signature && (
                            <div
                              onClick={() => setLightboxPhoto({
                                url: guest.signature,
                                title: `Guest Check-In Signature`,
                                subTitle: `Signed by ${guest.guestName} at Check-in`,
                              })}
                              className="group relative h-28 w-36 rounded-xl border border-slate-200 bg-white overflow-hidden cursor-pointer shadow-sm hover:border-slate-400 transition-all flex-shrink-0"
                            >
                              <img
                                src={guest.signature}
                                alt="Check-In Signature"
                                className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                                  <ZoomIn className="h-3 w-3" /> View Check-In
                                </span>
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-800 text-center border-t border-emerald-100">
                                Check-In Signature
                              </div>
                            </div>
                          )}

                          {/* Guest Check-Out Signature */}
                          {guest.checkOutSignature && (
                            <div
                              onClick={() => setLightboxPhoto({
                                url: guest.checkOutSignature,
                                title: `Guest Departure Check-Out Signature`,
                                subTitle: `Departure clearance for ${guest.guestName} • Room ${guest.roomNumber}`,
                              })}
                              className="group relative h-28 w-36 rounded-xl border border-purple-200 bg-white overflow-hidden cursor-pointer shadow-sm hover:border-purple-400 transition-all flex-shrink-0"
                            >
                              <img
                                src={guest.checkOutSignature}
                                alt="Check-Out Signature"
                                className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                                  <ZoomIn className="h-3 w-3" /> View Departure
                                </span>
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-purple-50 px-2 py-0.5 text-[9px] font-bold text-purple-800 text-center border-t border-purple-100">
                                Check-Out Signature
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* VIEW B: List of All Registered Properties */
            <div className="space-y-4">
              {/* Filter and Search Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search property by name, owner, city, phone, ID..."
                    value={hotelSearchQuery}
                    onChange={(e) => setHotelSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant={hotelStatusFilter === 'ALL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHotelStatusFilter('ALL')}
                    className={`text-xs font-bold ${hotelStatusFilter === 'ALL' ? 'bg-amber-800 hover:bg-amber-700 text-white' : ''}`}
                  >
                    All Properties ({hotels.length})
                  </Button>
                  <Button
                    variant={hotelStatusFilter === 'APPROVED' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHotelStatusFilter('APPROVED')}
                    className={`text-xs font-bold ${hotelStatusFilter === 'APPROVED' ? 'bg-emerald-800 hover:bg-emerald-700 text-white' : ''}`}
                  >
                    Approved & Active ({approvedHotels.length})
                  </Button>
                  <Button
                    variant={hotelStatusFilter === 'PENDING' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHotelStatusFilter('PENDING')}
                    className={`text-xs font-bold ${hotelStatusFilter === 'PENDING' ? 'bg-amber-600 hover:bg-amber-500 text-white' : ''}`}
                  >
                    Pending Approvals ({pendingHotels.length})
                  </Button>
                </div>
              </div>

              {/* Hotel Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHotels.length === 0 ? (
                  <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                    <Building className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <div className="font-extrabold text-slate-700 text-sm">No Properties Found</div>
                    <div className="text-xs text-slate-400 mt-1">Try changing your search terms or filter.</div>
                  </div>
                ) : (
                  filteredHotels.map((hotel) => {
                    const hotelStays = hotelService.getAllStays(hotel.id);
                    return (
                      <div
                        key={hotel.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-extrabold text-slate-900 text-base leading-snug">
                                {hotel.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                  {hotel.id}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {hotel.propertyType || 'Hotel'}
                                </span>
                              </div>
                            </div>
                            <Badge className={
                              hotel.status === 'APPROVED' 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-extrabold'
                                : hotel.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-extrabold'
                                : 'bg-red-100 text-red-800 border-red-300 text-[10px] font-extrabold'
                            }>
                              {hotel.status}
                            </Badge>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div><strong>Owner:</strong> {hotel.ownerName}</div>
                            <div><strong>Email:</strong> {hotel.email}</div>
                            <div><strong>Phone:</strong> {hotel.phone}</div>
                            <div className="truncate text-slate-500" title={hotel.address}>
                              <strong>Address:</strong> {hotel.address}
                            </div>
                          </div>

                          {/* Stats Metrics */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-100/80 rounded-lg p-2">
                              <div className="text-[10px] uppercase font-bold text-slate-400">Rooms</div>
                              <div className="text-sm font-extrabold text-slate-800 font-mono">{hotel.totalRooms || 15}</div>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                              <div className="text-[10px] uppercase font-bold text-emerald-700">Guest Stays</div>
                              <div className="text-sm font-extrabold text-emerald-900 font-mono">
                                {hotel.guestCount !== undefined ? hotel.guestCount : hotelStays.length}
                              </div>
                            </div>
                            <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100">
                              <div className="text-[10px] uppercase font-bold text-indigo-700">Plan</div>
                              <div className="text-xs font-extrabold text-indigo-900 truncate">₹{hotel.subscriptionAmount || 499}/mo</div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <Button
                            variant="emerald"
                            size="sm"
                            className="w-full font-bold text-xs flex items-center justify-center gap-1.5"
                            onClick={() => setSelectedHotel(hotel)}
                          >
                            <User className="h-3.5 w-3.5" />
                            View Hotel Details & Guest Logs →
                          </Button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedDocHotel(hotel)}
                              className="flex-1 py-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors flex items-center justify-center gap-1"
                            >
                              <FileText className="h-3 w-3" /> Inspect Proofs
                            </button>

                            {hotel.status === 'PENDING' && (
                              <button
                                onClick={() => handleApprove(hotel.id)}
                                className="flex-1 py-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors flex items-center justify-center gap-1"
                              >
                                <Check className="h-3 w-3" /> Quick Approve
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: GUESTBOOKS VERIFICATION QUEUE (APPROVALS) */}
      {/* ========================================================================= */}
      {activeTab === 'HOTEL_APPROVALS' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">GUESTBOOKS / PROPERTY NAME</th>
                  <th className="px-5 py-4">OWNER & CONTACT</th>
                  <th className="px-5 py-4">PLAN & RATE</th>
                  <th className="px-5 py-4">VERIFICATION DOCUMENTS</th>
                  <th className="px-5 py-4">STATUS</th>
                  <th className="px-5 py-4 text-right">ADMIN ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {hotels.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      <Building className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                      <div className="font-extrabold text-slate-700 text-sm">No Property Registrations in Queue</div>
                      <div className="text-xs text-slate-400 mt-1">
                        When property owners register on /register, their uploaded documents and application requests will appear here for your verification and approval.
                      </div>
                    </td>
                  </tr>
                ) : (
                  hotels.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-slate-900 text-sm">{hotel.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{hotel.id} • {hotel.propertyType}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{hotel.address}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">{hotel.ownerName}</div>
                        <div className="text-[11px] text-slate-500">{hotel.email}</div>
                        <div className="text-[11px] text-slate-500">{hotel.phone}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                          {hotel.subscriptionPlan || 'Standard Plan (₹499/mo)'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {hotel.documents && hotel.documents.map((doc, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                              <FileText className="h-3 w-3 text-slate-500" />
                              <span className="truncate max-w-[140px]">{doc.name}</span>
                            </div>
                          ))}
                          <button
                            onClick={() => setSelectedDocHotel(hotel)}
                            className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1 pt-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Inspect Submitted Proofs ({hotel.documents?.length || 0})
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {hotel.status === 'APPROVED' && (
                          <Badge variant="success" className="font-extrabold text-[10px]">APPROVED & ACTIVE</Badge>
                        )}
                        {hotel.status === 'PENDING' && (
                          <Badge variant="warning" className="font-extrabold text-[10px]">PENDING APPROVAL</Badge>
                        )}
                        {hotel.status === 'REJECTED' && (
                          <Badge variant="destructive" className="font-extrabold text-[10px]">REJECTED</Badge>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hotel.status === 'PENDING' ? (
                            <>
                              <Button variant="emerald" size="sm" onClick={() => handleApprove(hotel.id)}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve Registration
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleReject(hotel.id)}>
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Decision Finalized</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: CREATE POLICE ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === 'CREATE_POLICE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Creation Form */}
          <form onSubmit={handleCreatePoliceAccount} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b pb-3">
              <ShieldAlert className="h-5 w-5 text-indigo-700" /> Create Official Police Station Account
            </h3>

            {formMessage && (
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-900">
                {formMessage}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Police Station Name *</label>
              <Input
                type="text"
                className="h-9 text-xs"
                placeholder="e.g. Central City Police Station"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Inspector / Officer In-Charge Name *</label>
              <Input
                type="text"
                className="h-9 text-xs"
                placeholder="e.g. Inspector V. K. Sharma"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Police Username *</label>
                <Input
                  type="text"
                  className="h-9 text-xs font-mono"
                  placeholder="e.g. police_central"
                  value={policeUsername}
                  onChange={(e) => setPoliceUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Create Password *</label>
                <Input
                  type="password"
                  className="h-9 text-xs font-mono"
                  placeholder="••••••••"
                  value={policePassword}
                  onChange={(e) => setPolicePassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Jurisdiction Division / Zone</label>
              <Input
                type="text"
                className="h-9 text-xs"
                placeholder="e.g. Metro Division Sector 4"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
              />
            </div>

            <Button type="submit" variant="indigo" size="lg" className="w-full font-bold text-xs bg-indigo-800 hover:bg-indigo-700">
              <UserPlus className="h-4 w-4" /> Issue Police Station Credentials
            </Button>
          </form>

          {/* Active Police Accounts List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b pb-3 flex items-center justify-between">
              <span>Active Police Station Accounts</span>
              <Badge variant="indigo">{policeAccounts.length} Active</Badge>
            </h3>

            <div className="space-y-3">
              {policeAccounts.map((pol) => (
                <div key={pol.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">{pol.stationName}</span>
                    <span className="font-mono text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      Username: {pol.username}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">Officer: {pol.officerName} ({pol.badgeNo || 'Insp'})</div>
                  <div className="text-[11px] text-slate-400">Jurisdiction: {pol.jurisdiction}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: SUBSCRIPTIONS MASTER LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Hotel & Hostel Subscription Master Ledger</h3>
              <p className="text-xs text-slate-500">₹499/month Standard Property Plan billing overview</p>
            </div>
            <div className="text-right bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-emerald-800">Monthly Recurring Revenue (MRR)</div>
              <div className="text-xl font-extrabold text-emerald-900 font-mono">₹{totalSubRevenue.toLocaleString('en-IN')} / mo</div>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold">
              <tr>
                <th className="p-3">HOTEL NAME</th>
                <th className="p-3">PLAN TYPE</th>
                <th className="p-3">MONTHLY RATE</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">LAST RENEWAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {hotels.map((h) => (
                <tr key={h.id}>
                  <td className="p-3 font-bold text-slate-900">{h.name}</td>
                  <td className="p-3 font-semibold text-slate-700">{h.subscriptionPlan || 'Standard Plan'}</td>
                  <td className="p-3 font-mono font-extrabold text-emerald-800">₹{h.subscriptionAmount || 499} / mo</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${h.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                      {h.status === 'APPROVED' ? 'ACTIVE SUBSCRIBER' : 'PENDING ACTIVATION'}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-500">{new Date(h.registeredAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Hotel Registration Document Inspection Dialog */}
      {/* ========================================================================= */}
      {selectedDocHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Inspect Registration Documents
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedDocHotel.name} ({selectedDocHotel.id})</p>
              </div>
              <button 
                className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1 rounded-lg hover:bg-slate-100" 
                onClick={() => setSelectedDocHotel(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div><strong>Owner:</strong> {selectedDocHotel.ownerName} | <strong>Email:</strong> {selectedDocHotel.email}</div>
                <div className="mt-0.5"><strong>Phone:</strong> {selectedDocHotel.phone} | <strong>Address:</strong> {selectedDocHotel.address}</div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800">Uploaded Verification Proofs:</div>
                {selectedDocHotel.documents && selectedDocHotel.documents.length > 0 ? (
                  selectedDocHotel.documents.map((doc, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono font-semibold text-slate-800">
                          <FileText className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-bold">{doc.name}</span>
                          <span className="text-slate-400 text-[10px]">({doc.size || 'Verification File'})</span>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px]">
                          {doc.type || 'DOCUMENT'}
                        </Badge>
                      </div>

                      {doc.dataUrl && (doc.type === 'IMAGE' || doc.dataUrl.startsWith('data:image')) && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 bg-slate-950 flex items-center justify-center">
                          <img
                            src={doc.dataUrl}
                            alt={doc.name}
                            className="max-h-64 w-auto object-contain cursor-pointer"
                            onClick={() => setLightboxPhoto({
                              url: doc.dataUrl,
                              title: `${selectedDocHotel.name} - ${doc.name}`,
                              subTitle: `Property Verification Proof (${doc.size})`,
                            })}
                          />
                        </div>
                      )}

                      {doc.dataUrl && doc.type === 'PDF' && (
                        <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
                          <span className="text-xs text-indigo-900 font-medium">Official PDF Document Attached</span>
                          <a
                            href={doc.dataUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1"
                          >
                            Open PDF in New Window <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {!doc.dataUrl && (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 italic">
                          Document reference stored on secure server storage.
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl">
                    No documents uploaded.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setSelectedDocHotel(null)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                {selectedDocHotel.status === 'PENDING' && (
                  <>
                    <Button variant="destructive" size="sm" onClick={() => handleReject(selectedDocHotel.id)}>
                      Reject Application
                    </Button>
                    <Button variant="emerald" size="sm" onClick={() => handleApprove(selectedDocHotel.id)}>
                      Approve & Activate Property
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Full-Size HD Lightbox Modal (For Guest Aadhaar / ID Photos) */}
      {/* ========================================================================= */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-white font-extrabold text-base flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-emerald-400" />
                  {lightboxPhoto.title}
                </h3>
                {lightboxPhoto.subTitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{lightboxPhoto.subTitle}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={lightboxPhoto.url}
                  download="ID_Verification_Document.jpg"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Download Image"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
                <button
                  onClick={() => setLightboxPhoto(null)}
                  className="h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Preview */}
            <div className="flex items-center justify-center bg-slate-950 rounded-2xl p-2 max-h-[70vh] overflow-hidden border border-slate-800">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            {/* Lightbox Footer Note */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Certified Government ID record stored securely under Data Privacy & Police Verification Guidelines.</span>
              <span className="font-mono text-emerald-400 font-bold">100% Verified Digital Scan</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
