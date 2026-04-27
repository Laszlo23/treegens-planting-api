# Caddy TLS for the Node API (VPS)

**Step-by-step DNS + firewall + Caddy:** [SETUP-DNS-AND-CADDY.md](SETUP-DNS-AND-CADDY.md) (you add the A record; the repo cannot log into your registrar).

**Quick install on Ubuntu (on the server):** `export API_HOSTNAME=api.yourdomain.com` then `sudo -E bash scripts/deploy/install-caddy-ubuntu.sh` from the monorepo.

Use this when the **browser** (e.g. the 4everland static site over **https**) must call your **Node API** over **https** as well (mixed content otherwise).

1. Install [Caddy](https://caddyserver.com/docs/install) on the Linux server, or use `scripts/deploy/install-caddy-ubuntu.sh` as above.
2. Copy [`Caddyfile.api.example`](Caddyfile.api.example) and replace `api.example.com` with your hostname (e.g. `api.yourdomain.com`). Point that name’s **DNS A record** at the server’s public IP.
3. Open **80** and **443** on the firewall (and **22** for SSH). See [deploy/VPS.md](../VPS.md) for UFW notes.
4. Validate and reload:

   ```bash
   sudo caddy validate --config /etc/caddy/Caddyfile
   sudo systemctl reload caddy
   ```

5. Test: `curl -sS https://api.yourdomain.com/health`

6. Set `BACKEND_URL` and your 4everland build’s `NEXT_PUBLIC_API_URL` to `https://api.yourdomain.com` (no trailing slash).

**Internal services:** FastAPI should stay on `127.0.0.1:8000` only; only **Node** is exposed on 5000 behind Caddy.

Read [deploy/SSH-AUTH-AND-SECRETS.md](../SSH-AUTH-AND-SECRETS.md) before storing any credentials.
