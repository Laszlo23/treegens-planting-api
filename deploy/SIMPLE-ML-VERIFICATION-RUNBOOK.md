# Super simple: live video / on-the-fly ML preview

**One fact (not your fault):** 4everland only publishes your **website files** (the Next.js `out/` folder). It does **not** run the **Node API** or the **Python ML** service. Live preview needs those two **in addition** to the static site.

**What “on the fly” does in this app:** while you record, the browser sends single **JPEG frames** to your **Node** server → Node forwards to **FastAPI** (`/internal/verify-frame`) → you get an **advisory** tree count on screen. Full video proof is still the normal upload flow.

---

## Part A — Make it work on your computer first (best for testing)

Do these in order. Leave all three running in separate terminal windows.

### Step 1 — Start the Python ML API (FastAPI)

From the **monorepo root** (folder that has `docker-compose.yml`):

```bash
docker compose up -d --build
```

- Wait until it is healthy. Check: open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in a browser.  
- The internal key for the next step is whatever you set in compose (default in `docker-compose.yml` is often `internal-dev-key` for dev — check the `INTERNAL_API_KEY` / `api` service env if you changed it).

### Step 2 — Start the Node API (Express)

Open a new terminal:

```bash
cd treegens-backend-main
cp .env.example .env
```

Edit `.env` and set at least:

- `MONGODB_URI` — use a real MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier).
- `PINATA_JWT` — a real Pinata JWT (needed for other features; for **only** testing ml-preview you still need a valid app boot; use a dev key from Pinata).
- `PLANTING_VERIFICATION_API_URL=http://127.0.0.1:8000` (no trailing slash)  
- `PLANTING_VERIFICATION_INTERNAL_KEY` = **exact same** string as FastAPI’s `INTERNAL_API_KEY` in Docker.

Then:

```bash
yarn install
yarn build
yarn migrate
yarn dev
```

- Check: [http://127.0.0.1:5000/docs](http://127.0.0.1:5000/docs) (Swagger).

### Step 3 — Start the website (Next.js)

Another terminal:

```bash
cd treegens-web-main
cp .env.example .env.local
```

In `.env.local` set:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
```

(Use the same host/port the Node app prints if yours is different.)

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000), go to **create submission / plant** flow, use **live camera** where `LiveCameraVideoCapture` is used, and you should see preview requests and counts if ML is up.

**Quick check if something is wrong:** In the browser, **Network** tab → look for `ml-preview` → if **401**, fix JWT / sign-in; if **502/503/timeout** from Node, Node cannot reach FastAPI (wrong `PLANTING_VERIFICATION_API_URL` or key).

---

## Part B — “4everland + all I can have there” (production-shaped test)

1. **Node API on HTTPS** — current production: `https://tree.buildingculture.capital` ([DEVELOPER-HANDOFF.md](DEVELOPER-HANDOFF.md)).  
2. **Run FastAPI** on a server the Node process can call, with `PLANTING_VERIFICATION_*` on **Node**.  
3. **4everland:** static app only: root `treegens-web-main`, output `out`, `yarn build:ipfs` ([4EVERLAND.md](4EVERLAND.md)). **Build-time** env:

   `NEXT_PUBLIC_API_URL=https://tree.buildingculture.capital`  

   (This is the **Node** origin, **not** the 4everland app URL.)

4. Open your `https://….4everland.app` site and test the same flow. Mixed content is blocked: the page is HTTPS, so the API URL must be **https** too.

---

## Cheat sheet (who talks to whom)

| Piece | Where it usually runs | Role |
|--------|------------------------|------|
| Next static site | 4everland (`out/`) | UI, camera, calls Node |
| Node (`treegens-backend`) | Your PC (dev) or a real server | `/api/submissions/ml-preview` → Python |
| FastAPI (`server/`) | Docker on your PC (dev) or a server | `/internal/verify-frame` = YOLO on JPEG |

If you get stuck, do **Part A** only until preview works locally — then you know the app is fine; after that it is only hosting and `NEXT_PUBLIC_API_URL` + secrets.
