import React from 'react';
import { User, Users, Clock, Zap, Receipt, KeyRound, Check } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function RoomGrid({ 
  rooms, 
  activeStays, 
  filterFloor, 
  filterStatus, 
  searchQuery, 
  onCheckOut, 
  openExpressModal,
  onRoomStatusChange,
  onViewReceipt 
}) {
  const filteredRooms = rooms.filter(room => {
    if (filterFloor !== 'ALL' && room.floor !== filterFloor) return false;
    if (filterStatus !== 'ALL' && room.status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = room.number.includes(q);
      const matchType = room.type.toLowerCase().includes(q);
      
      const activeStay = activeStays.find(s => s.roomNumber === room.number);
      const matchGuest = activeStay && (
        activeStay.primaryGuest.name.toLowerCase().includes(q) ||
        activeStay.primaryGuest.phone.includes(q)
      );

      return matchNumber || matchType || matchGuest;
    }

    return true;
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredRooms.map((room) => {
        const activeStay = activeStays.find(s => s.roomNumber === room.number);

        return (
          <Card 
            key={room.id} 
            className={`relative overflow-hidden flex flex-col justify-between ${
              room.status === 'OCCUPIED' ? 'border-l-4 border-l-red-500' :
              room.status === 'VACANT' ? 'border-l-4 border-l-emerald-500' :
              room.status === 'CLEANING' ? 'border-l-4 border-l-amber-500' :
              'border-l-4 border-l-slate-400'
            }`}
          >
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
              <div>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">Room {room.number}</span>
                <p className="text-[10px] font-semibold uppercase text-slate-400">{room.floor}</p>
              </div>

              {room.status === 'OCCUPIED' && <Badge variant="destructive">OCCUPIED</Badge>}
              {room.status === 'VACANT' && <Badge variant="success">VACANT</Badge>}
              {room.status === 'CLEANING' && <Badge variant="warning">CLEANING</Badge>}
              {room.status === 'MAINTENANCE' && <Badge variant="secondary">REPAIR</Badge>}
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{room.type}</span>
                <span className="font-bold text-slate-900">₹{room.rate} / night</span>
              </div>

              {room.status === 'OCCUPIED' && activeStay && (
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">{activeStay.primaryGuest.name}</div>
                      <div className="text-[11px] text-slate-500">{activeStay.primaryGuest.phone}</div>
                    </div>
                  </div>

                  {activeStay.accompanyingGuest && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Users className="h-3 w-3" /> Partner: {activeStay.accompanyingGuest.name}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(activeStay.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-semibold text-indigo-600">{activeStay.stayType}</span>
                  </div>
                </div>
              )}

              {room.status === 'VACANT' && (
                <p className="text-xs text-slate-500 py-1">Room is clean and ready for instant check-in.</p>
              )}

              {room.status === 'CLEANING' && (
                <p className="text-xs text-amber-700 py-1 font-medium">Housekeeping in progress. Mark ready when done.</p>
              )}
            </CardContent>

            <CardFooter className="p-4 pt-0">
              {room.status === 'VACANT' && (
                <Button variant="express" className="w-full" onClick={() => openExpressModal(room.number)}>
                  <Zap className="h-4 w-4" /> Express Check-In
                </Button>
              )}

              {room.status === 'OCCUPIED' && activeStay && (
                <div className="flex w-full gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewReceipt(activeStay)}>
                    <Receipt className="h-3.5 w-3.5" /> Slip
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => onCheckOut(activeStay.id)}>
                    <KeyRound className="h-3.5 w-3.5" /> Check Out
                  </Button>
                </div>
              )}

              {room.status === 'CLEANING' && (
                <Button variant="outline" size="sm" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => onRoomStatusChange(room.id, 'VACANT')}>
                  <Check className="h-4 w-4" /> Mark Room Ready
                </Button>
              )}

              {room.status === 'MAINTENANCE' && (
                <Button variant="secondary" size="sm" className="w-full" onClick={() => onRoomStatusChange(room.id, 'VACANT')}>
                  Fix Completed
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
