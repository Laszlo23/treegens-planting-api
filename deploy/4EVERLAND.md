# 4EVERLAND: static frontend + full stack (Node, optional FastAPI)

[4EVERLAND Hosting](https://docs.4everland.org/hositng/guides/site-deployment) deploys a **built site** to IPFS, Arweave, BNB Greenfield, or the Internet Computer. You configure a **root directory**, **build command**, **output directory** (the compiled frontend), and **environment variables**—then each deployment is synced to the chosen network and served on HTTPS (e.g. `https://<name>.4everland.app`).

**4EVERLAND static Hosting does not run a long‑lived Node/Express or Python process.** The Treegens **Node API** (`treegens-backend-main`) and **FastAPI** verifier (`server/`) must run on a **separate** process-capable host (VPS, Render, Railway, Fly, your own server, etc.). The browser only talks to the **Node** API; Node talks to IPFS (Pinata) and optionally to FastAPI for ML. See the diagram in the root [README.md](../README.md#what-runs-where).

This document is the end-to-end runbook. **Canonical production API URL for static builds (`NEXT_PUBLIC_API_URL`):** [DEVELOPER-HANDOFF.md](DEVELOPER-HANDOFF.md). **4everland dashboard env list:** [4EVERLAND-ENV-CHECKLIST.md](4EVERLAND-ENV-CHECKLIST.md). **If you already have a Linux server over SSH**, the shortest path is [SSH-AND-4EVERLAND.md](SSH-AND-4EVERLAND.md) (API + ML on the VPS, static app on 4everland) plus [SSH-AUTH-AND-SECRETS.md](SSH-AUTH-AND-SECRETS.md) and [`scripts/deploy/`](../scripts/deploy). For Freename / DNS on top of 4everland, see [IPFS-FREENAME-DEPLOY.md](IPFS-FREENAME-DEPLOY.md). For the Python API on a VPS, see [VPS.md](VPS.md). For route paths, see [API-ENDPOINTS-DEV-HANDOFF.md](API-ENDPOINTS-DEV-HANDOFF.md).

---

## Prerequisites

| Need | Why |
|------|-----|
| **MongoDB** | Node API stores users, submissions, etc. Use [Atlas](https://www.mongodb.com/atlas) or a managed/colo database. `MONGODB_URI` in `treegens-backend-main/.env`. |
| **Pinata** (or equivalent) | IPFS uploads. `PINATA_JWT`, `PINATA_GATEWAY_BASE_URL` in Node `.env`. |
| **JWT secret** | `JWT_SECRET` on Node. |
| **(Optional) Redis** | BullMQ workers for rewards/slash. `REDIS_URL` and related in Node `.env`. |
| **(Optional) FastAPI + YOLO** | On‑server ML for uploads and ml-preview. `PLANTING_VERIFICATION_API_URL` and `PLANTING_VERIFICATION_INTERNAL_KEY` (must match FastAPI `INTERNAL_API_KEY`). |
| **Thirdweb / WalletConnect / chain env** | For the Next app, set all `NEXT_PUBLIC_*` in `treegens-web-main/.env` before static build. See `treegens-web-main/.env.example`. |

Local integration tests are in the root [README.md](../README.md) (Tier 0–2).

---

## Step 1 – Deploy the Node API (public HTTPS)

1. **Choose a host** that runs Node 18+ continuously: VPS with Docker/PM2, or a PaaS (Render, Railway, Fly, etc.).
2. **Clone and configure** `treegens-backend-main`: copy `cp .env.example .env` and set at least `MONGODB_URI`, `PINATA_JWT`, `JWT_SECRET`, `PORT` (or platform default), `BACKEND_URL` to the **public origin** the browser will use (e.g. `https://api.yourdomain.com`).
3. **CORS:** the backend uses `cors()` with a permissive default. If you add an allowlist, include the **4everland app origin** (e.g. `https://your-app.4everland.app`) and any custom domain.
4. **Build and run** (typical):
   - `yarn install && yarn build && yarn migrate` (migrations) then `yarn start` (or your platform’s start command for `node dist/server.js`).
5. **ML (optional):** set `PLANTING_VERIFICATION_API_URL` to your FastAPI base (no trailing slash) and `PLANTING_VERIFICATION_INTERNAL_KEY` to match the Python service. Node must reach that URL (private network is fine if only server-side).
6. **Note the public API URL** (e.g. `https://api.example.com`). This becomes `NEXT_PUBLIC_API_URL` in the next step. **It is not** the same as your 4everland static site URL.

**References:** [treegens-backend-main/README.md](../treegens-backend-main/README.md), root README Tier 1.

---

## Step 2 – (Optional) Deploy FastAPI (YOLO verifier)

- From repo root, **Docker Compose** is the fastest path: [README Tier 0](../README.md#tier-0--planting-api-only-fastest-test) and [deploy/VPS.md](VPS.md) for a production-style VPS.
- Point Node’s `PLANTING_VERIFICATION_API_URL` at the FastAPI **internal** or **public** base URL, depending on your network (e.g. `http://127.0.0.1:8000` on the same host behind a reverse proxy).

---

## Step 3 – 4EVERLAND: build and deploy the static Next app

[Build step (hosting.4everland.org)](https://docs.hosting.4everland.org/guide/build.html):

1. **Connect Git** (or upload) the **monorepo**; set **root directory** to `treegens-web-main` (not the repo root—otherwise the build will not see the right `package.json`).
2. **Override build settings** if needed:
   - **Build command:** `yarn install && yarn build:ipfs` (or `STATIC_EXPORT=true yarn build`).
   - **Output directory:** `out` (Next static export).
3. **Environment variables** in the 4everland project (build-time; `NEXT_PUBLIC_*` are inlined):
   - `NEXT_PUBLIC_API_URL` = **URL from Step 1** (HTTPS, no trailing slash).
   - `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, chain/contract `NEXT_PUBLIC_*` as in `treegens-web-main/.env.example`.
   - `NEXT_PUBLIC_NODE_ENV=production` for production builds.
4. **Deploy.** After success, use the project URL (e.g. `https://<name>.4everland.app`) or a [custom domain](https://docs.hosting.4everland.org/guide/domain.html).

**Do not** point `NEXT_PUBLIC_API_URL` at the 4everland static site. That is only the **frontend**; the **API** is on the host from Step 1.

If 4everland can only build from the **repository root**, use CI that runs `cd treegens-web-main && …` and uploads `out/`, or build locally and sync `out/` per [IPFS-FREENAME-DEPLOY.md](IPFS-FREENAME-DEPLOY.md).

**Static export note:** `generateStaticParams` must be non-empty for `output: 'export'`. The app uses placeholders; see `treegens-web-main/src/app/staticExportPlaceholders.ts`.

---

## Step 4 – Verify

1. **Node API:** `curl -sS https://<your-api-origin>/docs` (Swagger) or the health route your `treegens-backend` exposes.
2. **Browser:** open the 4everland app URL. Sign-in and uploads should call `NEXT_PUBLIC_API_URL` (check DevTools → Network).
3. **ML:** after an upload, confirm `mlVerification` (or your API’s fields) when FastAPI and keys are correct.

---

## Optional: 4EVERLAND Hosting API (CI / automation)

4EVERLAND exposes a **REST API** for **managing hosting projects and deployments** (not for executing your business logic):

- Base URL: `https://hosting.api.4everland.org/` (HTTP/1 and HTTP/2 over SSL).
- **Authentication:** create a **Hosting auth token** in the dashboard: **Hosting → Auth token** (store it safely; it may be shown only once). [Hosting API overview](https://docs.4everland.org/hositng/hosting-api)
- **Deploy project:** [Deploy Project API](https://docs.4everland.org/hositng/hosting-api/deploy-project-api) — upload a compressed archive to trigger a deploy for a given project id (see their OpenAPI spec for paths and body).

Use this from GitHub Actions or a script to trigger rebuilds when you do **not** use Git-integrated “deploy on push.” It does not replace running Mongo, Express, or FastAPI.

Example placeholders (copy to your secrets store, not committed):

- See [4everland-hosting-api.env.example](4everland-hosting-api.env.example).

---

## See also

- [deploy/README.md](README.md) — index of deploy docs.
- [4EVERLAND-API-URL.md](4EVERLAND-API-URL.md) — short note on `NEXT_PUBLIC_API_URL` vs 4everland.
