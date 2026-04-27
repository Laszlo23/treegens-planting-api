/**
 * Public **Node/Express** API origin (no trailing slash).
 * Not the Python/ML service and not the IPFS gateway — the long‑running server that
 * exposes `/api/*` and `/docs`.
 *
 * - **Production:** set `NEXT_PUBLIC_API_URL` to the public **https://** origin of your
 *   **Node/Express** deployment (VPS, PaaS, etc.). 4everland **static** hosting only
 *   serves the Next `out/` build; it does not run the API.
 * - **Local:** if unset, defaults to `http://localhost:5000` in development/test.
 */
export function getPublicApiUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return 'http://localhost:5000'
  }
  return ''
}
