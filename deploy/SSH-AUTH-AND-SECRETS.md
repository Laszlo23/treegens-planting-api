# SSH auth and deploy secrets (read first)

- **If an SSH password was ever shared** in chat, a screenshot, or a log, treat it as **compromised**: change it in your VPS control panel and on the host (`passwd`), then **stop using password logins** for deploy scripts.
- **Use an SSH key** (Ed25519): generate with `ssh-keygen -t ed25519 -C "your@email"`, add the **public** key to the server in `~/.ssh/authorized_keys` (or your provider’s SSH key UI), and use `ssh-add` on your machine so `rsync` / `ssh` work without a password.
- **Never commit** real credentials: the monorepo root [`.env`](../.env) and [`scripts/deploy/`](../scripts/deploy) local files are for **your machine only**; they are gitignored. Do not paste `INTERNAL_API_KEY`, Pinata JWT, or Mongo connection strings into Git-tracked files—only into `.env` files on the server or in your password manager, matching [`.env.example` files](../treegens-backend-main/.env.example).
- **4everland dashboard** is not in Git: set `NEXT_PUBLIC_*` in the 4everland project UI, not in a committed file.

The [`scripts/deploy/rsync-to-vps.sh`](../scripts/deploy/rsync-to-vps.sh) script expects **key-based** SSH, not a password stored in a file.
