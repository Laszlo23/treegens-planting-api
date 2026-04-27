# `NEXT_PUBLIC_API_URL` and 4everland (short note)

4EVERLAND **static** Hosting only publishes your **Next.js** build output (`treegens-web-main/out/`) to IPFS (or other networks). It does **not** run the **Node/Express** API.

- **`NEXT_PUBLIC_API_URL`** must be the public **https://** origin where **`treegens-backend-main`** is running (VPS, PaaS, etc.), **not** the 4everland app URL and not an IPFS gateway path.

Set it **before** `yarn build:ipfs` / `STATIC_EXPORT=true yarn build` so the value is inlined in the static bundle.

**Full step-by-step:** [deploy/4EVERLAND.md](4EVERLAND.md)
