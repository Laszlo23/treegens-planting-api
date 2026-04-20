"""Initial schema: users, planting_events, media_objects, verification_runs

Revision ID: 20250420_0001
Revises:
Create Date: 2025-04-20
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20250420_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_table(
        "planting_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("client_event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("accuracy_m", sa.Float(), nullable=True),
        sa.Column("claimed_tree_count", sa.Integer(), nullable=True),
        sa.Column("app_build", sa.String(64), nullable=True),
        sa.Column("device_id_hash", sa.String(128), nullable=True),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "client_event_id", name="uq_user_client_event"),
    )
    op.create_index("ix_planting_events_user_id", "planting_events", ["user_id"])
    op.create_table(
        "media_objects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("planting_events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("s3_key", sa.String(1024), nullable=False),
        sa.Column("content_type", sa.String(128), nullable=False),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("sha256_hex", sa.String(64), nullable=False),
    )
    op.create_index("ix_media_objects_event_id", "media_objects", ["event_id"])
    op.create_table(
        "verification_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("planting_events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("model_version", sa.String(128), nullable=False),
        sa.Column("passed", sa.Boolean(), nullable=False),
        sa.Column("result", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("media_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media_objects.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_verification_runs_event_id", "verification_runs", ["event_id"])


def downgrade() -> None:
    op.drop_index("ix_verification_runs_event_id", table_name="verification_runs")
    op.drop_table("verification_runs")
    op.drop_index("ix_media_objects_event_id", table_name="media_objects")
    op.drop_table("media_objects")
    op.drop_index("ix_planting_events_user_id", table_name="planting_events")
    op.drop_table("planting_events")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
