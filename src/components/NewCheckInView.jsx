import React, { useState } from 'react';
import { User, Users, Building2, Camera, Check, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import DocumentScannerZone from './DocumentScannerZone';

export default function NewCheckInView({ vacantRooms, onCheckInComplete }) {
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(vacantRooms[0]?.number || '');
  const [stayType, setStayType] = useState('24 Hours Full Stay');
  const [roomRate, setRoomRate] = useState(vacantRooms[0]?.rate.toString() || '1800');
  const [advancePaid, setAdvancePaid] = useState(vacantRooms[0]?.rate.toString() || '1800');
  const [paymentMode, setPaymentMode] = useState('UPI / GPay');

  // Primary Guest
  const [primaryName, setPrimaryName] = useState('');
  const [primaryAge, setPrimaryAge] = useState('');
  const [primaryGender, setPrimaryGender] = useState('Male');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [primaryIdType, setPrimaryIdType] = useState('Aadhaar Card');
  const [primaryIdNumber, setPrimaryIdNumber] = useState('');
  const [primaryAddress, setPrimaryAddress] = useState('');
  const [primaryCity, setPrimaryCity] = useState('');
  const [isLocal, setIsLocal] = useState(false);

  // Accompanying Guest / Partner
  const [hasAccompanying, setHasAccompanying] = useState(true);
  const [partnerName, setPartnerName] = useState('');
  const [partnerAge, setPartnerAge] = useState('');
  const [partnerGender, setPartnerGender] = useState('Female');
  const [partnerRelation, setPartnerRelation] = useState('Partner / Couple');
  const [partnerIdType, setPartnerIdType] = useState('Aadhaar Card');
  const [partnerIdNumber, setPartnerIdNumber] = useState('');

  // Additional details
  const [comingFrom, setComingFrom] = useState('');
  const [goingTo, setGoingTo] = useState('');
  const [purpose, setPurpose] = useState('Personal / Tourism');
  const [vehicleNo, setVehicleNo] = useState('');
  const [idScanUploaded, setIdScanUploaded] = useState(false);

  const handlePrimaryOcrExtract = (parsed) => {
    if (parsed.name) setPrimaryName(parsed.name);
    if (parsed.idType) setPrimaryIdType(parsed.idType);
    if (parsed.idNumber) setPrimaryIdNumber(parsed.idNumber);
    if (parsed.age) setPrimaryAge(parsed.age);
    if (parsed.gender) setPrimaryGender(parsed.gender);
    if (parsed.address) setPrimaryAddress(parsed.address);
    if (parsed.city) setPrimaryCity(parsed.city);
    setIdScanUploaded(true);
  };

  const handlePartnerOcrExtract = (parsed) => {
    if (parsed.name) setPartnerName(parsed.name);
    if (parsed.idType) setPartnerIdType(parsed.idType);
    if (parsed.idNumber) setPartnerIdNumber(parsed.idNumber);
    if (parsed.age) setPartnerAge(parsed.age);
    if (parsed.gender) setPartnerGender(parsed.gender);
  };

  const handleRoomChange = (roomNo) => {
    setSelectedRoomNumber(roomNo);
    const rm = vacantRooms.find((r) => r.number === roomNo);
    if (rm) {
      setRoomRate(rm.rate.toString());
      setAdvancePaid(rm.rate.toString());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!primaryName || !primaryPhone || !primaryIdNumber) {
      alert('Please fill primary guest name, phone, and ID proof number.');
      return;
    }

    const checkInData = {
      roomNumber: selectedRoomNumber,
      stayType,
      roomRate: Number(roomRate),
      advancePaid: Number(advancePaid),
      paymentMode,
      comingFrom: comingFrom || 'Direct Check-in',
      goingTo: goingTo || 'Direct Check-in',
      purpose,
      vehicleNo: vehicleNo || 'N/A',
      primaryGuest: {
        name: primaryName,
        age: Number(primaryAge) || 25,
        gender: primaryGender,
        phone: primaryPhone,
        idType: primaryIdType,
        idNumber: primaryIdNumber,
        address: primaryAddress,
        city: primaryCity,
        isLocal,
      },
      accompanyingGuest:
        hasAccompanying && partnerName
          ? {
              name: partnerName,
              age: Number(partnerAge) || 24,
              gender: partnerGender,
              relation: partnerRelation,
              idType: partnerIdType,
              idNumber: partnerIdNumber,
              address: primaryAddress,
              city: primaryCity,
            }
          : null,
    };

    onCheckInComplete(checkInData);
    alert(`Guest registration submitted! Room ${selectedRoomNumber} is now OCCUPIED.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-emerald-800" />
              New Guest Registration Form
            </h2>
            <Badge className="bg-emerald-800 text-white font-bold px-3 py-1 text-xs">
              First Visit Entry
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            First-time visitor registration & statutory Police Form C verification capture.
          </p>
        </div>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
        {/* Section 1: Primary Guest Details */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600" /> Primary Guest Details (Mandatory for Police Register)
          </h3>

          {/* Document Photo Upload & OCR Scanner Zone (2 Photos: Front & Back) */}
          <DocumentScannerZone
            label="Primary Guest Document — Auto Scan & Fill"
            targetGuestName="Primary Guest"
            accentColor="indigo"
            onApplyExtractedData={handlePrimaryOcrExtract}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Full Name *</label>
              <Input
                type="text"
                className="h-9 text-xs"
                placeholder="e.g. Rahul Sharma"
                value={primaryName}
                onChange={(e) => setPrimaryName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Mobile Number *</label>
              <Input
                type="tel"
                className="h-9 text-xs"
                placeholder="e.g. 9876543210"
                value={primaryPhone}
                onChange={(e) => setPrimaryPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Age & Gender</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  className="h-9 text-xs w-24"
                  placeholder="Age"
                  value={primaryAge}
                  onChange={(e) => setPrimaryAge(e.target.value)}
                />
                <select
                  className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600"
                  value={primaryGender}
                  onChange={(e) => setPrimaryGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Govt ID Proof Type *</label>
              <select
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600"
                value={primaryIdType}
                onChange={(e) => setPrimaryIdType(e.target.value)}
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Voter ID">Voter ID Card</option>
                <option value="Driving License">Driving License</option>
                <option value="Passport">Passport</option>
                <option value="PAN Card">PAN Card</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">ID Document Number *</label>
              <Input
                type="text"
                className="h-9 text-xs"
                placeholder="e.g. 4532 8910 2241"
                value={primaryIdNumber}
                onChange={(e) => setPrimaryIdNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">ID Photo Status</label>
              <Button
                type="button"
                variant={idScanUploaded ? 'emerald' : 'outline'}
                className="w-full h-9 text-xs"
                onClick={() => setIdScanUploaded(!idScanUploaded)}
              >
                {idScanUploaded ? (
                  <>
                    <Check className="h-4 w-4" /> ID Photo Uploaded
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" /> Capture / Upload
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Permanent Address</label>
              <Input
                type="text"
                className="h-9 text-xs"
                placeholder="Flat/House No, Street, Landmark"
                value={primaryAddress}
                onChange={(e) => setPrimaryAddress(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">City & State</label>
              <Input
                type="text"
                className="h-9 text-xs"
                placeholder="e.g. New Delhi, Delhi"
                value={primaryCity}
                onChange={(e) => setPrimaryCity(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Accompanying Partner Details */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" /> Partner B / Accompanying Person Details
            </h3>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                checked={hasAccompanying}
                onChange={(e) => setHasAccompanying(e.target.checked)}
              />
              Couple / Partner B Present
            </label>
          </div>

          {hasAccompanying && (
            <div className="space-y-4 pt-2">
              {/* Document Photo Upload & OCR Zone for Partner B */}
              <DocumentScannerZone
                label="Partner B Document — Auto Scan & Fill"
                targetGuestName="Partner B"
                accentColor="emerald"
                onApplyExtractedData={handlePartnerOcrExtract}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Partner Name</label>
                  <Input
                    type="text"
                    className="h-9 text-xs"
                    placeholder="e.g. Priya Verma"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Age & Gender</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      className="h-9 text-xs w-24"
                      placeholder="Age"
                      value={partnerAge}
                      onChange={(e) => setPartnerAge(e.target.value)}
                    />
                    <select
                      className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                      value={partnerGender}
                      onChange={(e) => setPartnerGender(e.target.value)}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Relation / Category</label>
                  <select
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                    value={partnerRelation}
                    onChange={(e) => setPartnerRelation(e.target.value)}
                  >
                    <option value="Partner / Couple">Partner / Couple</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Friend">Friend</option>
                    <option value="Family Member">Family Member</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Partner ID Proof Type</label>
                  <select
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                    value={partnerIdType}
                    onChange={(e) => setPartnerIdType(e.target.value)}
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Partner ID Number</label>
                  <Input
                    type="text"
                    className="h-9 text-xs"
                    placeholder="e.g. 7812 9043 1120"
                    value={partnerIdNumber}
                    onChange={(e) => setPartnerIdNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Room Assignment */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" /> Room Assignment & Tariff
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Select Room *</label>
              <select
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                value={selectedRoomNumber}
                onChange={(e) => handleRoomChange(e.target.value)}
                required
              >
                {vacantRooms.map((r) => (
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
                <option value="3 Hours Express">3 Hours Express</option>
                <option value="6 Hours Flexi">6 Hours Flexi</option>
                <option value="12 Hours Day Stay">12 Hours Day Stay</option>
                <option value="24 Hours Full Stay">24 Hours Full Stay</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Advance Received (₹)</label>
              <Input
                type="number"
                className="h-9 text-xs"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="submit" variant="emerald" size="lg" className="px-6 font-extrabold">
            <Check className="h-4 w-4" /> Save Registration & Check In
          </Button>
        </div>
      </form>
    </div>
  );
}
