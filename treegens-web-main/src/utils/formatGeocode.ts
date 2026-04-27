/**
 * Splits a reverse geocode string (comma-separated) into city/state and country
 * for compact display lines — same rules as mobile `formatGeocodeParts`.
 */
export function formatGeocodeParts(reverseGeocode?: string | null): {
  cityState: string
  country: string
} {
  if (!reverseGeocode?.trim()) {
    return { cityState: 'Unknown location', country: '' }
  }

  const parts = reverseGeocode
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  if (parts.length >= 3) {
    return {
      cityState: parts.slice(0, -1).join(', '),
      country: parts[parts.length - 1],
    }
  }

  if (parts.length === 2) {
    return { cityState: parts[0], country: parts[1] }
  }

  return { cityState: parts[0], country: '' }
}
