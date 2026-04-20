from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, hash_password, verify_password
from app.config import get_settings
from app.db import get_db
from app.limiter import limiter
from app.models_orm import User
from app.schemas import LoginRequest, TokenResponse

router = APIRouter(prefix="/v1/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("30/minute")
def login(
    request: Request,
    body: LoginRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(str(user.id), get_settings())
    return TokenResponse(access_token=token)


def ensure_seed_user(db: Session) -> None:
    s = get_settings()
    if not s.seed_user_email or not s.seed_user_password:
        return
    existing = db.query(User).filter(User.email == s.seed_user_email).first()
    if existing:
        return
    db.add(
        User(
            email=s.seed_user_email,
            password_hash=hash_password(s.seed_user_password),
        )
    )
    db.commit()
