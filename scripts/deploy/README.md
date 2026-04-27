# Deploy scripts (run from your laptop or CI)

- **[ssh.env.example](ssh.env.example)** — copy to **`.env.ssh`** in this directory (gitignored), set `SSH_USER`, `SSH_HOST`, `SSH_PORT`, `REMOTE_DIR`. Use **SSH keys**; do not put passwords in files. See [deploy/SSH-AUTH-AND-SECRETS.md](../../deploy/SSH-AUTH-AND-SECRETS.md).
- **[rsync-to-vps.sh](rsync-to-vps.sh)** — `bash scripts/deploy/rsync-to-vps.sh` after sourcing `.env.ssh` syncs the monorepo to the server.
- **[REMOTE-DEPLOY-STEPS.md](REMOTE-DEPLOY-STEPS.md)** — what to run **on the VPS** after sync (Docker, Node, PM2, Caddy, 4everland env).
- **[install-caddy-ubuntu.sh](install-caddy-ubuntu.sh)** — on the **VPS** (as root): `export API_HOSTNAME=api.yourdomain.com` then `sudo -E bash scripts/deploy/install-caddy-ubuntu.sh`. See [deploy/caddy/SETUP-DNS-AND-CADDY.md](../../deploy/caddy/SETUP-DNS-AND-CADDY.md) for DNS first.

End-to-end narrative: [deploy/SSH-AND-4EVERLAND.md](../../deploy/SSH-AND-4EVERLAND.md).
