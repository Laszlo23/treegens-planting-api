from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.config import Settings
from app.schemas import (
    MetadataVerification,
    ModelVerificationSummary,
    TreeDetection,
    VerificationBlock,
)
from app.services.detection_dedupe import unique_tree_estimate_center_greedy
from app.services.inference import InferenceResult, run_obb_on_image


def check_metadata(
    captured_at: datetime,
    latitude: float,
    longitude: float,
    settings: Settings,
) -> MetadataVerification:
    now = datetime.now(timezone.utc)
    if captured_at.tzinfo is None:
        captured_aware = captured_at.replace(tzinfo=timezone.utc)
    else:
        captured_aware = captured_at.astimezone(timezone.utc)

    skew = abs((now - captured_aware).total_seconds())
    time_ok = skew <= settings.max_clock_skew_seconds
    time_message = None if time_ok else f"clock_skew_seconds={skew:.0f}"

    geo_ok = True
    geo_message = None
    if settings.geo_min_lat is not None and settings.geo_max_lat is not None:
        if not (settings.geo_min_lat <= latitude <= settings.geo_max_lat):
            geo_ok = False
            geo_message = "latitude_out_of_bounds"
    if settings.geo_min_lon is not None and settings.geo_max_lon is not None:
        if not (settings.geo_min_lon <= longitude <= settings.geo_max_lon):
            geo_ok = False
            geo_message = (geo_message or "") + "_longitude_out_of_bounds"

    return MetadataVerification(
        geo_ok=geo_ok,
        time_ok=time_ok,
        geo_message=geo_message,
        time_message=time_message,
    )


def policy_passes(
    inf: InferenceResult,
    meta: MetadataVerification,
    settings: Settings,
) -> bool:
    if not meta.geo_ok or not meta.time_ok:
        return False

    dets = [d for d in inf.detections if d.confidence >= settings.min_tree_confidence]
    if len(dets) < settings.min_trees_detected:
        return False
    if dets:
        mean_c = sum(d.confidence for d in dets) / len(dets)
        if mean_c < settings.min_mean_confidence:
            return False
    if settings.require_any_high_confidence:
        if not any(d.confidence >= settings.high_confidence_threshold for d in dets):
            return False
    return True


def build_verification_block(
    image_bytes: bytes,
    image_index: Optional[int],
    settings: Settings,
    captured_at: datetime,
    latitude: float,
    longitude: float,
) -> tuple[VerificationBlock, InferenceResult]:
    meta = check_metadata(captured_at, latitude, longitude, settings)
    inf = run_obb_on_image(image_bytes, settings)

    model_summary = ModelVerificationSummary(
        tree_detections=inf.detections,
        confidence_summary={
            **inf.raw_summary,
            "min_tree_confidence_filter": settings.min_tree_confidence,
        },
        image_index=image_index,
    )
    passed = policy_passes(inf, meta, settings)
    block = VerificationBlock(
        model=model_summary,
        metadata=meta,
        aggregate_pass=passed,
    )
    return block, inf


def merge_blocks_for_response(
    metadata: MetadataVerification,
    per_image: list[tuple[ModelVerificationSummary, bool]],
    settings: Settings,
) -> VerificationBlock:
    """metadata is shared; per_image is (model summary, pass for that image)."""
    meta_ok = metadata.geo_ok and metadata.time_ok
    any_model_pass = any(p for _, p in per_image)
    merged_detections: list[TreeDetection] = []
    for m, _ in per_image:
        merged_detections.extend(m.tree_detections)
    unique_est = unique_tree_estimate_center_greedy(
        merged_detections,
        min_confidence=settings.min_tree_confidence,
        center_distance_threshold=settings.dedupe_center_distance,
    )
    merged_summary = {
        "images_evaluated": len(per_image),
        "total_tree_detections": len(merged_detections),
        "unique_tree_estimate": unique_est,
        "dedupe_method": "center_greedy",
        "dedupe_center_distance": settings.dedupe_center_distance,
    }
    return VerificationBlock(
        model=ModelVerificationSummary(
            tree_detections=merged_detections,
            confidence_summary=merged_summary,
            image_index=None,
        ),
        metadata=metadata,
        aggregate_pass=meta_ok and any_model_pass,
    )
