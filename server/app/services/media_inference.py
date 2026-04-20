"""Run YOLO verification for one stored media blob (image or video)."""

from __future__ import annotations

from app.config import Settings
from app.schemas import MetadataVerification, ModelVerificationSummary
from app.services.inference import run_obb_on_image
from app.services.verification import policy_passes
from app.services.video_frames import sample_frames_from_video_bytes


def is_video_content_type(content_type: str, settings: Settings) -> bool:
    ct = (content_type or "").split(";")[0].strip().lower()
    return ct in settings.allowed_video_content_types


def is_image_content_type(content_type: str, settings: Settings) -> bool:
    ct = (content_type or "").split(";")[0].strip().lower()
    return ct in settings.allowed_image_content_types


def key_suffix_for_content_type(content_type: str) -> str:
    """Filename suffix for S3 keys from MIME type."""
    base = (content_type or "").split(";")[0].strip().lower()
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "video/quicktime": ".mov",
        "video/webm": ".webm",
    }.get(base, ".bin")


def verification_tuples_for_media(
    raw: bytes,
    content_type: str,
    media_index: int,
    settings: Settings,
    meta: MetadataVerification,
) -> list[tuple[ModelVerificationSummary, bool]]:
    """
    Returns one or more (model summary, pass) tuples to merge with merge_blocks_for_response.
    Images: one tuple. Videos: one tuple per sampled frame.
    """
    if is_image_content_type(content_type, settings):
        inf = run_obb_on_image(raw, settings)
        msum = ModelVerificationSummary(
            tree_detections=inf.detections,
            confidence_summary={
                **inf.raw_summary,
                "media_kind": "image",
                "media_index": media_index,
                "stub": inf.stub,
            },
            image_index=media_index,
        )
        return [(msum, policy_passes(inf, meta, settings))]

    if is_video_content_type(content_type, settings):
        frames = sample_frames_from_video_bytes(raw, content_type, settings)
        out: list[tuple[ModelVerificationSummary, bool]] = []
        total = len(frames)
        for fi, (frame_idx, jpeg_bytes) in enumerate(frames):
            inf = run_obb_on_image(jpeg_bytes, settings)
            msum = ModelVerificationSummary(
                tree_detections=inf.detections,
                confidence_summary={
                    **inf.raw_summary,
                    "media_kind": "video",
                    "media_index": media_index,
                    "frame_index": frame_idx,
                    "frame_sample_index": fi,
                    "total_frames_sampled": total,
                    "stub": inf.stub,
                },
                image_index=media_index * 10000 + fi,
            )
            out.append((msum, policy_passes(inf, meta, settings)))
        return out

    raise ValueError(f"unsupported content type for inference: {content_type}")
