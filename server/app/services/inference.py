"""YOLOv8-OBB inference with versioned model id and configurable thresholds."""

from __future__ import annotations

import io
import os
from dataclasses import dataclass
from typing import Any

import numpy as np
from PIL import Image

from app.config import Settings
from app.schemas import TreeDetection


@dataclass
class InferenceResult:
    model_version: str
    detections: list[TreeDetection]
    raw_summary: dict[str, Any]
    stub: bool


def _image_from_bytes(data: bytes) -> Image.Image:
    return Image.open(io.BytesIO(data)).convert("RGB")


def run_obb_on_image(
    image_bytes: bytes,
    settings: Settings,
) -> InferenceResult:
    path = settings.model_path
    stub = path is None or not os.path.isfile(path)

    if stub:
        return InferenceResult(
            model_version=settings.model_version or "stub-no-weights",
            detections=[],
            raw_summary={
                "reason": "no_model_file",
                "model_path": path,
            },
            stub=True,
        )

    from ultralytics import YOLO  # lazy import

    model = YOLO(path)
    img = _image_from_bytes(image_bytes)
    results = model.predict(source=np.array(img), verbose=False)
    detections: list[TreeDetection] = []
    names = getattr(results[0], "names", {}) or {}

    r0 = results[0] if results else None
    if r0 is not None and r0.obb is not None and r0.obb.xyxyxyxyn is not None:
        obb = r0.obb
        confs = obb.conf.cpu().numpy().tolist() if obb.conf is not None else []
        clss = obb.cls.cpu().numpy().astype(int).tolist() if obb.cls is not None else []
        polys = obb.xyxyxyxyn.cpu().numpy()
        for i in range(len(polys)):
            poly = polys[i].flatten().tolist()
            cid = int(clss[i]) if i < len(clss) else 0
            cf = float(confs[i]) if i < len(confs) else 0.0
            detections.append(
                TreeDetection(
                    confidence=cf,
                    class_id=cid,
                    class_name=names.get(cid, str(cid)),
                    xyxyxyxy=poly,
                )
            )
    elif r0 is not None and r0.boxes is not None and len(r0.boxes) > 0:
        # Fallback: axis-aligned boxes to pseudo-OBB (4 corners of rectangle, normalized)
        b = r0.boxes
        xyn = b.xyxyn.cpu().numpy()
        confs = b.conf.cpu().numpy().tolist() if b.conf is not None else []
        clss = b.cls.cpu().numpy().astype(int).tolist() if b.cls is not None else []
        for i, row in enumerate(xyn):
            x1, y1, x2, y2 = float(row[0]), float(row[1]), float(row[2]), float(row[3])
            poly = [x1, y1, x2, y1, x2, y2, x1, y2]
            cid = int(clss[i]) if i < len(clss) else 0
            cf = float(confs[i]) if i < len(confs) else 0.0
            detections.append(
                TreeDetection(
                    confidence=cf,
                    class_id=cid,
                    class_name=names.get(cid, str(cid)),
                    xyxyxyxy=poly,
                )
            )

    confs_list = [d.confidence for d in detections]
    raw_summary: dict[str, Any] = {
        "num_detections": len(detections),
        "max_confidence": max(confs_list) if confs_list else None,
        "mean_confidence": float(np.mean(confs_list)) if confs_list else None,
    }

    return InferenceResult(
        model_version=settings.model_version,
        detections=detections,
        raw_summary=raw_summary,
        stub=False,
    )
