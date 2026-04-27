#!/usr/bin/env bash
# Install Caddy on Debian/Ubuntu and write /etc/caddy/Caddyfile for the Treegens Node API.
# Run ON THE VPS (not on your Mac) with sudo. Key-based root or sudo; no passwords in this file.
#
#   export API_HOSTNAME=api.yourdomain.com
#   sudo -E bash scripts/deploy/install-caddy-ubuntu.sh
#
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo -E bash $0" >&2
  exit 1
fi

: "${API_HOSTNAME:?Set API_HOSTNAME to your DNS name, e.g. api.yourdomain.com}"

if ! command -v caddy &>/dev/null; then
  echo "Installing Caddy (official package repo)..."
  apt-get update -qq
  apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y caddy
fi

CADDYFILE="/etc/caddy/Caddyfile"
if [[ -f "$CADDYFILE" && ! -f "${CADDYFILE}.bak" ]]; then
  cp -a "$CADDYFILE" "${CADDYFILE}.bak.$(date +%Y%m%d%H%M%S)"
fi

cat >"$CADDYFILE" <<EOF
# Treegens Node API — created by install-caddy-ubuntu.sh
# TLS via Let's Encrypt (ports 80/443 must be open; DNS A record -> this host)

${API_HOSTNAME} {
	encode gzip zstd
	reverse_proxy 127.0.0.1:5000
}
EOF

caddy validate --config "$CADDYFILE"
systemctl enable caddy
systemctl restart caddy
systemctl --no-pager status caddy || true

echo ""
echo "Caddy is running. Test from your laptop:"
echo "  curl -sS https://${API_HOSTNAME}/health"
echo "Ensure treegens-backend listens on 127.0.0.1:5000 (e.g. PM2)."
