#!/usr/bin/env bash
# Sync monorepo to a VPS over SSH (key-based auth). Run from your laptop.
#
# Setup: cp scripts/deploy/ssh.env.example scripts/deploy/.env.ssh && edit
# Then:  source scripts/deploy/.env.ssh   (or export vars manually)
#        ./scripts/deploy/rsync-to-vps.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ENV_FILE="$SCRIPT_DIR/.env.ssh"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

: "${SSH_USER:?Set SSH_USER or source scripts/deploy/.env.ssh}"
: "${SSH_HOST:?Set SSH_HOST}"
SSH_PORT="${SSH_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-/root/treegens-app}"

SSH_TARGET="${SSH_USER}@${SSH_HOST}"
RSYNC_RSH="ssh -p ${SSH_PORT} -o StrictHostKeyChecking=accept-new"

echo "Rsync $REPO_ROOT/ -> ${SSH_TARGET}:${REMOTE_DIR}/"

rsync -avz --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '**/.next' \
  --exclude 'out' \
  --exclude 'dist' \
  --exclude '**/.venv' \
  --exclude '__pycache__' \
  --exclude '*.pt' \
  --exclude '.env' \
  --exclude '**/.env' \
  --exclude '.env.*' \
  --exclude 'docker-compose.override.yml' \
  -e "$RSYNC_RSH" \
  "$REPO_ROOT/" \
  "${SSH_TARGET}:${REMOTE_DIR}/"

echo "Done. On the server: cd $REMOTE_DIR && follow scripts/deploy/REMOTE-DEPLOY-STEPS.md"
