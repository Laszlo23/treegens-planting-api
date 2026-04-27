# Your SSH server + 4everland (simple picture)

**Security and automation:** [SSH-AUTH-AND-SECRETS.md](SSH-AUTH-AND-SECRETS.md) (use SSH keys, rotate leaked passwords). **Rsync from your laptop:** [`scripts/deploy/rsync-to-vps.sh`](../scripts/deploy/rsync-to-vps.sh) + [`scripts/deploy/REMOTE-DEPLOY-STEPS.md`](../scripts/deploy/REMOTE-DEPLOY-STEPS.md). **DNS A record + UFW + Caddy (you must do DNS in the registrar UI):** [caddy/SETUP-DNS-AND-CADDY.md](caddy/SETUP-DNS-AND-CADDY.md) and [`install-caddy-ubuntu.sh`](../scripts/deploy/install-caddy-ubuntu.sh). **Caddy / TLS file in repo:** [caddy/Caddyfile.api.example](caddy/Caddyfile.api.example) and [caddy/README.md](caddy/README.md). **4everland build env table:** [4EVERLAND-ENV-CHECKLIST.md](4EVERLAND-ENV-CHECKLIST.md).

- **4everland** = only the **website** (the Next app built to `out/`). You point it at your Git repo and it builds the static files.
- **The server you SSH into** = where **the Node API** and **the Python ML API** run. The website on 4everland calls that server over the internet.

You cannot put Node + Python *inside* 4everland. You *can* do everything on one Linux box you log into with SSH.

---

## Before you start (two URLs)

1. **Site URL** — from 4everland after deploy, e.g. `https://mytreegens.4everland.app`  
2. **API URL** — your **server**, with **HTTPS**, e.g. `https://api.yourdomain.com` (see below).  
   The static build must use **`NEXT_PUBLIC_API_URL=https://api.yourdomain.com`** (the API URL, not the 4everland site URL).

**Why HTTPS on the API?** 4everland serves your app over **https**. Browsers block **http** API calls from an https page (mixed content). So your public Node API should be behind HTTPS.

---

## Part 1 — On your Linux server (SSH)

### 1) Log in

```bash
ssh you@YOUR_SERVER_IP
```

### 2) Install Docker (if not already)

Use [Docker’s install guide](https://docs.docker.com/engine/install/) for Ubuntu/Debian, then:

```bash
docker compose version
```

### 3) Put the project on the server

```bash
cd ~
git clone <YOUR_MONOREPO_URL> treegens-app
cd treegens-app
```

(Or `rsync` from your laptop if the repo is not online.)

### 4) Start the **Python / ML** API (FastAPI)

```bash
cd ~/treegens-app
cp docker-compose.override.example.yml docker-compose.override.yml
# edit .env next to docker-compose.yml — see deploy/VPS.md for POSTGRES, INTERNAL_API_KEY, etc.
docker compose up -d --build
```

Check inside the server:

```bash
curl -sS http://127.0.0.1:8000/healthz
```

Leave this running. The Node app will call **only** this internal address, not the public internet: `http://127.0.0.1:8000`.

### 5) Start the **Node** API (Express)

```bash
cd ~/treegens-app/treegens-backend-main
cp .env.example .env
```

Edit `.env` (use `nano` or `vim`):

| Variable | Example |
|----------|--------|
| `MONGODB_URI` | Your MongoDB (Atlas is fine) |
| `PINATA_JWT` | From Pinata |
| `JWT_SECRET` | Long random string |
| `PLANTING_VERIFICATION_API_URL` | `http://127.0.0.1:8000` |
| `PLANTING_VERIFICATION_INTERNAL_KEY` | **Same** as `INTERNAL_API_KEY` in the Python container |
| `BACKEND_URL` | `https://api.yourdomain.com` (your public API URL, after TLS) |
| `PORT` | `5000` |

Then:

```bash
corepack enable 2>/dev/null; yarn install
yarn build
yarn migrate
```

Run it with a process manager so it restarts on reboot, e.g. **PM2**:

```bash
npm i -g pm2
pm2 start dist/server.js --name treegens-api
pm2 save
pm2 startup
```

Check: `curl -sS http://127.0.0.1:5000/health` (or open `/docs` in curl from the server).

### 6) Public **HTTPS** for the Node port (Caddy, easiest with a domain)

Point a **DNS A record** for `api.yourdomain.com` to your server’s public IP. Then install [Caddy](https://caddyserver.com/docs/install) and use the copy-paste file in the repo: [deploy/caddy/Caddyfile.api.example](caddy/Caddyfile.api.example) (see [deploy/caddy/README.md](caddy/README.md) for `validate` and `reload`).

Example (same as the file in repo):

```caddy
api.yourdomain.com {
  reverse_proxy 127.0.0.1:5000
}
```

```bash
sudo systemctl reload caddy
```

Open **firewall** only what you need: `80`, `443`, and `22` (SSH). Do not expose `8000` to the world if the ML API is only for localhost.

Test from your **laptop**:

```bash
curl -sS https://api.yourdomain.com/health
```

If that works, your **public API base** is `https://api.yourdomain.com` (no trailing slash).

**No domain?** You still need a **https** public URL for the API so the 4everland app can call it. Options: get a free/cheap domain and point A-record to the VPS, or use a service that gives you an HTTPS URL (e.g. Cloudflare Tunnel) — the important part is **https** + stable hostname.

---

## Part 2 — On 4everland (only the static site)

1. In [4everland Hosting](https://www.4everland.org/), create/import a project from **Git** (or upload).
2. Set **root directory** to: `treegens-web-main`
3. **Build command:** `yarn install && yarn build:ipfs` (or `STATIC_EXPORT=true yarn build`)
4. **Output directory:** `out`
5. **Environment variables** — full table: [4EVERLAND-ENV-CHECKLIST.md](4EVERLAND-ENV-CHECKLIST.md). Minimum: **`NEXT_PUBLIC_API_URL=https://api.yourdomain.com`**

6. Deploy. Open your `https://….4everland.app` site. Sign in and use flows; the browser will call your **SSH server** API.

---

## Checklist (tick when done)

- [ ] FastAPI up on the server (`docker compose`, port 8000 to localhost)  
- [ ] Node up on 5000, `PLANTING_VERIFICATION_*` matches Python  
- [ ] Caddy (or Nginx) gives **https://api.…** → Node  
- [ ] 4everland build has `NEXT_PUBLIC_API_URL` = that **https** API URL  
- [ ] CORS: default Node `cors()` usually enough; if you lock origins, add your `https://….4everland.app`

---

## If something fails

| Symptom | Check |
|--------|--------|
| Browser shows CORS or network error to API | API URL in build is **https** and **exact** origin; server reachable from internet |
| Mixed content | API must be **https**, not `http://IP:5000` from an https 4everland page |
| ML preview 401 | Same user JWT; Node and Python internal keys match |
| ML always fails | `curl` `http://127.0.0.1:8000/healthz` **on the server**; then Node `.env` `PLANTING_VERIFICATION_API_URL` |

Deeper detail: [4EVERLAND.md](4EVERLAND.md), [VPS.md](VPS.md) (Python + firewall), [SIMPLE-ML-VERIFICATION-RUNBOOK.md](SIMPLE-ML-VERIFICATION-RUNBOOK.md) (test same stack on laptop first).
