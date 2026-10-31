import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Key, 
  Trash2, 
  Database, 
  Save, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  HardDriveDownload,
  AlertCircle
} from 'lucide-react';
import { authService } from '../../services/authService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

export default function HotelSettingsModal({
  isOpen,
  onClose,
  hotel,
  onHotelUpdated,
  onHotelDeleted
}) {
  if (!isOpen || !hotel) return null;

  const [activeTab, setActiveTab] = useState('PROFILE'); // 'PROFILE', 'PURGE', 'DELETE'

  // Profile & Credentials State
  const [name, setName] = useState(hotel.name || hotel.hotelName || '');
  const [ownerName, setOwnerName] = useState(hotel.ownerName || '');
  const [email, setEmail] = useState(hotel.email || '');
  const [phone, setPhone] = useState(hotel.phone || '');
  const [address, setAddress] = useState(hotel.address || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Storage Purge State
  const [purgePreset, setPurgePreset] = useState('ALL'); // 'ALL', '30_DAYS', '60_DAYS', '90_DAYS', 'CUSTOM'
  const [purgeFromDate, setPurgeFromDate] = useState('');
  const [purgeToDate, setPurgeToDate] = useState('');
  const [photosOnly, setPhotosOnly] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState(null);
  const [confirmPurgeStep, setConfirmPurgeStep] = useState(false);

  // Deletion State
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');

  // Reset form when hotel prop changes
  useEffect(() => {
    setName(hotel.name || hotel.hotelName || '');
    setOwnerName(hotel.ownerName || '');
    setEmail(hotel.email || '');
    setPhone(hotel.phone || '');
    setAddress(hotel.address || '');
    setPassword('');
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    setPurgeResult(null);
    setConfirmPurgeStep(false);
    setConfirmDeleteInput('');
  }, [hotel]);

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      const updatePayload = {
        name: name.trim(),
        ownerName: ownerName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
      };

      if (password.trim()) {
        if (password.trim().length < 6) {
          setProfileErrorMsg('Password must be at least 6 characters long.');
          setSavingProfile(false);
          return;
        }
        updatePayload.password = password.trim();
      }

      const res = await authService.updateHotel(hotel.id, updatePayload);
      if (res && res.success) {
        setProfileSuccessMsg('Hotel profile and login credentials updated successfully!');
        setPassword('');
        if (onHotelUpdated) {
          onHotelUpdated(res.hotel || { ...hotel, ...updatePayload });
        }
      } else {
        setProfileErrorMsg(res?.message || 'Failed to update hotel information.');
      }
    } catch (err) {
      setProfileErrorMsg(err?.message || 'Error saving changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Compute Purge Date Parameters
  const calculatePurgeParams = () => {
    const now = new Date();
    if (purgePreset === 'ALL') {
      return { allRecords: true, photosOnly };
    }
    if (purgePreset === '30_DAYS') {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { beforeDate: d.toISOString(), photosOnly };
    }
    if (purgePreset === '60_DAYS') {
      const d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      return { beforeDate: d.toISOString(), photosOnly };
    }
    if (purgePreset === '90_DAYS') {
      const d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { beforeDate: d.toISOString(), photosOnly };
    }
    if (purgePreset === 'CUSTOM') {
      return { fromDate: purgeFromDate, toDate: purgeToDate, photosOnly };
    }
    return { allRecords: true, photosOnly };
  };

  // Execute Storage Purge
  const handleExecutePurge = async () => {
    setPurging(true);
    setPurgeResult(null);

    try {
      const params = calculatePurgeParams();
      const res = await authService.purgeHotelData(hotel.id, params);
      setPurgeResult(res);
      setConfirmPurgeStep(false);
      if (onHotelUpdated) onHotelUpdated();
    } catch (err) {
      setPurgeResult({ success: false, message: err?.message || 'Error executing purge.' });
    } finally {
      setPurging(false);
    }
  };

  // Execute Permanent Hotel Delete
  const handleExecuteDelete = async () => {
    if (confirmDeleteInput.trim().toUpperCase() !== 'DELETE') {
      setDeleteErrorMsg('Please type DELETE in capital letters to confirm.');
      return;
    }

    setDeleting(true);
    setDeleteErrorMsg('');

    try {
      const res = await authService.deleteHotel(hotel.id);
      if (res && res.success) {
        if (onHotelDeleted) onHotelDeleted(hotel.id);
        onClose();
      } else {
        setDeleteErrorMsg(res?.message || 'Failed to delete hotel.');
        setDeleting(false);
      }
    } catch (err) {
      setDeleteErrorMsg(err?.message || 'Error deleting hotel from server.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200/80 rounded-xl text-slate-700">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">{hotel.name || hotel.hotelName}</h3>
                <Badge variant="outline" className="font-mono text-[10px] font-bold">
                  {hotel.id}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Manage credentials, server storage purge, and hotel status</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2 pt-2">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'PROFILE'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Edit Profile & Password
          </button>

          <button
            onClick={() => setActiveTab('PURGE')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'PURGE'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Storage Purge (Date Range)
          </button>

          <button
            onClick={() => setActiveTab('DELETE')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'DELETE'
                ? 'border-rose-600 text-rose-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Property
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">

          {/* TAB 1: EDIT PROFILE & PASSWORD */}
          {activeTab === 'PROFILE' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hotel / Property Name</label>
                  <Input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Owner / Manager Name</label>
                  <Input 
                    type="text" 
                    value={ownerName} 
                    onChange={(e) => setOwnerName(e.target.value)} 
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contact Email (Login Username)</label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
                  <Input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Physical Address</label>
                <Input 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  className="text-xs h-9"
                />
              </div>

              {/* Password Reset Section */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-extrabold text-slate-800">Reset Manager Login Password</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Leave blank to keep existing password</span>
                </div>

                <div className="relative">
                  <Input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new login password for this hotel"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-xs h-9 pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={onClose}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={savingProfile}
                  className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingProfile ? 'Saving Changes...' : 'Save Profile & Credentials'}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: STORAGE PURGE (BY TIME PERIOD) */}
          {activeTab === 'PURGE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="font-extrabold flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-amber-700" />
                  Server Storage Maintenance & Data Retention
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Regularly purging historical records helps maintain server disk space and optimizes database query speed.
                  You can purge heavy ID document photos while preserving textual police log entries, or completely wipe records.
                </p>
              </div>

              {purgeResult && (
                <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  purgeResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {purgeResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                  <span>{purgeResult.message || (purgeResult.success ? `Successfully purged ${purgeResult.purgedCount} items.` : 'Purge failed.')}</span>
                </div>
              )}

              {/* Mode Option */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Purge Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    onClick={() => setPhotosOnly(true)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      photosOnly 
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">ID Document Photos Only</span>
                      {photosOnly && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">RECOMMENDED</span>}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Strips heavy base64 Aadhaar/passport photos (95% storage savings) while retaining guest names, dates & police register for compliance.
                    </p>
                  </div>

                  <div 
                    onClick={() => setPhotosOnly(false)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      !photosOnly 
                        ? 'border-rose-600 bg-rose-50/50 ring-1 ring-rose-600' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Complete Records Wipe</span>
                      {!photosOnly && <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-1.5 py-0.5 rounded">FULL PURGE</span>}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Permanently deletes entire guest check-in records along with all documents and signatures for the specified time period.
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-800 block">Select Time Period</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: '30_DAYS', label: '> 30 Days' },
                    { id: '60_DAYS', label: '> 60 Days' },
                    { id: '90_DAYS', label: '> 90 Days' },
                    { id: 'CUSTOM', label: 'Custom Range' },
                    { id: 'ALL', label: 'All Past Data' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPurgePreset(preset.id)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-all ${
                        purgePreset === preset.id
                          ? 'border-amber-600 bg-amber-50 text-amber-900 font-extrabold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {purgePreset === 'CUSTOM' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">From Date</span>
                      <Input 
                        type="date" 
                        value={purgeFromDate} 
                        onChange={(e) => setPurgeFromDate(e.target.value)} 
                        className="text-xs h-9"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">To Date</span>
                      <Input 
                        type="date" 
                        value={purgeToDate} 
                        onChange={(e) => setPurgeToDate(e.target.value)} 
                        className="text-xs h-9"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation Step */}
              {confirmPurgeStep ? (
                <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 space-y-3">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Are you sure you want to proceed with this storage purge?</span>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    This will permanently {photosOnly ? 'strip ID photos' : 'delete all guest records'} for {hotel.name} matching the selected time range. This action cannot be reversed.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setConfirmPurgeStep(false)}
                      className="text-xs font-bold"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      disabled={purging}
                      onClick={handleExecutePurge}
                      className="text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white"
                    >
                      {purging ? 'Purging Server Storage...' : 'Yes, Permanently Purge'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end pt-3">
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => setConfirmPurgeStep(true)}
                    className="text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-1.5"
                  >
                    <HardDriveDownload className="h-3.5 w-3.5" />
                    Start Server Storage Purge
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERMANENT HOTEL DELETION */}
          {activeTab === 'DELETE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 space-y-2">
                <div className="font-extrabold flex items-center gap-2 text-rose-950 text-sm">
                  <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                  Danger Zone: Completely Delete Hotel & Wipe Server Data
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Deleting this property will permanently and irrevocably wipe:
                </p>
                <ul className="list-disc pl-5 text-[11px] space-y-1 text-rose-900 font-medium">
                  <li>The hotel registration profile in central database</li>
                  <li>All guest check-in records, sequential registers, and signatures</li>
                  <li>All uploaded Aadhaar / ID document scans (front & back)</li>
                  <li>All configured rooms, statuses, and custom room tariffs</li>
                  <li>All hotel manager and staff user accounts & login credentials</li>
                </ul>
              </div>

              {deleteErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <span>{deleteErrorMsg}</span>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-800 block">
                  To confirm permanent deletion, please type <span className="font-mono text-rose-700 font-extrabold">DELETE</span> below:
                </label>
                <Input 
                  type="text" 
                  placeholder="Type DELETE to confirm" 
                  value={confirmDeleteInput} 
                  onChange={(e) => setConfirmDeleteInput(e.target.value)} 
                  className="text-xs h-9 font-mono border-rose-300 focus-visible:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={onClose}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  disabled={confirmDeleteInput.trim().toUpperCase() !== 'DELETE' || deleting}
                  onClick={handleExecuteDelete}
                  className="text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting ? 'Wiping All Hotel Data...' : 'Permanently Delete Hotel'}
                </Button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
