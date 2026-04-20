"""Optional dev-only HTML test UI (guarded by settings)."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.config import Settings, get_settings

router = APIRouter(include_in_schema=False)

_STATIC = Path(__file__).resolve().parent.parent.parent / "static" / "planting_test.html"


@router.get("/ui/planting-test")
def planting_test_page(settings: Settings = Depends(get_settings)):
    if not settings.enable_planting_test_ui:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if not _STATIC.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test UI file missing on server",
        )
    return FileResponse(_STATIC, media_type="text/html; charset=utf-8")
