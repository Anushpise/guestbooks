import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Printer, 
  Building2, 
  ShieldCheck,
  BedDouble,
  MapPin,
  CheckCircle2,
  Phone,
  Layers,
  Sparkles,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { hotelService } from '../services/hotelService';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export default function PolicePortalView({ user }) {
  const [selectedArea, setSelectedArea] = useState(user?.jurisdiction || 'Metro Division Sector 4');
  const [hotels, setHotels] = useState([]);
  const areasList = hotelService.getAreasList();

  const loadData = () => {
    setHotels(hotelService.getHotelsWithOccupancy(selectedArea));
  };

  useEffect(() => {
    loadData();
  }, [selectedArea]);

  // Calculate area summary metrics
  const totalAreaHotels = hotels.length;
  const totalAreaCapacity = hotels.reduce((acc, h) => acc + (h.totalRooms || 0), 0);
  const totalAreaOccupied = hotels.reduce((acc, h) => acc + (h.occupiedRooms || 0), 0);
  const totalAreaVacant = Math.max(0, totalAreaCapacity - totalAreaOccupied);
  const areaOccupancyRate = totalAreaCapacity > 0 ? Math.round((totalAreaOccupied / totalAreaCapacity) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* ── Official Police Department Header Banner ────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 shadow-xl text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 shadow-md">
              <ShieldAlert className="h-7 w-7 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-extrabold text-[10px] tracking-wider uppercase">
                  POLICE LAW ENFORCEMENT COMMAND
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-extrabold text-[10px] gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Real-Time City Surveillance
                </Badge>
              </div>
              <h2 className="font-heading text-2xl font-black text-white tracking-tight mt-1">
                {user?.stationName || 'Central City Police Station'} — Guestbooks Occupancy Surveillance
              </h2>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">
                Officer In-Charge: <strong>{user?.name || 'Inspector V. K. Sharma'}</strong> | Badge: <strong>{user?.badgeNo || 'POL-INSP-8891'}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            variant="emerald" 
            onClick={handlePrint} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs gap-1.5 shadow-md shadow-emerald-900/40"
          >
            <Printer className="h-4 w-4" /> Export Occupancy Report / Print
          </Button>
        </div>
      </div>

      {/* ── AREA SELECTOR & LIVE OCCUPANCY COMMAND ─────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        
        {/* Area Dropdown Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Jurisdiction Area Selection</span>
              <h3 className="font-heading text-xl font-black text-slate-900">
                Live Guestbooks Occupancy by Area
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl shadow-2xs">
            <label className="text-xs font-bold text-slate-700 pl-2 whitespace-nowrap">Select Area / Ward:</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="h-11 rounded-xl border border-indigo-300 bg-white px-4 text-xs font-black text-indigo-950 shadow-xs outline-none focus:ring-2 focus:ring-indigo-600"
            >
              {areasList.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Area Aggregate Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Guestbooks in Area</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading text-3xl font-black text-slate-900">{totalAreaHotels}</span>
              <span className="text-xs font-bold text-slate-500">Properties</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Under this police station sector</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Room Capacity</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading text-3xl font-black text-slate-900">{totalAreaCapacity}</span>
              <span className="text-xs font-bold text-slate-500">Total Rooms</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Combined rooms across all properties</p>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-white p-5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">Currently Occupied</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading text-3xl font-black text-indigo-950">{totalAreaOccupied}</span>
              <span className="text-xs font-bold text-indigo-600">/ {totalAreaCapacity} Rooms</span>
            </div>
            <p className="text-[11px] text-indigo-500 mt-1 font-semibold">{totalAreaVacant} rooms currently vacant</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Area Occupancy Rate</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`font-heading text-3xl font-black ${
                areaOccupancyRate > 80 ? 'text-rose-600' : areaOccupancyRate > 60 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {areaOccupancyRate}%
              </span>
              <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    areaOccupancyRate > 80 ? 'bg-rose-500' : areaOccupancyRate > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${areaOccupancyRate}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              {areaOccupancyRate > 80 ? 'High area congestion' : areaOccupancyRate > 50 ? 'Moderate activity' : 'Low activity'}
            </p>
          </div>

        </div>

        {/* ── HOTELS IN SELECTED AREA & OCCUPANCY GRID ── */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-heading text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Hotels in {selectedArea === 'ALL' ? 'All Areas' : selectedArea} ({hotels.length} Hotels Listed)
            </h4>
            
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              Live Real-Time Data
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hotels.map((hotel) => {
              const occRate = hotel.occupancyRate || 0;
              const vacant = hotel.vacantRooms !== undefined ? hotel.vacantRooms : Math.max(0, hotel.totalRooms - hotel.occupiedRooms);

              return (
                <div
                  key={hotel.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all relative overflow-hidden space-y-4"
                >
                  {hotel.isLiveSync && (
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1.5 shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> LIVE SYSTEM SYNC
                    </div>
                  )}

                  {/* Hotel Details */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {hotel.propertyType || 'Hotel'}
                      </span>
                      {hotel.starRating && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          {hotel.starRating}
                        </span>
                      )}
                    </div>
                    
                    <h5 className="font-heading font-black text-lg text-slate-900 leading-snug mt-2">
                      {hotel.name}
                    </h5>
                    
                    <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>{hotel.address}</span>
                    </p>
                  </div>

                  {/* Big Occupancy Display */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <BedDouble className="h-4 w-4 text-indigo-600" />
                        Current Occupancy:
                      </span>
                      <span className="font-heading text-lg font-black text-slate-900">
                        {hotel.occupiedRooms} / {hotel.totalRooms} Rooms
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          occRate > 80 ? 'bg-rose-500' : occRate > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occRate}%` }}
                      />
                    </div>

                    {/* Stats Pill Breakdown */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className={`font-black text-sm ${
                        occRate > 80 ? 'text-rose-600' : occRate > 60 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {occRate}% Occupied
                      </span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {vacant} Vacant Rooms
                      </span>
                    </div>
                  </div>

                  {/* Hotel Meta Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" /> {hotel.phone}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Reg: {hotel.regNumber}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
