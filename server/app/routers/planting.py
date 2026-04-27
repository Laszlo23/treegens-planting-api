from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import Settings, get_settings
from app.db import get_db
from app.limiter import limiter
from app.models_orm import MediaObject, PlantingEvent, User, VerificationRun
from app.schemas import (
    PlantingEventCreateResponse,
    PlantingEventPayload,
    PlantingEventRead,
    ModelVerificationSummary,
    VerificationBlock,
)
from app.services.media_inference import (
    key_suffix_for_content_type,
    verification_tuples_for_media,
)
from app.services.storage import ensure_bucket, upload_bytes
from app.services.verification import check_metadata, merge_blocks_for_response
from app.services.video_frames import VideoFrameError

router = APIRouter(prefix="/v1/planting-events", tags=["planting"])

_CREATE_PLANTING_DOC = """
Submit planting proof as **either** photos **or** videos (not both in one request).

- **payload**: JSON string matching `PlantingEventPayload` (captured_at, GPS, client_event_id, …).
- **images**: one or more image files (`image/jpeg`, `image/png`, `image/webp`), max size per file from `max_upload_bytes` (default 15MB), up to `max_images_per_event`.
- **videos**: one or more video files (`video/mp4`, `video/quicktime`, `video/webm`), max size per file from `max_video_bytes` (default 200MB), up to `max_videos_per_event`. Videos are stored in full; the server samples frames for YOLO verification.

Omit the field you are not using (or send an empty list only for the unused field — send **exactly one** non-empty list).
"""


def _read_upload_limit(file: UploadFile, max_bytes: int, kind: str) -> bytes:
    data = file.file.read()
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"{kind} too large (max {max_bytes} bytes)",
        )
    return data


@router.post(
    "",
    response_model=PlantingEventCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create planting event (images or videos)",
    description=_CREATE_PLANTING_DOC,
)
@limiter.limit("60/minute")
async def create_planting_event(
    request: Request,
    payload: str = Form(..., description="JSON string: PlantingEventPayload"),
    images: Optional[List[UploadFile]] = File(
        None, description="Photo files (mutually exclusive with videos)"
    ),
    videos: Optional[List[UploadFile]] = File(
        None, description="Video files (mutually exclusive with images)"
    ),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    ensure_bucket(settings)
    body = PlantingEventPayload.model_validate_json(payload)
    img_list = list(images or [])
    vid_list = list(videos or [])
    has_img = len(img_list) > 0
    has_vid = len(vid_list) > 0
    if has_img == has_vid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Send exactly one of: non-empty `images` or non-empty `videos`",
        )
    if has_img and len(img_list) > settings.max_images_per_event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many images for one event",
        )
    if has_vid and len(vid_list) > settings.max_videos_per_event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many videos for one event",
        )

    existing = (
        db.query(PlantingEvent)
        .filter(
            PlantingEvent.user_id == user.id,
            PlantingEvent.client_event_id == body.client_event_id,
        )
        .first()
    )
    if existing:
        vr = (
            db.query(VerificationRun)
            .filter(VerificationRun.event_id == existing.id)
            .order_by(VerificationRun.created_at.desc())
            .first()
        )
        if not vr or not vr.result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Idempotent event missing verification",
            )
        block = VerificationBlock.model_validate(vr.result)
        resp = PlantingEventCreateResponse(
            server_event_id=existing.id,
            status=existing.status,
            verification=block,
        )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=resp.model_dump(mode="json"),
        )

    meta = check_metadata(
        body.captured_at,
        body.latitude,
        body.longitude,
        settings,
    )
    per_image: List[tuple[ModelVerificationSummary, bool]] = []
    event = PlantingEvent(
        user_id=user.id,
        client_event_id=body.client_event_id,
        captured_at=body.captured_at,
        latitude=body.latitude,
        longitude=body.longitude,
        accuracy_m=body.accuracy_m,
        claimed_tree_count=body.claimed_tree_count,
        app_build=body.app_build,
        device_id_hash=body.device_id_hash,
        status="pending",
    )
    db.add(event)
    db.flush()

    uploads = img_list if has_img else vid_list
    allowed = (
        settings.allowed_image_content_types
        if has_img
        else settings.allowed_video_content_types
    )
    max_bytes = settings.max_upload_bytes if has_img else settings.max_video_bytes
    kind_label = "Image" if has_img else "Video"

    for idx, upload in enumerate(uploads):
        ct = (upload.content_type or "").split(";")[0].strip().lower()
        if ct not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported content type for this request: {upload.content_type}",
            )
        raw = _read_upload_limit(upload, max_bytes, kind_label)
        sha256_hex = hashlib.sha256(raw).hexdigest()
        suf = key_suffix_for_content_type(ct)
        key = f"planting/{event.id}/{idx}_{sha256_hex[:12]}{suf}"
        upload_bytes(settings, key, raw, upload.content_type or "application/octet-stream")
        m = MediaObject(
            event_id=event.id,
            s3_key=key,
            content_type=upload.content_type or ("image/jpeg" if has_img else "video/mp4"),
            byte_size=len(raw),
            sha256_hex=sha256_hex,
        )
        db.add(m)
        db.flush()
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
    final_status = "accepted" if block.aggregate_pass else "rejected"
    event.status = final_status
    rv = VerificationRun(
        event_id=event.id,
        model_version=settings.model_version,
        passed=block.aggregate_pass,
        result=block.model_dump(mode="json"),
    )
    db.add(rv)
    db.commit()
    db.refresh(event)

    return PlantingEventCreateResponse(
        server_event_id=event.id,
        status=event.status,
        verification=block,
    )


@router.get("/{event_id}", response_model=PlantingEventRead)
@limiter.limit("60/minute")
def get_planting_event(
    request: Request,
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    event = db.get(PlantingEvent, event_id)
    if not event or event.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    vr = (
        db.query(VerificationRun)
        .filter(VerificationRun.event_id == event.id)
        .order_by(VerificationRun.created_at.desc())
        .first()
    )
    vblock = VerificationBlock.model_validate(vr.result) if vr and vr.result else None
    return PlantingEventRead(
        server_event_id=event.id,
        status=event.status,
        captured_at=event.captured_at,
        latitude=event.latitude,
        longitude=event.longitude,
        accuracy_m=event.accuracy_m,
        claimed_tree_count=event.claimed_tree_count,
        client_event_id=event.client_event_id,
        created_at=event.created_at,
        verification=vblock,
    )


@router.get("", response_model=List[PlantingEventRead])
@limiter.limit("60/minute")
def list_planting_events(
    request: Request,
    since: Optional[datetime] = Query(
        default=None, description="Return events with created_at >= since (ISO8601)"
    ),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(PlantingEvent).filter(PlantingEvent.user_id == user.id)
    if since is not None:
        if since.tzinfo is None:
            since = since.replace(tzinfo=timezone.utc)
        q = q.filter(PlantingEvent.created_at >= since)
    events = q.order_by(PlantingEvent.created_at.desc()).limit(200).all()
    out: List[PlantingEventRead] = []
    for event in events:
        vr = (
            db.query(VerificationRun)
            .filter(VerificationRun.event_id == event.id)
            .order_by(VerificationRun.created_at.desc())
            .first()
        )
        vblock = VerificationBlock.model_validate(vr.result) if vr and vr.result else None
        out.append(
            PlantingEventRead(
                server_event_id=event.id,
                status=event.status,
                captured_at=event.captured_at,
                latitude=event.latitude,
                longitude=event.longitude,
                accuracy_m=event.accuracy_m,
                claimed_tree_count=event.claimed_tree_count,
                client_event_id=event.client_event_id,
                created_at=event.created_at,
                verification=vblock,
            )
        )
    return out
