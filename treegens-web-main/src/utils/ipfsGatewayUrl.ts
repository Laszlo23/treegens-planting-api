/**
 * Builds an absolute IPFS gateway URL for a CID.
 * If `NEXT_PUBLIC_IPFS_GATEWAY` is unset, concatenating `${gateway}${cid}` becomes a
 * relative path (`/bafy...`), so the browser hits the Next app and returns 404.
 */
const PUBLIC_IPFS_FALLBACK = 'https://ipfs.io/ipfs'

export function ipfsGatewayUrl(cid: string | undefined | null): string | null {
  if (cid == null) return null
  const raw = String(cid).trim()
  if (!raw) return null

  let path = raw
  if (path.startsWith('ipfs://')) {
    path = path.slice('ipfs://'.length).replace(/^\/+/, '')
  }
  path = path.replace(/^\/+/, '')

  const env = process.env.NEXT_PUBLIC_IPFS_GATEWAY?.trim()
  const base = (env && env.length > 0 ? env : PUBLIC_IPFS_FALLBACK).replace(
    /\/+$/,
    '',
  )
  return `${base}/${path}`
}
