from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=320)
    password: str = Field(..., min_length=1, max_length=256)


class PlantingEventPayload(BaseModel):
    """JSON part of multipart submit (field name typically `payload`)."""

    captured_at: datetime
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy_m: Optional[float] = Field(None, ge=0)
    claimed_tree_count: Optional[int] = Field(None, ge=0)
    client_event_id: uuid.UUID
    app_build: Optional[str] = Field(None, max_length=64)
    device_id_hash: Optional[str] = Field(None, max_length=128)


class TreeDetection(BaseModel):
    confidence: float
    class_id: int
    class_name: Optional[str] = None
    xyxyxyxy: list[float] = Field(
        description="Flat 8 coords normalized 0-1 for OBB polygon (YOLO OBB export)"
    )


class ModelVerificationSummary(BaseModel):
    tree_detections: list[TreeDetection]
    confidence_summary: dict[str, Any]
    image_index: Optional[int] = None


class MetadataVerification(BaseModel):
    geo_ok: bool
    time_ok: bool
    geo_message: Optional[str] = None
    time_message: Optional[str] = None


class VerificationBlock(BaseModel):
    model: Optional[ModelVerificationSummary] = None
    metadata: MetadataVerification
    aggregate_pass: bool


class PlantingEventCreateResponse(BaseModel):
    server_event_id: uuid.UUID
    status: str
    verification: VerificationBlock


class InternalReverifyResponse(BaseModel):
    event_id: uuid.UUID
    verification: VerificationBlock


class InternalVerifyVideoResponse(BaseModel):
    """Stateless /internal/verify-video response (includes server model version)."""

    verification: VerificationBlock
    model_version: str


class PlantingEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    server_event_id: uuid.UUID
    status: str
    captured_at: datetime
    latitude: float
    longitude: float
    accuracy_m: Optional[float]
    claimed_tree_count: Optional[int]
    client_event_id: uuid.UUID
    created_at: datetime
    verification: Optional[VerificationBlock] = None
