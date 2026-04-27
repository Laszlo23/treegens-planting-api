# Run these **on the VPS** (after `rsync-to-vps.sh` or `git pull`)

All paths assume the monorepo lives at `$REMOTE_DIR` (e.g. `/root/treegens-app`). Use **separate** secret files on the server (never commit them).

## 1. FastAPI (Docker)

```bash
cd /root/treegens-app
cp docker-compose.override.example.yml docker-compose.override.yml
# Create .env in this directory for compose — see deploy/VPS.md
docker compose up -d --build
curl -sS http://127.0.0.1:8000/healthz
```

## 2. Node API (Express)

```bash
cd /root/treegens-app/treegens-backend-main
cp .env.example .env
# Edit .env: MONGODB_URI, PINATA_JWT, JWT_SECRET, BACKEND_URL=https://your.api.host
# PLANTING_VERIFICATION_API_URL=http://127.0.0.1:8000
# PLANTING_VERIFICATION_INTERNAL_KEY= same as FastAPI INTERNAL_API_KEY
corepack enable 2>/dev/null || true
yarn install
yarn build
yarn migrate
```

Run with [PM2](https://pm2.keymetrics.io/) (install `npm i -g pm2` if needed):

```bash
pm2 start dist/server.js --name treegens-api
pm2 save
pm2 startup
```

Check: `curl -sS http://127.0.0.1:5000/health`

## 3. Caddy (HTTPS in front of Node)

**Full walkthrough (DNS A record, UFW, verify):** [deploy/caddy/SETUP-DNS-AND-CADDY.md](../../deploy/caddy/SETUP-DNS-AND-CADDY.md)

**On Ubuntu, from repo path on the server:**

```bash
export API_HOSTNAME=api.yourdomain.com
sudo -E bash scripts/deploy/install-caddy-ubuntu.sh
```

Or copy [deploy/caddy/Caddyfile.api.example](../../deploy/caddy/Caddyfile.api.example) manually; see [deploy/caddy/README.md](../../deploy/caddy/README.md). Then: `curl -sS https://YOUR_API_HOST/health`

## 4. 4everland (from your machine or CI)

In the 4everland project: root `treegens-web-main`, build `yarn install && yarn build:ipfs`, output `out`, and set all `NEXT_PUBLIC_*` (see [deploy/4EVERLAND-ENV-CHECKLIST.md](../../deploy/4EVERLAND-ENV-CHECKLIST.md)), especially `NEXT_PUBLIC_API_URL=https://YOUR_API_HOST` (no trailing slash).

## Security

[deploy/SSH-AUTH-AND-SECRETS.md](../../deploy/SSH-AUTH-AND-SECRETS.md)
