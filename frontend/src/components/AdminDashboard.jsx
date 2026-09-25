import React, { useState } from 'react';
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
  Download
} from 'lucide-react';
import { authService } from '../services/authService';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

export default function AdminDashboard() {
  const [hotels, setHotels] = useState(authService.getAllHotels());
  const [policeAccounts, setPoliceAccounts] = useState(authService.getAllPoliceAccounts());
  const [activeTab, setActiveTab] = useState('HOTEL_APPROVALS'); // 'HOTEL_APPROVALS', 'CREATE_POLICE', 'SUBSCRIPTIONS'

  // Modal / Selected doc inspection state
  const [selectedDocHotel, setSelectedDocHotel] = useState(null);

  // New Police Account Form state
  const [stationName, setStationName] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [policeEmail, setPoliceEmail] = useState('');
  const [policeUsername, setPoliceUsername] = useState('');
  const [policePassword, setPolicePassword] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const refreshData = () => {
    setHotels(authService.getAllHotels());
    setPoliceAccounts(authService.getAllPoliceAccounts());
  };

  const handleApprove = (hotelId) => {
    authService.approveHotel(hotelId);
    refreshData();
    setSelectedDocHotel(null);
  };

  const handleReject = (hotelId) => {
    authService.rejectHotel(hotelId);
    refreshData();
    setSelectedDocHotel(null);
  };

  const handleCreatePoliceAccount = (e) => {
    e.preventDefault();
    setFormMessage('');

    if (!stationName || !officerName || !policeUsername || !policePassword) {
      setFormMessage('Please fill all required police account details.');
      return;
    }

    const res = authService.createPoliceAccount({
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
      refreshData();
    } else {
      setFormMessage(res.message);
    }
  };

  const pendingHotels = hotels.filter((h) => h.status === 'PENDING');
  const approvedHotels = hotels.filter((h) => h.status === 'APPROVED');
  const totalSubRevenue = hotels
    .filter((h) => h.status === 'APPROVED')
    .reduce((acc, h) => acc + (h.subscriptionAmount || 499), 0);

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
            Verify & approve hotel self-registrations, inspect uploaded trade licenses, generate Police credentials, and track ₹499 hostel subscription revenues.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white border border-amber-200 rounded-xl px-4 py-2.5 shadow-2xs">
          <div>
            <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Active Hotels</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{approvedHotels.length}</div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <div className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">Pending Approvals</div>
            <div className="text-xl font-extrabold text-amber-700 font-mono">{pendingHotels.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs max-w-md">
        <button
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'HOTEL_APPROVALS' ? 'bg-amber-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('HOTEL_APPROVALS')}
        >
          Hotel Verification Queue ({pendingHotels.length})
        </button>
        <button
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'CREATE_POLICE' ? 'bg-amber-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('CREATE_POLICE')}
        >
          Create Police Accounts ({policeAccounts.length})
        </button>
        <button
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'SUBSCRIPTIONS' ? 'bg-amber-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('SUBSCRIPTIONS')}
        >
          Subscription Ledger
        </button>
      </div>

      {/* TAB 1: HOTEL APPROVALS & DOCUMENT INSPECTION */}
      {activeTab === 'HOTEL_APPROVALS' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">HOTEL / HOSTEL NAME</th>
                  <th className="px-5 py-4">OWNER & CONTACT</th>
                  <th className="px-5 py-4">PLAN & RATE</th>
                  <th className="px-5 py-4">VERIFICATION DOCUMENTS</th>
                  <th className="px-5 py-4">STATUS</th>
                  <th className="px-5 py-4 text-right">ADMIN ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {hotels.map((hotel) => (
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
                        {hotel.subscriptionPlan}
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
                          <Eye className="h-3.5 w-3.5" /> Inspect Submitted Proofs
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE POLICE ACCOUNTS */}
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

      {/* TAB 3: SUBSCRIPTIONS LEDGER */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Hotel & Hostel Subscription Master Ledger</h3>
              <p className="text-xs text-slate-500">₹499/month Hostel Plan & ₹999/month Deluxe Hotel Plan billing overview</p>
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
                  <td className="p-3 font-semibold text-slate-700">{h.subscriptionPlan}</td>
                  <td className="p-3 font-mono font-extrabold text-emerald-800">₹{h.subscriptionAmount || 499} / mo</td>
                  <td className="p-3">
                    <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                      ACTIVE SUBSCRIBER
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-500">{new Date(h.registeredAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Inspection Dialog Modal */}
      {selectedDocHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                Inspect Submitted Verification Files - {selectedDocHotel.name}
              </h3>
              <button className="text-slate-400 hover:text-slate-700 font-bold text-xs" onClick={() => setSelectedDocHotel(null)}>
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-600">
                <strong>Owner:</strong> {selectedDocHotel.ownerName} | <strong>Email:</strong> {selectedDocHotel.email} | <strong>Phone:</strong> {selectedDocHotel.phone}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">Attached Documents for Verification:</div>
                {selectedDocHotel.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center gap-2 font-mono font-semibold text-slate-700">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      {doc.name} ({doc.size})
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      VERIFIED SCAN
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button variant="destructive" size="sm" onClick={() => handleReject(selectedDocHotel.id)}>
                Reject Documents
              </Button>
              <Button variant="emerald" size="sm" onClick={() => handleApprove(selectedDocHotel.id)}>
                Approve & Activate Hotel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
