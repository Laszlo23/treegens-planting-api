const JWT_TOKEN_KEY = 'treegens_jwt_token'

/** Reads token from localStorage (client only). Broken out to avoid authService ↔ axios circular imports. */
export function getJwtToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(JWT_TOKEN_KEY)
}

export function setJwtToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(JWT_TOKEN_KEY, token)
}

export function removeJwtToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(JWT_TOKEN_KEY)
}
