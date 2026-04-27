# Deploy and integration docs

**Start here for developers:** [DEVELOPER-HANDOFF.md](DEVELOPER-HANDOFF.md) (production API base, Swagger, live `ml-preview`, env vars).

| Document | Purpose |
|----------|---------|
| [DEVELOPER-HANDOFF.md](DEVELOPER-HANDOFF.md) | **API base URL**, Swagger, live ML preview, what to give frontend devs |
| [API-ENDPOINTS-DEV-HANDOFF.md](API-ENDPOINTS-DEV-HANDOFF.md) | **All paths** (`/api/...`, `/health`, `/docs`) |
| [SSH-AUTH-AND-SECRETS.md](SSH-AUTH-AND-SECRETS.md) | **Keys, not passwords**; never commit deploy secrets |
| [SSH-AND-4EVERLAND.md](SSH-AND-4EVERLAND.md) | **Start here if you have a VPS + SSH:** run API + ML on the server, static site on 4everland |
| [4EVERLAND-ENV-CHECKLIST.md](4EVERLAND-ENV-CHECKLIST.md) | **4everland** dashboard: `NEXT_PUBLIC_*` and build settings |
| [caddy/](caddy/) | **Caddy** TLS: [SETUP-DNS-AND-CADDY.md](caddy/SETUP-DNS-AND-CADDY.md), `Caddyfile.api.example` |
| [`../scripts/deploy/install-caddy-ubuntu.sh`](../scripts/deploy/install-caddy-ubuntu.sh) | Run **on the VPS** with `API_HOSTNAME` to install Caddy + `/etc/caddy/Caddyfile` |
| [`../scripts/deploy/`](../scripts/deploy/) | **Rsync** to VPS, **remote** deploy steps (`.env.ssh` gitignored) |
| [SIMPLE-ML-VERIFICATION-RUNBOOK.md](SIMPLE-ML-VERIFICATION-RUNBOOK.md) | **Easiest path:** test live frame ML (`ml-preview`) locally, then 4everland + API URL |
| [4EVERLAND.md](4EVERLAND.md) | **4EVERLAND** static front + where to run Node/FastAPI; full runbook, optional Hosting API for CI |
| [4EVERLAND-API-URL.md](4EVERLAND-API-URL.md) | One-page note: `NEXT_PUBLIC_API_URL` points at your **Node** host, not 4everland static |
| [IPFS-FREENAME-DEPLOY.md](IPFS-FREENAME-DEPLOY.md) | IPFS, what to build (`out/`), Freename, env for static export |
| [VPS.md](VPS.md) | **FastAPI** / Python stack on a VPS, TLS, model volume |
| [API-ENDPOINTS-DEV-HANDOFF.md](API-ENDPOINTS-DEV-HANDOFF.md) | Node API path reference (`/api/...`, `/docs`) |
| [4everland-hosting-api.env.example](4everland-hosting-api.env.example) | Placeholders for optional 4everland **Hosting** REST API tokens (deploy automation) |
| [COUNTTREESAI-SATOSHI.md](COUNTTREESAI-SATOSHI.md) | Optional domain / mint notes when relevant |
| [OPENCLAW.md](OPENCLAW.md) | OpenClaw-related notes if used |

The monorepo root [README.md](../README.md) explains **what runs where** and local tiers (FastAPI, Node, Next).
