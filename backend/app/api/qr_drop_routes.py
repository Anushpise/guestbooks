"""
qr_drop_routes.py - Front-Desk QR Standee & Mobile Guest Document Drop Relay
Allows hotel guests to scan a physical counter standee QR code with their mobile phone,
upload their identity documents (Primary & Partner), and have them instantly stream into
the receptionist's New Check-In screen without requiring any app install or guest login.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
import time
from datetime import datetime
import socket
import logging

logger = logging.getLogger("qr_drop_routes")
router = APIRouter(prefix="/api/qr-drop", tags=["QR Document Drop"])

# In-memory storage for ephemeral drops (auto-cleaned after 1 hour)
_ephemeral_drops: Dict[str, Dict[str, Any]] = {}

def get_local_lan_ip() -> str:
    """Detect outward-facing LAN IP on local Wi-Fi / Ethernet"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.2)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "127.0.0.1"

def cleanup_old_drops():
    """Removes drops older than 60 minutes to maintain memory hygiene"""
    cutoff = time.time() - 3600
    to_delete = [k for k, v in _ephemeral_drops.items() if v.get("timestamp", 0) < cutoff]
    for k in to_delete:
        del _ephemeral_drops[k]

class DropUploadPayload(BaseModel):
    hotelId: str
    guestName: Optional[str] = ""
    guestPhone: Optional[str] = ""
    primaryFront: str  # Base64 data URL
    primaryBack: Optional[str] = None
    partnerFront: Optional[str] = None
    partnerBack: Optional[str] = None

@router.post("/upload")
def upload_guest_documents_drop(payload: DropUploadPayload):
    """
    Public endpoint: Guest uploads their ID documents from mobile phone after scanning QR.
    Stores the drop ephemerally so the hotel reception screen can retrieve and OCR it.
    """
    try:
        cleanup_old_drops()
        drop_id = f"DRP-{uuid.uuid4().hex[:8].upper()}"
        
        drop_record = {
            "dropId": drop_id,
            "hotelId": payload.hotelId.strip(),
            "guestName": payload.guestName.strip() if payload.guestName else "",
            "guestPhone": payload.guestPhone.strip() if payload.guestPhone else "",
            "primaryFront": payload.primaryFront,
            "primaryBack": payload.primaryBack,
            "partnerFront": payload.partnerFront,
            "partnerBack": payload.partnerBack,
            "createdAt": datetime.now().isoformat(),
            "timestamp": time.time(),
            "consumed": False
        }
        
        _ephemeral_drops[drop_id] = drop_record
        logger.info(f"New QR Document Drop [{drop_id}] received for hotel: {payload.hotelId}")
        
        return {
            "success": True,
            "dropId": drop_id,
            "message": "Documents sent successfully to hotel reception desk."
        }
    except Exception as e:
        logger.error(f"Error saving QR drop: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest/{hotel_id}")
def get_latest_hotel_drop(hotel_id: str):
    """
    Reception polling endpoint: Checks if any guest just dropped documents
    for this specific hotel within the last 15 minutes.
    """
    cleanup_old_drops()
    target_hid = hotel_id.strip()
    fifteen_mins_ago = time.time() - 900
    
    # Filter unconsumed drops for this hotel
    matching = [
        drop for drop in _ephemeral_drops.values()
        if drop.get("hotelId") == target_hid
        and not drop.get("consumed", False)
        and drop.get("timestamp", 0) >= fifteen_mins_ago
    ]
    
    if not matching:
        return {
            "success": True,
            "hasDrop": False,
            "drop": None
        }
    
    # Sort by newest timestamp
    matching.sort(key=lambda d: d.get("timestamp", 0), reverse=True)
    latest_drop = matching[0]
    
    return {
        "success": True,
        "hasDrop": True,
        "drop": latest_drop
    }

@router.post("/consume/{drop_id}")
def mark_drop_consumed(drop_id: str):
    """
    Marks a drop as consumed once the reception check-in form loads and starts OCR.
    Prevents duplicate processing.
    """
    if drop_id in _ephemeral_drops:
        _ephemeral_drops[drop_id]["consumed"] = True
        logger.info(f"QR Document Drop [{drop_id}] marked as consumed.")
        return {"success": True, "dropId": drop_id, "consumed": True}
    return {"success": False, "message": "Drop not found or expired"}

@router.get("/network-info")
def get_network_info():
    """
    Returns server local LAN IP so reception can generate QR codes
    reachable from smartphone cameras on the local Wi-Fi.
    """
    lan_ip = get_local_lan_ip()
    return {
        "success": True,
        "localIp": lan_ip,
        "hostname": socket.gethostname()
    }
