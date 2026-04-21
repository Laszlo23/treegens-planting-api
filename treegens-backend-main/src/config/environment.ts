import 'dotenv/config'

/** Average Gregorian year in seconds (365.25 days). */
const AVG_YEAR_SEC = 365.25 * 86400
/** Default claim spacing: 6 calendar months (~½ average Gregorian year). */
const DEFAULT_MGRO_CLAIM_INTERVAL = Math.round((AVG_YEAR_SEC / 12) * 6)
/** Default number of vesting checkpoints/tranches over the schedule. */
const DEFAULT_MGRO_CLAIM_COUNT = 6

class EnvironmentConfig {
  constructor() {
    this.validateRequired()
  }

  get PORT() {
    return process.env.PORT || 5000
  }

  get NODE_ENV() {
    return process.env.NODE_ENV || 'development'
  }

  get MONGODB_URI() {
    return process.env.MONGODB_URI
  }

  get PINATA_JWT() {
    return process.env.PINATA_JWT || ''
  }

  get PINATA_GATEWAY_BASE_URL() {
    return process.env.PINATA_GATEWAY_BASE_URL || ''
  }

  get isDevelopment() {
    return this.NODE_ENV === 'development'
  }

  get isProduction() {
    return this.NODE_ENV === 'production'
  }

  // Optional chain config for verifier feature
  get BASE_SEPOLIA_RPC_URL() {
    return process.env.BASE_SEPOLIA_RPC_URL || process.env.RPC_URL
  }

  get TGN_VAULT_ADDRESS() {
    return (
      process.env.TGN_VAULT_ADDRESS ||
      '0x66e003F3318F13b122477E2561c1cf5C5181bc97'
    )
  }

  get TGN_TOKEN_ADDRESS() {
    return (
      process.env.TGN_TOKEN_ADDRESS ||
      '0xA10336e3e0ee9CC81397db91aC585BA32460Cdcf'
    )
  }

  get DAO_CONTRACT_ADDRESS() {
    return (
      process.env.DAO_CONTRACT_ADDRESS ||
      '0xe0Eb9FCfccEaA66edE66F5B94bfAdC1c90CeDc4D'
    )
  }

  get MGRO_TOKEN_ADDRESS() {
    return (
      process.env.MGRO_TOKEN_ADDRESS ||
      '0xE2507198a1C2cC0Fc6559159e2D86604a25bBE79'
    )
  }

  /** Private key for wallet that mints MGRO rewards (must have minter role on contract). */
  get MGRO_MINTER_PRIVATE_KEY() {
    return process.env.MGRO_MINTER_PRIVATE_KEY || ''
  }

  /** Private key for wallet allowed to call TGNVault.slash. */
  get TGN_VAULT_SLASHER_PRIVATE_KEY() {
    return process.env.TGN_VAULT_SLASHER_PRIVATE_KEY || ''
  }

  get MGRO_DECIMALS() {
    const d = parseInt(process.env.MGRO_DECIMALS || '18', 10)
    return Number.isNaN(d) ? 18 : d
  }

  /**
   * Seconds between planter reward tranche unlock times.
   * Default: 6 calendar months.
   */
  get MGRO_CLAIM_INTERVAL() {
    const raw = process.env.MGRO_CLAIM_INTERVAL
    const n =
      raw !== undefined && raw !== ''
        ? parseInt(raw, 10)
        : DEFAULT_MGRO_CLAIM_INTERVAL
    return Number.isNaN(n) || n <= 0 ? DEFAULT_MGRO_CLAIM_INTERVAL : n
  }

  /**
   * Number of reward tranches/checkpoints in the schedule.
   * Total schedule duration is derived as intervalSeconds * claimCount.
   */
  get MGRO_CLAIM_COUNT() {
    const raw = process.env.MGRO_CLAIM_COUNT
    const n =
      raw !== undefined && raw !== ''
        ? parseInt(raw, 10)
        : DEFAULT_MGRO_CLAIM_COUNT
    return Number.isNaN(n) || n <= 0 ? DEFAULT_MGRO_CLAIM_COUNT : n
  }

  get TGN_DECIMALS() {
    const d = parseInt(process.env.TGN_DECIMALS || '18')
    return Number.isNaN(d) ? 18 : d
  }

  get VALIDATORS_MINIMUM_TGN_TOKENS() {
    return process.env.VALIDATORS_MINIMUM_TGN_TOKENS || 2000n
  }

  get MINIMUM_ACTIVE_VERIFIERS() {
    const raw = process.env.MINIMUM_ACTIVE_VERIFIERS
    const n = raw !== undefined && raw !== '' ? parseInt(raw, 10) : 5
    return Number.isNaN(n) ? 5 : Math.max(1, n)
  }

  get TGN_STAKE_VERIFIER_CRON_TIME() {
    return process.env.TGN_STAKE_VERIFIER_CRON_TIME || '13 2 * * *'
  }

  get ENABLE_CRONJOBS() {
    return process.env.ENABLE_CRONJOBS || 'false'
  }

  get ENABLE_REWARD_CLAIM_WORKER() {
    return process.env.ENABLE_REWARD_CLAIM_WORKER || 'false'
  }

  get ENABLE_SLASH_WORKER() {
    return process.env.ENABLE_SLASH_WORKER || 'false'
  }

  get REDIS_URL() {
    return process.env.REDIS_URL || ''
  }

  get REDIS_HOST() {
    return process.env.REDIS_HOST || '127.0.0.1'
  }

  get REDIS_PORT() {
    const v = parseInt(process.env.REDIS_PORT || '6379', 10)
    return Number.isNaN(v) ? 6379 : v
  }

  get REDIS_PASSWORD() {
    return process.env.REDIS_PASSWORD || ''
  }

  get REDIS_DB() {
    const v = parseInt(process.env.REDIS_DB || '0', 10)
    return Number.isNaN(v) ? 0 : v
  }

  get REDIS_TLS() {
    return process.env.REDIS_TLS === 'true'
  }

  /** Max distance (m) between health-check GPS and submission plant GPS for eligibility. */
  get HEALTH_CHECK_MAX_DISTANCE_METERS() {
    const raw = process.env.HEALTH_CHECK_MAX_DISTANCE_METERS
    const n = raw !== undefined && raw !== '' ? parseFloat(raw) : 5
    return Number.isNaN(n) || n <= 0 ? 5 : n
  }

  /** FastAPI planting proof API base URL (no trailing slash), e.g. http://localhost:8000 */
  get PLANTING_VERIFICATION_API_URL() {
    return process.env.PLANTING_VERIFICATION_API_URL || ''
  }

  /** Must match Python INTERNAL_API_KEY for POST /internal/verify-video */
  get PLANTING_VERIFICATION_INTERNAL_KEY() {
    return process.env.PLANTING_VERIFICATION_INTERNAL_KEY || ''
  }

  /**
   * ML verification: explicit `false`/`true`, or if unset, enabled only when both
   * PLANTING_VERIFICATION_API_URL and PLANTING_VERIFICATION_INTERNAL_KEY are non-empty.
   */
  get PLANTING_VERIFICATION_ENABLED() {
    const v = process.env.PLANTING_VERIFICATION_ENABLED
    if (v === 'true' || v === '1') return true
    if (v === 'false' || v === '0') return false
    const base = (process.env.PLANTING_VERIFICATION_API_URL || '').trim()
    const key = (process.env.PLANTING_VERIFICATION_INTERNAL_KEY || '').trim()
    return Boolean(base && key)
  }

  /** Axios timeout for verify-video (YOLO + ffmpeg can be slow). */
  get PLANTING_VERIFICATION_TIMEOUT_MS() {
    const raw = process.env.PLANTING_VERIFICATION_TIMEOUT_MS
    const n = raw !== undefined && raw !== '' ? parseInt(raw, 10) : 180000
    return Number.isNaN(n) || n < 10000 ? 180000 : n
  }

  validateRequired() {
    const required = ['MONGODB_URI', 'PINATA_JWT']
    const missing = required.filter(key => !process.env[key])

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      )
    }
  }
}

export default new EnvironmentConfig()
