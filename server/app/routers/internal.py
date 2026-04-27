from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.db import get_db
from app.models_orm import MediaObject, PlantingEvent, VerificationRun
from app.schemas import (
    InternalReverifyResponse,
    InternalVerifyFrameResponse,
    InternalVerifyVideoResponse,
    ModelVerificationSummary,
)
from app.services.detection_dedupe import unique_tree_estimate_center_greedy
from app.services.inference import run_obb_on_image
from app.services.media_inference import (
    is_image_content_type,
    is_video_content_type,
    verification_tuples_for_media,
)
from app.services.storage import download_bytes, ensure_bucket
from app.services.verification import check_metadata, merge_blocks_for_response, policy_passes
from app.services.video_frames import VideoFrameError


def _parse_captured_at_iso(value: str) -> datetime:
    s = value.strip().replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(s)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid captured_at ISO datetime: {value!r}",
        ) from e

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
    block = merge_blocks_for_response(meta, per_image, settings)
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


@router.post(
    "/verify-video",
    response_model=InternalVerifyVideoResponse,
    dependencies=[Depends(require_internal)],
    summary="Stateless ML verification for an uploaded clip (no Postgres write)",
    description=(
        "Multipart: `video` file plus `captured_at` (ISO 8601), `latitude`, `longitude`. "
        "Optional `claimed_tree_count` is accepted for API parity; policy may ignore it. "
        "Returns verification block plus model_version (same logical result as planting submit)."
    ),
)
async def verify_video(
    video: UploadFile = File(..., description="Image or video bytes"),
    captured_at: str = Form(..., description="ISO 8601 capture/upload time (UTC recommended)"),
    latitude: float = Form(...),
    longitude: float = Form(...),
    claimed_tree_count: Optional[int] = Form(
        None,
        description="Optional; reserved for future policy use",
    ),
    settings: Settings = Depends(get_settings),
):
    del claimed_tree_count  # optional field for callers; not used by current policy
    raw = await video.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")
    max_bytes = max(settings.max_video_bytes, settings.max_upload_bytes)
    if len(raw) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds max size ({max_bytes} bytes)",
        )
    ct = (video.content_type or "").split(";")[0].strip().lower() or "application/octet-stream"
    if not is_video_content_type(ct, settings) and not is_image_content_type(ct, settings):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported content type for verification: {ct}",
        )
    cap_dt = _parse_captured_at_iso(captured_at)
    meta = check_metadata(cap_dt, latitude, longitude, settings)
    try:
        tuples = verification_tuples_for_media(raw, ct, 0, settings, meta)
    except VideoFrameError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    block = merge_blocks_for_response(meta, tuples, settings)
    return InternalVerifyVideoResponse(verification=block, model_version=settings.model_version)


@router.post(
    "/verify-frame",
    response_model=InternalVerifyFrameResponse,
    dependencies=[Depends(require_internal)],
    summary="Single image frame for live tree preview (advisory; not a full video verify)",
    description=(
        "Multipart: `image` (JPEG/PNG/WebP) plus `captured_at`, `latitude`, `longitude`. "
        "Lighter than /verify-video; intended for throttled client preview during recording."
    ),
)
async def verify_frame(
    image: UploadFile = File(..., description="One frame, typically JPEG from canvas"),
    captured_at: str = Form(..., description="ISO 8601 (UTC recommended)"),
    latitude: float = Form(...),
    longitude: float = Form(...),
    settings: Settings = Depends(get_settings),
):
    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")
    max_bytes = settings.max_upload_bytes
    if len(raw) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Image exceeds max size ({max_bytes} bytes)",
        )
    ct = (image.content_type or "").split(";")[0].strip().lower() or "application/octet-stream"
    if not is_image_content_type(ct, settings):
        raise HTTPException(
            status_code=400,
            detail="Only image/jpeg, image/png, or image/webp are allowed for verify-frame",
        )
    cap_dt = _parse_captured_at_iso(captured_at)
    meta = check_metadata(cap_dt, latitude, longitude, settings)
    inf = run_obb_on_image(raw, settings)
    unique_est = unique_tree_estimate_center_greedy(
        inf.detections,
        min_confidence=settings.min_tree_confidence,
        center_distance_threshold=settings.dedupe_center_distance,
    )
    passed = policy_passes(inf, meta, settings)
    return InternalVerifyFrameResponse(
        model_version=inf.model_version,
        total_tree_detections=len(inf.detections),
        unique_tree_estimate=unique_est,
        stub=inf.stub,
        metadata=meta,
        aggregate_pass=passed,
    )
