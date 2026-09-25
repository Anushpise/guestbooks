import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Zap, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Star, 
  UserCheck, 
  Phone, 
  MapPin, 
  Calendar,
  User,
  ShieldCheck
} from 'lucide-react';
import { hotelService } from '../services/hotelService';
import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell 
} from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function GuestLedger({ openExpressModal }) {
  const [guests, setGuests] = useState(hotelService.getAllGuests());
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleBlacklist = (identifier) => {
    const updated = hotelService.toggleBlacklist(identifier);
    setGuests(updated);
  };

  const filteredGuests = guests.filter(g => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const phoneMatch = g.phone && g.phone.includes(q);
    const aadhaarMatch = g.aadhaar && g.aadhaar.includes(q);
    const primaryNameMatch = g.primaryGuest && g.primaryGuest.name.toLowerCase().includes(q);
    const partnerNameMatch = g.accompanyingGuest && g.accompanyingGuest.name.toLowerCase().includes(q);
    return phoneMatch || aadhaarMatch || primaryNameMatch || partnerNameMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Frequent Guests & Repeat Couple Database</h2>
          <p className="text-xs text-slate-500">Track visit frequency, auto-fill profiles, and manage security flags</p>
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            type="text"
            className="pl-9 h-9 text-xs"
            placeholder="Search by Name, Mobile, or Aadhaar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Primary Guest</TableHead>
            <TableHead>Partner / Accompanying</TableHead>
            <TableHead>Visit History</TableHead>
            <TableHead>Govt ID Documents</TableHead>
            <TableHead>Last Visit</TableHead>
            <TableHead>Security Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredGuests.map((g, idx) => (
            <TableRow key={idx} className={g.isBlacklisted ? 'bg-red-50/60' : ''}>
              {/* Primary Guest */}
              <TableCell>
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0 border border-slate-200">
                    <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">
                      {g.primaryGuest.name ? g.primaryGuest.name.slice(0, 2).toUpperCase() : 'GU'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-sm">{g.primaryGuest.name}</div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{g.primaryGuest.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[200px]">{g.primaryGuest.address}, {g.primaryGuest.city}</span>
                    </div>
                  </div>
                </div>
              </TableCell>

              {/* Partner */}
              <TableCell>
                {g.accompanyingGuest ? (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 text-xs">{g.accompanyingGuest.name}</div>
                      <div className="text-[11px] text-emerald-700 font-medium">{g.accompanyingGuest.relation}</div>
                      <div className="text-[10px] text-slate-400">{g.accompanyingGuest.idType}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs italic">Single Occupant</span>
                )}
              </TableCell>

              {/* Visit Frequency */}
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 font-bold text-amber-600 text-xs">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    <span>{g.totalVisits} Visits</span>
                  </div>
                  {g.totalVisits >= 3 && (
                    <Badge variant="warning" className="text-[10px] py-0 px-1.5">
                      Frequent Visitor
                    </Badge>
                  )}
                </div>
              </TableCell>

              {/* ID Details */}
              <TableCell>
                <div className="space-y-1 font-mono text-[11px] text-slate-600">
                  <div className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    <span className="font-semibold text-slate-900">Primary: </span>
                    <span>{g.primaryGuest.idType}: {g.primaryGuest.idNumber}</span>
                  </div>
                  {g.accompanyingGuest && (
                    <div className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      <span className="font-semibold text-slate-900">Partner: </span>
                      <span>{g.accompanyingGuest.idType}: {g.accompanyingGuest.idNumber}</span>
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Last Visit */}
              <TableCell>
                <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{g.lastVisited}</span>
                </div>
              </TableCell>

              {/* Status */}
              <TableCell>
                {g.isBlacklisted ? (
                  <Badge variant="destructive" className="gap-1 text-[11px]">
                    <Lock className="h-3 w-3" /> BLACKLISTED
                  </Badge>
                ) : (
                  <Badge variant="success" className="gap-1 text-[11px]">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button 
                    variant="express" 
                    size="sm"
                    onClick={() => openExpressModal(null, g.phone)}
                    disabled={g.isBlacklisted}
                  >
                    <Zap className="h-3.5 w-3.5" /> Express Check-In
                  </Button>
                  <Button 
                    variant={g.isBlacklisted ? "outline" : "destructive"}
                    size="sm"
                    onClick={() => handleToggleBlacklist(g.phone)}
                  >
                    {g.isBlacklisted ? <><Unlock className="h-3.5 w-3.5" /> Unblock</> : <><Lock className="h-3.5 w-3.5" /> Blacklist</>}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
