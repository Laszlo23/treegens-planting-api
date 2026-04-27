# IPFS (4everland) + Freename + Treegens frontend

## 1. 4everland: confirm your deployment (checklist)

In [4everland Hosting](https://www.4everland.org/), open your project and record:

- [ ] **IPFS CID** of the latest successful deployment (for Freename “IPFS / dweb” record).
- [ ] **Public site URL** — usually `https://<your-project>.4everland.app` or the gateway URL 4everland shows. Use this for Freename **website / URL** if you prefer an HTTPS link over raw CID.
- [ ] **Path at root** — the Treegens app is built for the **root** of the host (`/`), not a subpath. If your 4everland URL serves the app at a subpath, set `basePath` and `assetPrefix` in `next.config.js` and rebuild; otherwise use the default 4everland project URL that serves at `/`.

**Redeploy** after any change to `NEXT_PUBLIC_*` (values are inlined at build time for static export).

**Next 16.1 + `output: 'export'`: `generateStaticParams` must be non-empty** (empty `[]` can fail the build). The app uses one placeholder per dynamic segment; see `treegens-web-main/src/app/staticExportPlaceholders.ts`. Real resource IDs still work in the browser (client navigation); direct cold loads to a URL that was not prerendered may 404 on a pure static host.

## 2. Freename (Unstoppable-style) records

Do this in the Freename dashboard (wording may vary):

- **Option A (simplest):** Set **website / URL** to your **4everland HTTPS** project URL, or to a **custom domain** you added in 4everland.
- **Option B:** Set **IPFS / dweb** to the same **CID** 4everland shows, so resolvers point at IPFS; users typically land on a gateway (HTTPS) anyway.

**Backend API is not on IPFS** — the browser still calls your Node API at `NEXT_PUBLIC_API_URL` (must be `https://` to avoid mixed-content blocks).

## 3. Environment variables (4everland build / CI)

Set before `yarn build`. See `treegens-web-main/.env.example` for the full list; minimum for production:

- `NEXT_PUBLIC_API_URL` — HTTPS Node API, no trailing slash
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` — from [Thirdweb dashboard](https://thirdweb.com/dashboard)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — from WalletConnect Cloud
- Contract / chain: `NEXT_PUBLIC_TGN_VAULT_ADDRESS`, `NEXT_PUBLIC_TGN_TOKEN_ADDRESS`, etc.
- `NEXT_PUBLIC_NODE_ENV=production` — disable dev-only tools
- Optional: `NEXT_PUBLIC_IPFS_GATEWAY` for Pinata gateway URL prefix

## 4. Express API: HTTPS and CORS

- Serve the API over **HTTPS**.
- CORS: allow the **Origin** of your public app (4everland URL, Freename-resolved URL, and custom domain as needed). The backend uses `cors()` with default options (reflects the request `Origin` and allows common methods/headers for browser clients). If you tighten CORS, include every **https://** front origin you use. Ensure `NEXT_PUBLIC_API_URL` is **https** so the IPFS/HTTPS app does not hit mixed-content blocks.

## 5. Local static export test

```bash
cd treegens-web-main
yarn build:ipfs
# same as: STATIC_EXPORT=true yarn build
# output in `out/` — upload or sync to IPFS/4everland as your host expects
```

If `STATIC_EXPORT` is unset, `yarn build` is a normal Next build (e.g. for `next start` / a Node host).
