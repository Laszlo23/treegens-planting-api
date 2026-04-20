from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app import __version__
router = APIRouter(tags=["health"])


@router.get("/healthz")
def healthz():
    return {"status": "ok"}


@router.get("/readyz")
def readyz():
    from sqlalchemy.orm import Session

    def _check(db: Session) -> bool:
        db.execute(text("SELECT 1"))
        return True

    # Avoid coupling route signature to get_db in odd ways; use explicit session
    from app.db import SessionLocal

    db = SessionLocal()
    try:
        _check(db)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="database not ready"
        ) from None
    finally:
        db.close()
    return {"status": "ready", "database": "ok"}


@router.get("/version")
def version_info():
    return {"version": __version__}
