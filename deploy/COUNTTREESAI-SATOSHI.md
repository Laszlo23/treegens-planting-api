# counttreesai.satoshi (Freename / Web3) and the API

The **counttreesai.satoshi** name is optional for the live tree-count feature.

## What is required to ship

- **Backend URL**: Set the Treegens app `NEXT_PUBLIC_API_URL` to your real **Node API** (HTTPS in production), e.g. the host where `POST /api/submissions/ml-preview` is available.
- **ML service**: The same `PLANTING_VERIFICATION_API_URL` / `PLANTING_VERIFICATION_INTERNAL_KEY` you use for full-video checks must also reach FastAPI `POST /internal/verify-frame` (added alongside `/internal/verify-video`).

## What the Web3 name is for

- **Branding** or a **human-readable** way to find documentation or a future landing page.
- It does **not** need to be minted or pointed at a server for the app to call the API: web3 name resolution and HTTPS API access are separate concerns.

## When you mint and attach a name

- Point the name’s **website / content** record to your **public HTTPS** API or frontend, following your TLD or gateway’s guide (Freename/Unstoppable-style providers vary by UI).
- **CORS**: The Express app must allow the browser `Origin` of your deployed web app. Default `cors()` is permissive; for production, consider an allowlist of exact `https://` origins.
- **Mixed content**: The web app and `NEXT_PUBLIC_API_URL` should both be **https** so browsers do not block requests.

## No separate marketing site

The product owner can ship with **no website** for the name: the important pieces are a reachable API, the FastAPI verifier, and the mobile/web client using live preview + full upload as implemented.
