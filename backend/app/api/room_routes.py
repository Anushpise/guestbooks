"""
room_routes.py - Multi-Device Room Management & Real-Time Sync API
Synchronizes room statuses (VACANT, OCCUPIED, CLEANING, MAINTENANCE),
tariffs, and inventory across all front desk computers and mobile devices.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import logging
from app.db.database import (
    db_get_rooms,
    db_update_room_status,
    db_update_room_tariff,
    db_add_room
)

logger = logging.getLogger("room_routes")
router = APIRouter(prefix="/api/rooms", tags=["Rooms & Inventory"])

@router.get("")
def list_rooms_endpoint(hotel_id: Optional[str] = Query("HTL-101", description="Hotel ID")):
    """
    Returns all rooms for a hotel from the central database.
    Automatically marks rooms as OCCUPIED if there is an active check-in in guest_records.
    """
    try:
        rooms = db_get_rooms(hotel_id or "HTL-101")
        return {
            "success": True,
            "count": len(rooms),
            "rooms": rooms
        }
    except Exception as e:
        logger.error(f"Error fetching rooms: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

class AddRoomPayload(BaseModel):
    hotel_id: Optional[str] = "HTL-101"
    number: str
    type: Optional[str] = "Standard Suite"
    floor: Optional[str] = "1st Floor"
    rate: Optional[float] = 1500.0

@router.post("")
def add_room_endpoint(payload: AddRoomPayload):
    """Adds a new room to hotel inventory in central DB."""
    try:
        room = db_add_room(payload.hotel_id or "HTL-101", payload.dict())
        return {"success": True, "room": room}
    except ValueError as ve:
        return {"success": False, "message": str(ve)}
    except Exception as e:
        logger.error(f"Error adding room: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

class RoomStatusPayload(BaseModel):
    hotel_id: Optional[str] = "HTL-101"
    status: str

@router.patch("/{room_number}/status")
def update_room_status_endpoint(room_number: str, payload: RoomStatusPayload):
    """Updates status (VACANT, OCCUPIED, CLEANING, MAINTENANCE) for a room."""
    try:
        res = db_update_room_status(payload.hotel_id or "HTL-101", room_number, payload.status)
        return res
    except Exception as e:
        logger.error(f"Error updating room status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

class RoomTariffPayload(BaseModel):
    hotel_id: Optional[str] = "HTL-101"
    rate: float

@router.patch("/{room_number}/tariff")
def update_room_tariff_endpoint(room_number: str, payload: RoomTariffPayload):
    """Updates tariff rate for a room."""
    try:
        res = db_update_room_tariff(payload.hotel_id or "HTL-101", room_number, payload.rate)
        return res
    except Exception as e:
        logger.error(f"Error updating room tariff: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
