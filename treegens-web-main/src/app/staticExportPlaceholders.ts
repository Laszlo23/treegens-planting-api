/**
 * With `output: 'export'`, Next 16.1 requires **non-empty** `generateStaticParams()`.
 * These dummy entries satisfy the build; real IDs still work at runtime (client nav).
 * See `deploy/IPFS-FREENAME-DEPLOY.md`.
 */
export const STATIC_EXPORT_MONGO_ID_PLACEHOLDER = '000000000000000000000000'
export const STATIC_EXPORT_ZERO_WALLET = '0x0000000000000000000000000000000000000000'
