# Treegens — Mangrove planting proof API

FastAPI service for submitting planting evidence (images or video), server-side YOLOv8-OBB verification, and S3-compatible storage. Includes a Roboflow-exported YOLO OBB dataset for training.

## Quick links

- **API docs** (when running): `/docs` (OpenAPI)
- **Test UI** (dev): `/ui/planting-test`
- **Deploy to a VPS**: [deploy/VPS.md](deploy/VPS.md)
- **Dataset**: [`data.yaml`](data.yaml), `train/` / `valid/` / `test/`

## Run locally (Docker)

```bash
docker compose up -d --build
# API: http://localhost:8000/docs
```

For production-style secrets, copy `docker-compose.override.example.yml` to `docker-compose.override.yml` and set variables in a root `.env` (see [deploy/VPS.md](deploy/VPS.md)).

## Server layout

Application code lives under [`server/`](server/) (FastAPI, Alembic, Dockerfile).
