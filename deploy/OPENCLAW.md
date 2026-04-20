# OpenClaw and the planting API

The mobile app and training pipeline should use the **planting API** on port 8000 (see `server/app/main.py` and `docker-compose.yml`).

[OpenClaw](https://docs.openclaw.ai/) is an AI gateway (Tools Invoke, OpenResponses, etc.). It is **not** a substitute for large multipart uploads. Use it as an **operator** surface on a **private** bind (loopback or VPN) with strong auth.

## Suggested split

- **Public (phones)**: `https://api.example.com` — reverse proxy (e.g. Caddy) to `uvicorn` on 8000; JWT from `POST /v1/auth/login`.
- **Internal (automation)**: OpenClaw gateway on `127.0.0.1:18789` (example), and register **HTTP tools** that call this repo’s **internal** routes with `X-Internal-Key`:

  - `GET /internal/planting-events/recent?limit=20` — list recent events (JSON).
  - `POST /internal/planting-events/{event_id}/reverify` — re-run YOLO + policy on stored S3 media.

Set `INTERNAL_API_KEY` in the API environment. OpenClaw tool definitions should pass the same value in `X-Internal-Key` (treat as a secret; never ship to the mobile app).

## Example curl (operator host)

```bash
curl -sS -H "X-Internal-Key: $INTERNAL_API_KEY" \
  "http://127.0.0.1:8000/internal/planting-events/recent?limit=5"
```

```bash
curl -sS -X POST -H "X-Internal-Key: $INTERNAL_API_KEY" \
  "http://127.0.0.1:8000/internal/planting-events/$EVENT_ID/reverify"
```

When you install OpenClaw, follow their gateway docs to bind to localhost and enable whichever HTTP APIs you need. Keep the Tools Invoke and OpenResponses endpoints off the public internet.
