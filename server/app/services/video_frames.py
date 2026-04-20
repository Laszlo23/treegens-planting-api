"""Decode uploaded video bytes and sample JPEG frames for YOLO inference."""

from __future__ import annotations

import tempfile

import cv2
import numpy as np

from app.config import Settings


class VideoFrameError(ValueError):
    """Raised when the video cannot be decoded or violates duration limits."""


def _suffix_for_mime(content_type: str) -> str:
    m = (content_type or "").split(";")[0].strip().lower()
    if m == "video/mp4":
        return ".mp4"
    if m == "video/quicktime":
        return ".mov"
    if m == "video/webm":
        return ".webm"
    return ".mp4"


def sample_frames_from_video_bytes(
    data: bytes,
    content_type: str,
    settings: Settings,
) -> list[tuple[int, bytes]]:
    """
    Sample up to `video_sample_frames` frames evenly across the clip.

    Returns (frame_index_in_source, jpeg_bytes) for each sample.
    """
    if not data:
        raise VideoFrameError("empty video payload")
    suffix = _suffix_for_mime(content_type)
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
        tmp.write(data)
        tmp.flush()
        path = tmp.name
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            raise VideoFrameError("could not open video for decoding")

        fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        if frame_count <= 0:
            cap.release()
            raise VideoFrameError("video has no decodable frames")

        if fps > 0:
            duration = frame_count / fps
        else:
            duration = 0.0
        if duration > settings.video_max_duration_seconds:
            cap.release()
            raise VideoFrameError(
                f"video duration {duration:.1f}s exceeds max "
                f"{settings.video_max_duration_seconds}s"
            )

        n = min(settings.video_sample_frames, frame_count)
        if n <= 0:
            cap.release()
            raise VideoFrameError("no frames to sample")

        indices = np.linspace(0, frame_count - 1, num=n, dtype=int).tolist()
        out: list[tuple[int, bytes]] = []
        for target_idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(target_idx))
            ok, frame = cap.read()
            if not ok or frame is None:
                continue
            enc_ok, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
            if not enc_ok or buf is None:
                continue
            out.append((int(target_idx), buf.tobytes()))

        cap.release()

    if not out:
        raise VideoFrameError("failed to sample any frames from video")
    return out
