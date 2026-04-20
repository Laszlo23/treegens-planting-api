from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.db import get_db
from app.models_orm import MediaObject, PlantingEvent, VerificationRun
from app.schemas import InternalReverifyResponse, ModelVerificationSummary, VerificationBlock
from app.services.media_inference import verification_tuples_for_media
from app.services.storage import download_bytes, ensure_bucket
from app.services.verification import check_metadata, merge_blocks_for_response
from app.services.video_frames import VideoFrameError

router = APIRouter(prefix="/internal", tags=["internal"])


def require_internal(
    x_internal_key: Optional[str] = Header(default=None, alias="X-Internal-Key"),
    settings: Settings = Depends(get_settings),
) -> None:
    expected = settings.internal_api_key
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Internal API not configured",
        )
    if x_internal_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal key"
        )


@router.get("/planting-events/recent", dependencies=[Depends(require_internal)])
def recent_events(
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    ensure_bucket(settings)
    rows = (
        db.query(PlantingEvent)
        .order_by(PlantingEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": str(e.id),
            "user_id": str(e.user_id),
            "status": e.status,
            "created_at": e.created_at.isoformat(),
            "captured_at": e.captured_at.isoformat(),
            "latitude": e.latitude,
            "longitude": e.longitude,
        }
        for e in rows
    ]


@router.post(
    "/planting-events/{event_id}/reverify",
    response_model=InternalReverifyResponse,
    dependencies=[Depends(require_internal)],
)
def reverify(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    ensure_bucket(settings)
    event = db.get(PlantingEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    media_list = (
        db.query(MediaObject)
        .filter(MediaObject.event_id == event_id)
        .order_by(MediaObject.id)
        .all()
    )
    if not media_list:
        raise HTTPException(status_code=400, detail="No media for event")
    meta = check_metadata(
        event.captured_at,
        event.latitude,
        event.longitude,
        settings,
    )
    per_image: list[tuple[ModelVerificationSummary, bool]] = []
    for idx, m in enumerate(media_list):
        raw = download_bytes(settings, m.s3_key)
        try:
            tuples = verification_tuples_for_media(
                raw, m.content_type, idx, settings, meta
            )
        except VideoFrameError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        per_image.extend(tuples)
    block = merge_blocks_for_response(meta, per_image)
    new_status = "accepted" if block.aggregate_pass else "rejected"
    event.status = new_status
    db.add(
        VerificationRun(
            event_id=event.id,
            model_version=settings.model_version,
            passed=block.aggregate_pass,
            result=block.model_dump(mode="json"),
        )
    )
    db.commit()
    return InternalReverifyResponse(event_id=event.id, verification=block)
