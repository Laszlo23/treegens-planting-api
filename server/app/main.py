from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app import __version__
from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.limiter import limiter
from app.routers import auth, dev_ui, health, internal, planting


@asynccontextmanager
async def lifespan(app: FastAPI):
    import app.models_orm  # noqa: F401 - register models

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        auth.ensure_seed_user(db)
    finally:
        db.close()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        lifespan=lifespan,
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(dev_ui.router)
    app.include_router(auth.router)
    app.include_router(planting.router)
    app.include_router(internal.router)
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
