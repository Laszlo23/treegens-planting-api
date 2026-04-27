# Developer handoff — API, live ML preview, 4everland

Use this as the **single entry point** for app developers. Path reference: [API-ENDPOINTS-DEV-HANDOFF.md](API-ENDPOINTS-DEV-HANDOFF.md). Deep deploy: [4EVERLAND.md](4EVERLAND.md), [SSH-AND-4EVERLAND.md](SSH-AND-4EVERLAND.md).

## Current production Node API (browser / `NEXT_PUBLIC_API_URL`)

| | |
|---|---|
| **Base URL** | `https://tree.buildingculture.capital` |
| **No trailing slash** | Use as `NEXT_PUBLIC_API_URL` in 4everland and local `.env` for production builds. |
| **Health** | `GET https://tree.buildingculture.capital/health` |
| **Swagger** | `https://tree.buildingculture.capital/docs` |
| **CORS** | Backend allows browser origins by default; use HTTPS for the static site. |

For **another environment**, replace the host above with your own `NODE_API_BASE` everywhere.

---

## Copy-paste base for URLs

```text
NODE_API_BASE=https://tree.buildingculture.capital
```

Every browser-facing API path is:

```text
<NODE_API_BASE><PATH>
```

Examples:

- Sign-in challenge: `POST https://tree.buildingculture.capital/api/auth/challenge`
- Upload video: `POST https://tree.buildingculture.capital/api/submissions/upload`
- **Live frame preview (during recording):** `POST https://tree.buildingculture.capital/api/submissions/ml-preview`  
  - `multipart/form-data`, image field + auth JWT (see Swagger).

---

## Live “on the fly” planting / tree verification (recording)

The web app sends **JPEG frames** while the user records; the Node API proxies to FastAPI for an **advisory** count (full proof is still the uploaded video).

| Step | Where |
|------|--------|
| Browser → Node | `POST /api/submissions/ml-preview` (authenticated, rate-limited) |
| Node → ML service | `POST /internal/verify-frame` on FastAPI (`PLANTING_VERIFICATION_*` on server only) |

Frontend uses [`treegens-web-main/src/services/mlPreviewService.ts`](../treegens-web-main/src/services/mlPreviewService.ts).  
**Developers never need the FastAPI URL** in the Next app — only `NEXT_PUBLIC_API_URL` (Node).

Local testing: [SIMPLE-ML-VERIFICATION-RUNBOOK.md](SIMPLE-ML-VERIFICATION-RUNBOOK.md).

---

## Environment variables developers need

### Next.js (build time for 4everland / static export)

Minimum:

- `NEXT_PUBLIC_API_URL=https://tree.buildingculture.capital`

See [treegens-web-main/.env.example](../treegens-web-main/.env.example) and [4EVERLAND-ENV-CHECKLIST.md](4EVERLAND-ENV-CHECKLIST.md) for Thirdweb, WalletConnect, contracts.

### Not in the browser (server only)

- `PLANTING_VERIFICATION_API_URL` — FastAPI base (e.g. `http://127.0.0.1:8000` on the VPS)
- `PLANTING_VERIFICATION_INTERNAL_KEY` — must match FastAPI `INTERNAL_API_KEY`
- `PINATA_JWT`, `MONGODB_URI`, etc. — see `treegens-backend-main/.env.example`

---

## Quick verification

```bash
curl -sS https://tree.buildingculture.capital/health
curl -sS https://tree.buildingculture.capital/docs
```

Expect health JSON with `"status":"OK"` when Mongo + Pinata are configured on the server.
