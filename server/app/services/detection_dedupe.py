"""Approximate unique tree instances by merging redundant OBBs across sampled frames.

Uses greedy clustering on normalized image-plane centers. Same physical tree can appear
at different positions when the camera pans; this heuristic works best for relatively
stable framing. Not a ground-truth planting count.
"""

from __future__ import annotations

import math

from app.schemas import TreeDetection


def obb_normalized_center(xyxyxyxy: list[float]) -> tuple[float, float]:
    """Centroid of the four corners (normalized 0–1 coordinates)."""
    if len(xyxyxyxy) != 8:
        return 0.5, 0.5
    xs = [xyxyxyxy[i] for i in range(0, 8, 2)]
    ys = [xyxyxyxy[i] for i in range(1, 8, 2)]
    return sum(xs) / 4.0, sum(ys) / 4.0


def unique_tree_estimate_center_greedy(
    detections: list[TreeDetection],
    *,
    min_confidence: float,
    center_distance_threshold: float,
) -> int:
    """
    Sort by confidence (high first). Each detection either starts a new cluster anchor
    or is skipped if its center is within `center_distance_threshold` of an existing
    anchor (Euclidean distance in normalized coords).
    """
    dets = [d for d in detections if d.confidence >= min_confidence]
    dets.sort(key=lambda d: -d.confidence)
    anchors: list[tuple[float, float]] = []
    for d in dets:
        cx, cy = obb_normalized_center(d.xyxyxyxy)
        if any(
            math.hypot(cx - ax, cy - ay) < center_distance_threshold
            for ax, ay in anchors
        ):
            continue
        anchors.append((cx, cy))
    return len(anchors)
