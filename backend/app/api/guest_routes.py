"""
guest_routes.py - API Endpoints for Guest Check-In & Sequential Record Archival
Handles storing check-in records, uploaded document images (front/back), and digital signatures.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Any
import logging
from app.db.database import (
    create_guest_record,
    get_all_guest_records,
    get_guest_record_by_id,
    checkout_guest_in_db
)

logger = logging.getLogger("guest_routes")
router = APIRouter(prefix="/api/guests", tags=["Guests"])

class CheckInPayload(BaseModel):
    roomNumber: str
    stayType: Optional[str] = "24 Hours Full Stay"
    roomRate: Optional[float] = 0.0
    advancePaid: Optional[float] = 0.0
    paymentMode: Optional[str] = "Cash"
    comingFrom: Optional[str] = ""
    goingTo: Optional[str] = ""
    purpose: Optional[str] = ""
    vehicleNo: Optional[str] = ""
    primaryGuest: dict
    accompanyingGuest: Optional[Any] = None
    documentFront: Optional[str] = None
    documentBack: Optional[str] = None
    signature: Optional[str] = None
    hotelId: Optional[str] = "HTL-101"

@router.post("/checkin")
def checkin_guest_endpoint(payload: CheckInPayload):
    """
    Saves a complete guest check-in into the sequential database.
    Assigns sequential registration number (REG-0001, REG-0002...).
    Stores front/back document images and guest signature.
    """
    try:
        data = payload.dict()
        record = create_guest_record(data)
        logger.info(f"Check-in successfully saved: Reg No {record.get('reg_no')} for Room {record.get('room_number')} Hotel {record.get('hotel_id')}")
        return {
            "success": True,
            "message": f"Guest checked in successfully with registration #{record.get('reg_no')}",
            "record": record
        }
    except Exception as e:
        logger.error(f"Error during check-in: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/records")
def list_guest_records(
    search: Optional[str] = Query(None, description="Search by name, phone, reg_no, room"),
    hotel_id: Optional[str] = Query(None, description="Filter by hotel ID"),
    limit: int = 100,
    offset: int = 0
):
    """Returns sequential list of all guest check-in records."""
    try:
        records = get_all_guest_records(search=search, hotel_id=hotel_id, limit=limit, offset=offset)
        return {
            "success": True,
            "count": len(records),
            "records": records
        }
    except Exception as e:
        logger.error(f"Error fetching guest records: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/records/{record_id}")
def get_single_record(record_id: int):
    """Returns full details of a guest record including document photos and digital signature."""
    record = get_guest_record_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Guest record not found")
    return {
        "success": True,
        "record": record
    }

class CheckOutPayload(BaseModel):
    checkout_signature: Optional[str] = None
    signature: Optional[str] = None

@router.post("/checkout/{room_or_id}")
def checkout_guest_endpoint(room_or_id: str, payload: Optional[CheckOutPayload] = None):
    """Marks a guest record as checked out, saving digital checkout signature if provided."""
    sig = None
    if payload:
        sig = payload.checkout_signature or payload.signature
    success = checkout_guest_in_db(room_or_id, checkout_signature=sig)
    if not success:
        return {"success": False, "message": "No active record found for checkout"}
    return {"success": True, "message": f"Guest {room_or_id} marked as checked out", "has_signature": bool(sig)}
