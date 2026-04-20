#!/usr/bin/env python3
"""
Offline sweep of confidence thresholds for YOLO-OBB (or box fallback) on a labeled test split.

Expects `--data-root` to contain `test/images` and `test/labels` (YOLO OBB .txt per image).
If `test/images` is empty, add images or point `--data-root` at a full export.

Usage:
  pip install -r server/requirements.txt
  python scripts/eval_thresholds.py --weights path/to/best.pt --data-root /path/to/dataset
"""
from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from pathlib import Path
from typing import List, Optional

import numpy as np


def _count_gt_labels(label_path: Path) -> int:
    if not label_path.is_file():
        return 0
    n = 0
    for line in label_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            n += 1
    return n


def _load_image_paths(image_dir: Path) -> List[Path]:
    exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    if not image_dir.is_dir():
        return []
    return sorted(p for p in image_dir.iterdir() if p.suffix.lower() in exts)


def _metrics_at_threshold(confs: Optional[np.ndarray], thr: float) -> int:
    if confs is None or len(confs) == 0:
        return 0
    return int(np.sum(confs >= thr))


def main() -> int:
    p = argparse.ArgumentParser(description="Sweep detection thresholds on test split")
    p.add_argument(
        "--data-root",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="Dataset root containing test/images and test/labels",
    )
    p.add_argument(
        "--weights",
        type=Path,
        required=True,
        help="Path to YOLO .pt weights",
    )
    p.add_argument(
        "--thresholds",
        type=str,
        default="0.1,0.15,0.2,0.25,0.3,0.35,0.4,0.5,0.6,0.7",
        help="Comma-separated min confidence values to try",
    )
    args = p.parse_args()
    if not args.weights.is_file():
        print("Weights not found:", args.weights, file=sys.stderr)
        return 1

    image_dir = args.data_root / "test" / "images"
    label_dir = args.data_root / "test" / "labels"
    image_paths = _load_image_paths(image_dir)
    if not image_paths:
        print(
            f"No images under {image_dir}. Add test/images to run evaluation.",
            file=sys.stderr,
        )
        return 2

    from ultralytics import YOLO

    model = YOLO(str(args.weights))
    thrs = [float(x) for x in args.thresholds.split(",") if x.strip()]

    summary: dict[float, dict[str, int]] = defaultdict(
        lambda: {"tp": 0, "images_with_any_det": 0}
    )

    n_gt_total = 0
    for im in image_paths:
        label_path = label_dir / (im.stem + ".txt")
        gt = _count_gt_labels(label_path)
        if gt > 0:
            n_gt_total += 1
        r0 = model.predict(source=str(im), verbose=False)[0]
        confs: Optional[np.ndarray] = None
        if r0.obb is not None and r0.obb.conf is not None:
            confs = r0.obb.conf.cpu().numpy()
        elif r0.boxes is not None and r0.boxes.conf is not None:
            confs = r0.boxes.conf.cpu().numpy()

        for thr in thrs:
            s = summary[thr]
            dets = _metrics_at_threshold(confs, thr)
            if dets > 0:
                s["images_with_any_det"] += 1
            if gt > 0 and dets > 0:
                s["tp"] += 1

    n = len(image_paths)
    print(
        f"images={n}, images_with_gt_labels={n_gt_total}, "
        f"data_root={args.data_root}, weights={args.weights}\n"
    )
    print(f"{'thr':>6}  {'P(any det)':>12}  {'sens@img (gt)':>14}")
    for thr in thrs:
        s = summary[thr]
        p_any = (s["images_with_any_det"] / n) if n else 0.0
        sens = (s["tp"] / n_gt_total) if n_gt_total else 0.0
        print(f"{thr:6.2f}  {p_any:12.2%}  {sens:14.2%}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
