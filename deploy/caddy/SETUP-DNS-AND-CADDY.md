# DNS + Caddy (you run this — we cannot log into your accounts)

I do **not** have access to your domain registrar, DNS host, or VPS. This page is a **checklist** you follow in the browser and over SSH from **your** machine.

## What you need

- A **domain** you control (e.g. `myproject.com` from Namecheap, Cloudflare, Google Domains, etc.).
- Your VPS **public IPv4** (e.g. from your provider’s dashboard, or on the server: `curl -4 ifconfig.me`).

## Step 1 — Create the API hostname in DNS

Point a **subdomain** for the API at your server’s IP, for example `api.yourdomain.com`.

1. Open your DNS / registrar (Cloudflare, Namecheap, Route 53, …).
2. Add an **A record**:
   - **Name / Host:** `api` (or full `api.yourdomain.com` — depends on the UI; the result must resolve to the API host only).
   - **Value / Points to:** your VPS public IPv4.
   - **TTL:** 300 s (or automatic).

3. Wait for propagation. Check from your laptop:

   ```bash
   dig +short api.yourdomain.com
   # should show your server IP
   ```

If you use **Cloudflare** “orange cloud” proxy: HTTPS still works; Caddy can obtain certs (sometimes you need the DNS record **DNS only** for first issuance — if Let’s Encrypt fails, try “grey cloud” for `api` until the cert is issued, then re-enable proxy if you want).

## Step 2 — Firewall on the VPS

Allow SSH, HTTP, HTTPS (as root or with sudo):

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

Do **not** expose the FastAPI port (8000) to the public internet; it should stay on `127.0.0.1` only. Node on `127.0.0.1:5000` is also not opened to the world — Caddy talks to it locally.

## If Nginx already uses ports 80 and 443

**Do not** run Caddy on the same machine unless you stop the other web server. Port **address already in use** on `:443` means something else (commonly **nginx**) is bound there.

**Use nginx + Let’s Encrypt instead:**

1. Add a `server` block in `/etc/nginx/sites-available/` for your API hostname, `proxy_pass http://127.0.0.1:5000;` and the usual `proxy_set_header` lines (see other vhosts on the server).
2. `nginx -t && systemctl reload nginx`
3. `certbot --nginx -d your.api.host` to obtain TLS.

`scripts/deploy/install-caddy-ubuntu.sh` is for hosts where **Caddy** owns 80/443.

## Step 3 — Install Caddy and the site file (only if nothing else is on 80/443)

**Option A — Script (Ubuntu/Debian):** on the server, after cloning or rsyncing the repo:

```bash
export API_HOSTNAME=api.yourdomain.com
sudo -E bash scripts/deploy/install-caddy-ubuntu.sh
```

**Option B — Manual:** follow [Caddy install](https://caddyserver.com/docs/install#debian-ubuntu-raspbian) for your OS, then copy [Caddyfile.api.example](Caddyfile.api.example) to `/etc/caddy/Caddyfile`, replace `api.example.com` with your `api` hostname, then:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```

## Step 4 — Verify TLS and Node

From your **laptop**:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "https://api.yourdomain.com/health"
```

You want **200** (or a JSON body from your health route). If you get **connection refused**: Node not on `127.0.0.1:5000` or wrong Caddyfile. If **SSL errors**: DNS not pointing here yet or port 80/443 blocked.

## Step 5 — App config

- **`treegens-backend` `.env`:** `BACKEND_URL=https://api.yourdomain.com`
- **4everland** build env: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com` (no trailing slash)

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| `dig` does not return your VPS IP | Fix A record; wait; clear local DNS cache |
| Caddy says ACME / certificate error | Port 80 must reach the server; DNS must point here; see [Caddy problem solving](https://caddyserver.com/docs/automatic-https#errors) |
| 502 from Caddy | `curl http://127.0.0.1:5000/health` **on the server** — Node/PM2 must be running |
| Works on server IP but not `api.…` | Wrong Caddyfile `server_name` or DNS still old |

Back to: [README.md](README.md) in this folder, [SSH-AND-4EVERLAND.md](../SSH-AND-4EVERLAND.md), [4EVERLAND-ENV-CHECKLIST.md](../4EVERLAND-ENV-CHECKLIST.md).
