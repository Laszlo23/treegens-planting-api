# Treegens API — developer handoff

## Why there is “no URL” in the repo

The app **does not hardcode** a single production API host. The real base URL comes from **environment variables**:

| App | Variable | What it is |
|-----|----------|------------|
| **Next.js (browser)** | `NEXT_PUBLIC_API_URL` | Full origin of the **Node/Express** API, e.g. `https://api.yourcompany.com` or `http://localhost:5000`. **If unset**, the frontend falls back to a **dev default** in code (`treegens-web-main/src/services/axiosInstance.ts` — check that file for the current fallback). |
| **Node → ML service** | `PLANTING_VERIFICATION_API_URL` | Where **FastAPI** runs (often `http://127.0.0.1:8000` on the same server). **Not** used by the browser. |

So **endpoints are paths**; **full URLs** are always:

```text
<NODE_API_BASE> + <PATH>
```

Rules:

- **`NODE_API_BASE`**: scheme + host + optional port, **no trailing slash** (e.g. `https://treegens-be.generalmagic.io` or `http://localhost:5000`).
- **`PATH`**: starts with `/` (e.g. `/api/auth/signin`).

Example: if `NODE_API_BASE` is `http://localhost:5000`, sign-in is  
`http://localhost:5000/api/auth/signin`.

**Swagger (schemas + try-it):** `{NODE_API_BASE}/docs`

---

## Paths only (copy this block — works in any environment)

Use these on top of whatever `NODE_API_BASE` you agree on (local, staging, prod).

### Auth

- `POST /api/auth/challenge`
- `POST /api/auth/signin`
- `GET /api/auth/verify`
- `POST /api/auth/signout`
- `GET /api/auth/me`

### Submissions

- `POST /api/submissions/upload`
- `GET /api/submissions/my-submissions`
- `GET /api/submissions`
- `GET /api/submissions/{submissionId}`
- `POST /api/submissions/{submissionId}/vote`
- `GET /api/submissions/health-checks/moderation`
- `POST /api/submissions/{submissionId}/health-checks`
- `GET /api/submissions/{submissionId}/health-checks`
- `GET /api/submissions/{submissionId}/health-checks/{healthCheckId}`
- `POST /api/submissions/{submissionId}/health-checks/{healthCheckId}/vote`

### Users

- `GET /api/users/me`
- `GET /api/users/me/verifier-warning-banner`
- `PATCH /api/users/me`
- `GET /api/users/leaderboard/trees-planted`
- `POST /api/users/verifier/check`
- `POST /api/users/verifier/request`

### Rewards

- `GET /api/rewards/status/{submissionId}`
- `POST /api/rewards/claim`

### Health / root (no JWT)

- `GET /health`
- `GET /health/pinata-test`
- `GET /`

### Auth header (protected routes)

`Authorization: Bearer <JWT>` (raw JWT without `Bearer` is also accepted by the server.)

---

## What to put in `.env` for the frontend dev

They need **one line** from you (you choose the value):

```bash
NEXT_PUBLIC_API_URL=<NODE_API_BASE>
```

Examples of **valid** `<NODE_API_BASE>` values (pick one that matches where Express actually runs):

- Local: `http://localhost:5000`
- Another machine on LAN: `http://192.168.x.x:5000`
- HTTPS in production: `https://your-api-hostname`

Until that is set to a reachable server, **no** “full URL” is correct for their machine.

---

## ML / FastAPI (backend only — not `NEXT_PUBLIC_*`)

These are **not** browser URLs. The **Node** server calls FastAPI using `PLANTING_VERIFICATION_API_URL`.

- **Internal verify:** `POST {ML_API_BASE}/internal/verify-video` with header `X-Internal-Key: <secret>` (same secret as FastAPI `INTERNAL_API_KEY`).
- **Typical `{ML_API_BASE}`** when Python runs on the same box as Node: `http://127.0.0.1:8000`.
- **Health check (optional):** `GET {ML_API_BASE}/healthz`
- **Swagger:** `GET {ML_API_BASE}/docs`

Replace `{ML_API_BASE}` with whatever host:port actually runs the `server/` FastAPI container.

---

## Multipart vs JSON

- **`POST /api/submissions/upload`** and **`POST /api/submissions/{submissionId}/health-checks`**: `multipart/form-data`, file field **`video`**, plus other form fields — see `{NODE_API_BASE}/docs`.
- Most other endpoints: `application/json`.

---

## Optional: example only (not mandatory)

If your deployment matches the **example** values in `treegens-web-main/.env.example`, then `NODE_API_BASE` might be `https://treegens-be.generalmagic.io` — but that is **only** valid if **your** deployed API really lives there. Same for any VPS IP for ML: only use it if FastAPI is actually exposed there and Node is allowed to reach it.
