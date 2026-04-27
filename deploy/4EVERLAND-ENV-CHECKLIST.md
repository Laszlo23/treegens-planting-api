# 4everland Hosting — environment variables (build time)

Set these in the **4everland project** → **Settings** → **Environment variables** (or your CI) **before** the build. `NEXT_PUBLIC_*` values are **inlined** into the static export.

| Variable | Required for production | Notes |
|----------|-------------------------|--------|
| `STATIC_EXPORT` | If your build does not set it in `package.json` | Use `yarn build:ipfs` which sets it, or set `true` and run `yarn build` |
| `NEXT_PUBLIC_API_URL` | **Yes** | `https://tree.buildingculture.capital` (current production Node API), **no trailing slash**. Not the 4everland app URL. |
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | Wallets / Thirdweb | From [Thirdweb dashboard](https://thirdweb.com/dashboard) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Wallet connect | [WalletConnect Cloud](https://cloud.walletconnect.com/) |
| `NEXT_PUBLIC_TGN_VAULT_ADDRESS` | Token flows | As deployed |
| `NEXT_PUBLIC_TGN_TOKEN_ADDRESS` | Token flows | As deployed |
| `NEXT_PUBLIC_TGN_TOKEN_DECIMALS` | | Often `18` |
| `NEXT_PUBLIC_VALIDATORS_MINIMUM_TGN_TOKENS` | | Default in `.env.example` |
| `NEXT_PUBLIC_NODE_ENV` | Recommended | `production` for 4everland |
| `NEXT_PUBLIC_IPFS_GATEWAY` | Optional | Pinata or public gateway prefix if used |

**Dashboard build (typical):**

- **Root directory:** `treegens-web-main`
- **Build command:** `yarn install && yarn build:ipfs`
- **Output directory:** `out`

Full context: [4EVERLAND.md](4EVERLAND.md), [IPFS-FREENAME-DEPLOY.md](IPFS-FREENAME-DEPLOY.md). Copy-paste of variable names: [treegens-web-main/.env.example](../treegens-web-main/.env.example).
