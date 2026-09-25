import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  Star, 
  CheckCircle2, 
  User, 
  Users, 
  Building2, 
  X,
  UserPlus 
} from 'lucide-react';
import { hotelService } from '../services/hotelService';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

export default function ExpressCheckInModal({ 
  isOpen, 
  onClose, 
  preSelectedRoom, 
  vacantRooms, 
  onCheckInComplete,
  switchToNewGuest 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundGuestProfile, setFoundGuestProfile] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Form State
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(preSelectedRoom || '');
  const [stayType, setStayType] = useState('24 Hours Full Stay');
  const [roomRate, setRoomRate] = useState('1800');
  const [advancePaid, setAdvancePaid] = useState('1800');
  const [paymentMode, setPaymentMode] = useState('UPI / GPay');
  const [purpose, setPurpose] = useState('Personal / Stay');
  const [vehicleNo, setVehicleNo] = useState('');

  useEffect(() => {
    if (preSelectedRoom) {
      setSelectedRoomNumber(preSelectedRoom);
      const rm = vacantRooms.find(r => r.number === preSelectedRoom);
      if (rm) setRoomRate(rm.rate.toString());
    } else if (vacantRooms.length > 0) {
      setSelectedRoomNumber(vacantRooms[0].number);
      setRoomRate(vacantRooms[0].rate.toString());
    }
  }, [preSelectedRoom, vacantRooms]);

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const result = hotelService.lookupGuestByPhoneOrAadhaar(searchQuery);
    setFoundGuestProfile(result);
    setSearchPerformed(true);
  };

  const handleQuickDemoClick = (phone) => {
    setSearchQuery(phone);
    const result = hotelService.lookupGuestByPhoneOrAadhaar(phone);
    setFoundGuestProfile(result);
    setSearchPerformed(true);
  };

  const handleRoomSelectChange = (roomNo) => {
    setSelectedRoomNumber(roomNo);
    const rm = vacantRooms.find(r => r.number === roomNo);
    if (rm) {
      setRoomRate(rm.rate.toString());
      setAdvancePaid(rm.rate.toString());
    }
  };

  const handleSubmitCheckIn = (e) => {
    e.preventDefault();
    if (!foundGuestProfile) return;
    if (!selectedRoomNumber) {
      alert('Please select a vacant room');
      return;
    }

    const stayRecordData = {
      roomNumber: selectedRoomNumber,
      stayType,
      roomRate: Number(roomRate),
      advancePaid: Number(advancePaid),
      paymentMode,
      purpose,
      vehicleNo,
      primaryGuest: foundGuestProfile.primaryGuest,
      accompanyingGuest: foundGuestProfile.accompanyingGuest,
    };

    onCheckInComplete(stayRecordData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Express Couple / Guest Check-In
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Instant Auto-Fill for Repeat Visitors (&lt;10 Seconds)
              </p>
            </div>
          </div>
          <button 
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Quick Search Container */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <Search className="h-4 w-4" /> Enter Mobile Number or Aadhaar ID of Guest / Couple:
            </label>
            
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input 
                type="text"
                className="h-10 text-sm bg-white font-medium shadow-xs"
                placeholder="e.g. 9876543210 or 4532 8910 2241"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <Button type="submit" variant="express" className="h-10 px-5 shrink-0">
                <Search className="h-4 w-4" /> Auto-Fill Data
              </Button>
            </form>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-slate-500">Quick demo guests:</span>
              <button 
                type="button"
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all shadow-2xs"
                onClick={() => handleQuickDemoClick('9876543210')}
              >
                Rahul Sharma & Priya (5th Visit)
              </button>
              <button 
                type="button"
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all shadow-2xs"
                onClick={() => handleQuickDemoClick('9988776655')}
              >
                Vikram Singh & Ananya (4th Visit)
              </button>
              <button 
                type="button"
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all shadow-2xs"
                onClick={() => handleQuickDemoClick('9123456789')}
              >
                Amit Patel & Neha (3rd Visit)
              </button>
            </div>
          </div>

          {/* Step 2: Auto-Filled Profile Results */}
          {searchPerformed && foundGuestProfile && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              {/* Profile Status Banner */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="success" className="gap-1 font-extrabold text-xs">
                    <Star className="h-3.5 w-3.5 fill-emerald-700" /> REPEAT GUEST ({foundGuestProfile.totalVisits}th VISIT)
                  </Badge>
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Previous ID Verification Passed
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Last stayed: {foundGuestProfile.lastVisited}</span>
              </div>

              {/* Dual Guest Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Guest */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
                    <User className="h-4 w-4 text-indigo-600" /> Primary Guest (Auto-filled)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div><span className="font-semibold text-slate-900">Name:</span> {foundGuestProfile.primaryGuest.name}</div>
                    <div><span className="font-semibold text-slate-900">Age/Gender:</span> {foundGuestProfile.primaryGuest.age} yrs / {foundGuestProfile.primaryGuest.gender}</div>
                    <div><span className="font-semibold text-slate-900">Mobile:</span> {foundGuestProfile.primaryGuest.phone}</div>
                    <div><span className="font-semibold text-slate-900">Aadhaar:</span> {foundGuestProfile.primaryGuest.idNumber}</div>
                    <div className="col-span-2"><span className="font-semibold text-slate-900">Address:</span> {foundGuestProfile.primaryGuest.address}, {foundGuestProfile.primaryGuest.city}</div>
                  </div>
                </div>

                {/* Partner */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
                    <Users className="h-4 w-4 text-emerald-600" /> Partner / Accompanying Person
                  </div>
                  {foundGuestProfile.accompanyingGuest ? (
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div><span className="font-semibold text-slate-900">Name:</span> {foundGuestProfile.accompanyingGuest.name}</div>
                      <div><span className="font-semibold text-slate-900">Age/Gender:</span> {foundGuestProfile.accompanyingGuest.age} yrs / {foundGuestProfile.accompanyingGuest.gender}</div>
                      <div><span className="font-semibold text-slate-900">Relation:</span> {foundGuestProfile.accompanyingGuest.relation}</div>
                      <div><span className="font-semibold text-slate-900">Aadhaar Card:</span> {foundGuestProfile.accompanyingGuest.idNumber}</div>
                      <div className="col-span-2"><span className="font-semibold text-slate-900">City:</span> {foundGuestProfile.accompanyingGuest.city}</div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Single guest visit history</p>
                  )}
                </div>
              </div>

              {/* Express Room Assignment Form */}
              <form onSubmit={handleSubmitCheckIn} className="space-y-4 pt-2 border-t border-slate-200">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" /> Select Room & Tariff Package
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Assign Vacant Room *</label>
                    <select 
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                      value={selectedRoomNumber}
                      onChange={(e) => handleRoomSelectChange(e.target.value)}
                      required
                    >
                      {vacantRooms.map(r => (
                        <option key={r.id} value={r.number}>
                          Room {r.number} ({r.type} - ₹{r.rate})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Stay Package / Slot</label>
                    <select 
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                      value={stayType}
                      onChange={(e) => setStayType(e.target.value)}
                    >
                      <option value="3 Hours Express">3 Hours Express Slot</option>
                      <option value="6 Hours Flexi">6 Hours Flexi Slot</option>
                      <option value="12 Hours Day Stay">12 Hours Day Stay</option>
                      <option value="24 Hours Full Stay">24 Hours Full Stay</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Room Rate (₹)</label>
                    <Input 
                      type="number"
                      className="h-9 text-xs"
                      value={roomRate}
                      onChange={(e) => setRoomRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Advance Received (₹)</label>
                    <Input 
                      type="number"
                      className="h-9 text-xs"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Payment Mode</label>
                    <select 
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <option value="UPI / GPay">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash at Counter</option>
                      <option value="Credit/Debit Card">Credit / Debit Card</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Vehicle No (Optional)</label>
                    <Input 
                      type="text"
                      className="h-9 text-xs"
                      placeholder="e.g. MH-12-AB-1234"
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit Action Row */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="express" size="lg" className="px-6 font-extrabold">
                    <Zap className="h-4 w-4" /> CONFIRM CHECK-IN (&lt;10 Secs)
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Search performed but no guest found */}
          {searchPerformed && !foundGuestProfile && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
              <p className="text-xs text-slate-600">No previous visit record found for <strong>"{searchQuery}"</strong>.</p>
              <Button variant="emerald" onClick={() => { onClose(); switchToNewGuest(); }}>
                <UserPlus className="h-4 w-4" /> Register as New Guest / Couple
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
