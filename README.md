# Treegens planting stack

Monorepo for **mangrove planting proof**: a **FastAPI** service (YOLOv8-OBB video verification + Postgres + S3-compatible storage), a **Node/Express** API (MongoDB, IPFS via Pinata, calls the FastAPI verifier), and a **Next.js** web app.

Use this document to run everything locally or on a cloud VPS and to run a **minimal smoke test** before wiring the full app.

## Table of contents

1. [What runs where](#what-runs-where)
2. [Repository layout](#repository-layout)
3. [Prerequisites](#prerequisites)
4. [Tier 0 — Planting API only (fastest test)](#tier-0--planting-api-only-fastest-test)
5. [Tier 1 — Node backend + MongoDB + planting API](#tier-1--node-backend--mongodb--planting-api)
6. [Tier 2 — Next.js frontend](#tier-2--nextjs-frontend)
7. [Deploying to a cloud server](#deploying-to-a-cloud-server)
8. [Environment variables (cheat sheet)](#environment-variables-cheat-sheet)
9. [Developer verification checklist](#developer-verification-checklist)
10. [Troubleshooting](#troubleshooting)

---

## What runs where

```mermaid
flowchart LR
  subgraph browser [Browser]
    Web[Next.js app]
  end
  subgraph node [Node API]
    BE[Express + MongoDB]
  end
  subgraph py [Python API]
    API[FastAPI + YOLO]
  end
  Web -->|HTTPS JWT uploads| BE
  BE -->|IPFS| Pinata[Pinata IPFS]
  BE -->|POST /internal/verify-video| API
  API -->|optional| S3[MinIO or S3]
  API -->|optional| PG[(Postgres)]
```

- **Browser** talks only to the **Node** API (`NEXT_PUBLIC_API_URL`), not to the Python service directly.
- **Node** uploads media to IPFS, then calls **FastAPI** `POST /internal/verify-video` with the video bytes and GPS/time metadata. The shared secret is `X-Internal-Key` (must match on both sides).
- **FastAPI** runs YOLO (when `MODEL_PATH` points to weights) and returns `verification` JSON including `aggregate_pass` and `model.confidence_summary` (e.g. `unique_tree_estimate`). Node stores the full payload on the clip; the upload response and submission views expose summary fields to the client.

---

## Repository layout

| Path | Role |
|------|------|
| [`server/`](server/) | FastAPI app, Alembic migrations, Dockerfile |
| [`docker-compose.yml`](docker-compose.yml) | Postgres + MinIO + `api` (dev defaults) |
| [`docker-compose.override.example.yml`](docker-compose.override.example.yml) | Production-style secrets + **model mount** |
| [`treegens-backend-main/`](treegens-backend-main/) | Node API, Swagger, Mongo migrations |
| [`treegens-backend-main/docker-compose-local.yml`](treegens-backend-main/docker-compose-local.yml) | Local Mongo + backend container |
| [`treegens-web-main/`](treegens-web-main/) | Next.js frontend |
| [`deploy/VPS.md`](deploy/VPS.md) | Detailed VPS runbook for the **Python** stack only |
| [`scripts/smoke-test.sh`](scripts/smoke-test.sh) | Curl health checks against the FastAPI service |

---

## Prerequisites

- **Docker** + Docker Compose v2 (for Tier 0 and recommended DBs).
- **Node 20+** and **Yarn** (for Node and Next dev servers).
- **Python 3.11+** (optional — only if you run FastAPI outside Docker).
- A **YOLO OBB weights** file (e.g. `best.pt`) if you want real detections; otherwise the API may run in a limited/stub mode depending on config.

---

## Tier 0 — Planting API only (fastest test)

Goal: prove **FastAPI** is healthy and that **`/internal/verify-video`** works with a sample video.

### 1. Start the stack

From the **repository root**:

```bash
docker compose up -d --build
```

- API: `http://127.0.0.1:8000`
- OpenAPI: `http://127.0.0.1:8000/docs`

### 2. Health checks

```bash
./scripts/smoke-test.sh
# or
curl -sS http://127.0.0.1:8000/healthz
curl -sS http://127.0.0.1:8000/readyz
```

### 3. Test internal video verification

The internal route expects header `X-Internal-Key` equal to `INTERNAL_API_KEY` (default in compose: `internal-dev-key`).

Copy [`server/.env.example`](server/.env.example) to `server/.env` if you run tooling outside Docker; inside compose the key is already set in [`docker-compose.yml`](docker-compose.yml).

Run the bundled script **on the host** (after installing dependencies):

```bash
cd server && python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export INTERNAL_API_KEY=internal-dev-key   # must match docker-compose.yml api environment
python scripts/verify_video_fixture.py /path/to/sample.mp4 --base-url http://127.0.0.1:8000
```

Or run a **one-off** API container with your video mounted (same Docker network as the running `api` service):

```bash
# From repo root; put sample.mp4 in the current directory
docker compose run --rm -v "$PWD:/work" api \
  python scripts/verify_video_fixture.py /work/sample.mp4 --base-url http://api:8000
```

`INTERNAL_API_KEY` is picked up from the Compose file; add `--key` if you override the key.

You should see HTTP 200 and JSON with `verification.aggregate_pass` and nested `model.confidence_summary` (including `unique_tree_estimate` when the model runs).

### 4. Real YOLO weights on Docker

Default compose does **not** mount weights. For production-like runs:

```bash
cp docker-compose.override.example.yml docker-compose.override.yml
# Place weights at ./models/best.pt (or set MODEL_HOST_PATH in .env)
mkdir -p models
# copy your best.pt into models/
```

Set in `.env` (repo root, next to compose):

```bash
POSTGRES_PASSWORD=...
MINIO_ROOT_PASSWORD=...
JWT_SECRET=...
INTERNAL_API_KEY=your-long-random-internal-key
MODEL_HOST_PATH=./models/best.pt
MODEL_VERSION=1.0.0
```

Then `docker compose up -d --build` again. See **[deploy/VPS.md](deploy/VPS.md)** for firewall and TLS notes.

---

## Tier 1 — Node backend + MongoDB + planting API

Goal: **upload flow** hits IPFS and **ML verification** with the same secret as FastAPI.

### 1. Keep Tier 0 running

FastAPI must be reachable from the machine where Node runs (e.g. `http://127.0.0.1:8000` or a private Docker network).

### 2. Configure Node (`treegens-backend-main`)

```bash
cd treegens-backend-main
cp .env.example .env
```

Edit `.env`:

| Variable | Example | Notes |
|----------|---------|--------|
| `MONGODB_URI` | `mongodb://admin:password@localhost:27017/treegens?authSource=admin` | Match your Mongo |
| `PINATA_JWT` | from Pinata | Required for IPFS upload |
| `PINATA_GATEWAY_BASE_URL` | `https://gateway.pinata.cloud/ipfs` | |
| `JWT_SECRET` | long random string | Node JWT |
| `PLANTING_VERIFICATION_API_URL` | `http://127.0.0.1:8000` | No trailing slash |
| `PLANTING_VERIFICATION_INTERNAL_KEY` | same as FastAPI `INTERNAL_API_KEY` | **Must match** or you get 401 |
| `PLANTING_VERIFICATION_ENABLED` | `true` | Optional; if unset, ML runs only when URL + key are both set |
| `PLANTING_VERIFICATION_TIMEOUT_MS` | `180000` | Increase if ffmpeg/YOLO is slow |

### 3. Start Mongo + API (easy path)

```bash
cd treegens-backend-main
docker compose -f docker-compose-local.yml up -d
# install deps and run API on host against the same Mongo port
yarn install
yarn build
yarn migrate
yarn dev
# listens on PORT from .env (default 5000)
```

Swagger is typically at `http://localhost:5000/api-docs` (see `treegens-backend-main` README).

### 4. Verify ML integration

Upload a land/plant clip via the Node upload endpoint (authenticated). In responses, `mlVerification` should include `aggregatePass`, `modelVersion`, and after a successful verifier run: `uniqueTreeEstimate`, `totalTreeDetections`, `imagesEvaluated` (parsed from stored FastAPI `result.model.confidence_summary`).

---

## Tier 2 — Next.js frontend

```bash
cd treegens-web-main
cp .env.example .env.local
```

Set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000   # your Node API URL (HTTPS in production)
```

```bash
yarn install
yarn dev
# open http://localhost:3000
```

The browser **never** sends the internal FastAPI key; it only calls the Node API.

---

## Deploying to a cloud server

High-level checklist:

1. **VPS**: Docker installed; firewall allows SSH + public ports you need (e.g. 443 for Nginx/Caddy, or 8000 for quick tests only).
2. **FastAPI**: follow **[deploy/VPS.md](deploy/VPS.md)** — clone repo, `.env`, `docker-compose.override.yml`, model file, `docker compose up -d --build`.
3. **Node**: run in Docker or PM2; set `PLANTING_VERIFICATION_API_URL` to the **internal** URL of FastAPI (e.g. `http://127.0.0.1:8000` if on the same host behind reverse proxy).
4. **MongoDB**: managed Atlas or a container with persistent volume; URI in `MONGODB_URI`.
5. **Frontend**: build with `yarn build`, run `yarn start`, or deploy to Vercel/static host with `NEXT_PUBLIC_API_URL` pointing to your **public** Node URL.

Never expose `INTERNAL_API_KEY` / `PLANTING_VERIFICATION_INTERNAL_KEY` to clients.

---

## Environment variables (cheat sheet)

### FastAPI (`server/`, Docker `api` service)

| Variable | Purpose |
|----------|---------|
| `INTERNAL_API_KEY` | `X-Internal-Key` for `/internal/*` |
| `MODEL_PATH` | Path inside container (default `/models/best.pt`) |
| `MODEL_VERSION` | Reported to clients |
| `ENABLE_PLANTING_TEST_UI` | `true` enables `/ui/planting-test` (turn off in prod) |

See [`server/.env.example`](server/.env.example) for YOLO thresholds and limits.

### Node (`treegens-backend-main`)

| Variable | Purpose |
|----------|---------|
| `PLANTING_VERIFICATION_API_URL` | Base URL of FastAPI |
| `PLANTING_VERIFICATION_INTERNAL_KEY` | Must equal FastAPI `INTERNAL_API_KEY` |
| `PLANTING_VERIFICATION_TIMEOUT_MS` | Client timeout for verify call |

See [`treegens-backend-main/.env.example`](treegens-backend-main/.env.example).

### Next (`treegens-web-main`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Public Node API base URL |

See [`treegens-web-main/.env.example`](treegens-web-main/.env.example).

---

## Developer verification checklist

Run these before treating an environment as production-ready:

| Step | Command / action |
|------|------------------|
| Compose file valid | From repo root: `docker compose config -q` |
| FastAPI image builds | `docker compose build api` (first build downloads PyTorch; allow several minutes) |
| FastAPI up + health | `docker compose up -d` then `./scripts/smoke-test.sh` |
| Node API compiles | `cd treegens-backend-main && MONGODB_URI='mongodb://127.0.0.1:27017/test' PINATA_JWT='x' yarn build` |
| Node unit tests | `cd treegens-backend-main && yarn test` — defaults `MONGODB_URI` to `mongodb://127.0.0.1:27017/test` on macOS/Linux (override if needed). On Windows CMD, set `MONGODB_URI` manually before `yarn test` |
| Next.js production build | `cd treegens-web-main && yarn build` — works without `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` thanks to a build placeholder in [`treegens-web-main/src/config/thirdwebConfig.ts`](treegens-web-main/src/config/thirdwebConfig.ts); **set a real Thirdweb Client ID** for live wallet features |

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `401` on `/internal/verify-video` | `PLANTING_VERIFICATION_INTERNAL_KEY` ≠ `INTERNAL_API_KEY` |
| `0` detections / stub behaviour | `MODEL_PATH` not mounted or file missing; check compose override |
| Node uploads succeed but no ML fields | `PLANTING_VERIFICATION_*` unset; or verifier error stored in `mlVerification.error` |
| Timeouts | Increase `PLANTING_VERIFICATION_TIMEOUT_MS`; ensure CPU can run ffmpeg + YOLO |
| `next build` failed with Thirdweb “clientId must be provided” | Fixed by placeholder in `thirdwebConfig.ts`; pull latest or set `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` |
| `yarn test` fails: missing `MONGODB_URI` | Export `MONGODB_URI` (any URI string is enough for unit tests that only import config) |
| `yarn build` in backend fails on `.test.ts` | Production `tsc` excludes `src/**/*.test.ts`; use `yarn build` not `tsc` including tests |
| Database errors in FastAPI | `DATABASE_URL` must match Postgres credentials (host `db` inside Compose) |

---

## More links

- **Roboflow / dataset**: [`data.yaml`](data.yaml), [`README.roboflow.txt`](README.roboflow.txt)
- **Python API docs** (when running): `/docs`
- **OpenClaw / other deploy notes**: [`deploy/OPENCLAW.md`](deploy/OPENCLAW.md)
