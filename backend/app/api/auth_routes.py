"""
auth_routes.py - Multi-Device Central Authentication & Hotel Management API
Ensures that hotel registrations, admin approvals, police accounts, and user credentials
are shared across all PCs, mobile devices, and browser sessions in real-time via the central database.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Any
import logging
from app.db.database import (
    db_register_hotel,
    db_get_all_hotels,
    db_get_hotel,
    db_update_hotel_status,
    db_login_user,
    db_get_all_police,
    db_create_police_account,
    db_get_stats
)

logger = logging.getLogger("auth_routes")
router = APIRouter(prefix="/api/auth", tags=["Authentication & Hotel Management"])

class HotelRegisterPayload(BaseModel):
    hotelName: str
    ownerName: Optional[str] = ""
    email: str
    phone: Optional[str] = ""
    password: str
    address: Optional[str] = ""
    area: Optional[str] = "Metro Division Sector 4"
    propertyType: Optional[str] = "Hotel / Lodge Stay"
    subscriptionPlan: Optional[str] = "Guestbooks Standard Plan (₹499/month)"
    subscriptionAmount: Optional[float] = 499.0
    totalRooms: Optional[int] = 15
    documents: Optional[List[Any]] = None

@router.post("/register-hotel")
def register_hotel_endpoint(payload: HotelRegisterPayload):
    """
    Submits a hotel registration to the central database.
    Status is set to PENDING for Super Admin verification.
    """
    try:
        data = payload.dict()
        hotel = db_register_hotel(data)
        return {
            "success": True,
            "message": "Hotel registration submitted successfully! Awaiting Super Admin document approval.",
            "hotel": hotel
        }
    except ValueError as ve:
        return {"success": False, "message": str(ve)}
    except Exception as e:
        logger.error(f"Error registering hotel: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hotels")
def get_all_hotels_endpoint():
    """
    Returns all registered hotels from the central DB.
    Allows PC2 Super Admin to view pending requests made from PC1 in real-time.
    """
    try:
        hotels = db_get_all_hotels()
        return {
            "success": True,
            "count": len(hotels),
            "hotels": hotels
        }
    except Exception as e:
        logger.error(f"Error fetching hotels: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hotels/{hotel_id}")
def get_hotel_endpoint(hotel_id: str):
    """Returns details for a single hotel."""
    hotel = db_get_hotel(hotel_id)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return {"success": True, "hotel": hotel}

class HotelStatusPayload(BaseModel):
    hotelId: str
    status: str # 'APPROVED' or 'REJECTED'

@router.post("/hotel-status")
def update_hotel_status_endpoint(payload: HotelStatusPayload):
    """
    Super Admin endpoint to approve or reject hotel registrations in central DB.
    """
    try:
        updated = db_update_hotel_status(payload.hotelId, payload.status)
        return {
            "success": True,
            "message": f"Hotel {payload.hotelId} status updated to {payload.status}",
            "hotel": updated
        }
    except Exception as e:
        logger.error(f"Error updating hotel status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

class LoginPayload(BaseModel):
    credential: str
    password: str

@router.post("/login")
def login_endpoint(payload: LoginPayload):
    """
    Authenticates user across any PC against the central database.
    """
    try:
        res = db_login_user(payload.credential, payload.password)
        return res
    except Exception as e:
        logger.error(f"Error logging in user: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

class PoliceAccountPayload(BaseModel):
    stationName: str
    officerName: str
    email: str
    username: str
    password: str
    badgeNo: Optional[str] = None
    jurisdiction: Optional[str] = "Metro Division 4"

@router.get("/police")
def get_all_police_endpoint():
    """Returns all registered police station accounts."""
    try:
        accounts = db_get_all_police()
        return {
            "success": True,
            "count": len(accounts),
            "policeAccounts": accounts
        }
    except Exception as e:
        logger.error(f"Error fetching police accounts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/police")
def create_police_endpoint(payload: PoliceAccountPayload):
    """Super Admin creates a new police department account."""
    try:
        data = payload.dict()
        account = db_create_police_account(data)
        return {
            "success": True,
            "message": "Police account created successfully.",
            "policeAccount": account
        }
    except ValueError as ve:
        return {"success": False, "message": str(ve)}
    except Exception as e:
        logger.error(f"Error creating police account: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_system_stats_endpoint():
    """Returns system-wide stats for dashboard overview."""
    try:
        stats = db_get_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
