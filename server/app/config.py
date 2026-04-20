from __future__ import annotations

from functools import lru_cache
from typing import FrozenSet, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Mangrove Planting Proof API"
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/planting",
        description="SQLAlchemy URL, e.g. postgresql+psycopg://user:pass@host:5432/db",
    )
    jwt_secret: str = Field(default="change-me-in-production", min_length=16)
    jwt_algorithm: str = "HS256"
    jwt_exp_minutes: int = 60 * 24 * 7  # 7 days

    # S3-compatible object storage
    s3_endpoint_url: Optional[str] = Field(
        default="http://localhost:9000",
        description="Set to None for AWS S3 default endpoint",
    )
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "planting-media"
    s3_region: str = "us-east-1"
    s3_use_ssl: bool = False
    s3_path_style: bool = True  # required for MinIO

    # Inference
    model_path: Optional[str] = Field(
        default=None,
        description="Path to .pt weights; if unset or missing, verification uses stub mode",
    )
    model_version: str = "unconfigured"
    min_tree_confidence: float = 0.25
    min_trees_detected: int = 1
    min_mean_confidence: float = 0.0
    require_any_high_confidence: bool = True
    high_confidence_threshold: float = 0.5
    max_clock_skew_seconds: int = 300
    max_upload_bytes: int = 15 * 1024 * 1024
    max_images_per_event: int = 10
    allowed_image_content_types: FrozenSet[str] = Field(
        default=frozenset({"image/jpeg", "image/png", "image/webp"})
    )

    # Video uploads (either images or videos per event, not both)
    max_video_bytes: int = 200 * 1024 * 1024
    max_videos_per_event: int = 3
    video_sample_frames: int = 12
    video_max_duration_seconds: float = 120.0
    allowed_video_content_types: FrozenSet[str] = Field(
        default=frozenset({"video/mp4", "video/quicktime", "video/webm"})
    )

    # Geo: optional WGS84 bounding box; if set, point must be inside
    geo_min_lat: Optional[float] = None
    geo_max_lat: Optional[float] = None
    geo_min_lon: Optional[float] = None
    geo_max_lon: Optional[float] = None

    # Auth bootstrap (dev)
    seed_user_email: Optional[str] = None
    seed_user_password: Optional[str] = None

    # Internal / OpenClaw-style operator API
    internal_api_key: Optional[str] = Field(
        default=None,
        description="If set, required for /internal/* routes",
    )

    # Dev: browser test page at GET /ui/planting-test (disable in production)
    enable_planting_test_ui: bool = True

    # Roboflow (optional; for future scripts / integrations — not used by inference by default)
    # Env: ROBOFLOW_API_KEY, ROBOFLOW_PUBLISH_API_KEY
    roboflow_api_key: Optional[str] = None
    roboflow_publish_api_key: Optional[str] = None

    # Rate limits (per minute)
    rate_limit_per_ip: str = "60/minute"
    rate_limit_auth: str = "30/minute"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_postgres_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg://", 1)
        if v.startswith("postgresql://") and "+psycopg" not in v:
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
