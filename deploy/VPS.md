# Deploy Treegens planting API on a VPS

This runbook deploys the stack from the repo root [`docker-compose.yml`](../docker-compose.yml) (Postgres, MinIO, API) to a Linux host. Example host IP used in docs: `72.62.48.212` — replace with your server.

**Do not commit** `.env`, `docker-compose.override.yml`, SSH keys, or API passwords. Rotate any secret that was ever shared in chat.

## Suggested server layout

```text
/root/treegens-app/
  docker-compose.yml
  docker-compose.override.yml    # copy from docker-compose.override.example.yml (gitignored)
  server/
  .env                             # required for override: secrets for Compose interpolation
```

See [`docker-compose.override.example.yml`](../docker-compose.override.example.yml) in the repo root.

## Prerequisites on the VPS

1. **Docker Engine** and **Docker Compose plugin** (v2). See [Docker Engine install](https://docs.docker.com/engine/install/) for your distro.
2. **Copy the project** into `/root/treegens-app` (or `/opt/treegens-app`):
   - From your laptop: `rsync -avz --exclude '.venv' --exclude '__pycache__' ./ user@72.62.48.212:/root/treegens-app/`
   - Or `git clone` if the repository is hosted remotely.

## Production configuration

1. Copy the example override (secrets via environment):

   ```bash
   cd /root/treegens-app
   cp docker-compose.override.example.yml docker-compose.override.yml
   ```

2. Create a **`.env`** file in the **same directory** as `docker-compose.yml` (Compose loads it automatically for variable substitution). Set strong values — see [Environment variables](#environment-variables).

   Minimum idea:

   ```bash
   POSTGRES_PASSWORD=your-long-random-postgres-password
   MINIO_ROOT_USER=minio
   MINIO_ROOT_PASSWORD=your-long-random-minio-password
   JWT_SECRET=your-32-char-minimum-secret-string
   SEED_USER_EMAIL=you@example.com
   SEED_USER_PASSWORD=your-seed-user-password
   INTERNAL_API_KEY=your-internal-key
   ```

3. **Do not** bind Postgres or MinIO to the public internet in production without a firewall. The default `docker-compose.yml` publishes `5432`, `9000`, `9001` — the example override can restrict this (see example file comments).

## Firewall

Allow only what you need:

```bash
# Example: UFW — allow SSH and API HTTP
ufw allow OpenSSH
ufw allow 8000/tcp
ufw enable
ufw status
```

For production, prefer **Nginx** (or Caddy) on `80`/`443` and proxy to `127.0.0.1:8000`, then `ufw allow 80,443/tcp` and drop direct `8000` from the internet.

## Start

```bash
cd /root/treegens-app
docker compose up -d --build
docker compose ps
docker compose logs -f api
```

## Verify

On the server:

```bash
curl -sS http://127.0.0.1:8000/healthz
curl -sS http://127.0.0.1:8000/readyz
```

From your laptop (if firewall allows `8000`):

- OpenAPI: `http://72.62.48.212:8000/docs`
- Test UI (if enabled): `http://72.62.48.212:8000/ui/planting-test`

Set `ENABLE_PLANTING_TEST_UI=false` in production if you do not want the browser test page exposed.

## Environment variables

Values are read by **Compose** (substitution in `docker-compose.override.example.yml`) and/or by the **API container** (Pydantic `Settings` in [`server/app/config.py`](../server/app/config.py)). Use the **API env var names** in the `api.environment` section of the override file.

| Variable | Used by | Purpose |
|----------|---------|---------|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `db` service | Postgres credentials |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | `minio` service | MinIO root user |
| `DATABASE_URL` | API | Must match Postgres user/password/host (`db:5432` inside Compose) |
| `JWT_SECRET` | API | Signing key for JWT (min 16 chars in app settings) |
| `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` | API | First-run seed user for `/v1/auth/login` |
| `INTERNAL_API_KEY` | API | `X-Internal-Key` for `/internal/*` |
| `S3_ENDPOINT_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | API | Point to MinIO (`http://minio:9000`) with same creds as MinIO |
| `MODEL_PATH`, `MODEL_VERSION` | API | Optional YOLO weights |
| `ENABLE_PLANTING_TEST_UI` | API | `true`/`false` for `/ui/planting-test` |
| `ROBOFLOW_API_KEY`, `ROBOFLOW_PUBLISH_API_KEY` | API | Optional; reserved for Roboflow workflows (not used by inference unless you add integration) |

## Roboflow

The API does **not** call Roboflow automatically. Store keys in the API environment if you plan to use the [Roboflow Python SDK](https://docs.roboflow.com/) for dataset/model workflows or future features. Mount a weights file and set `MODEL_PATH` for local YOLO inference.

## Troubleshooting

- **API not reachable from outside:** check UFW/cloud security group allows the port; check `docker compose ps` and `docker compose logs api`.
- **Database connection errors:** ensure `DATABASE_URL` password matches `POSTGRES_PASSWORD` and uses hostname `db` inside the stack.
- **MinIO errors:** ensure `S3_ACCESS_KEY` / `S3_SECRET_KEY` match MinIO root credentials in the override.
