/** Relative time similar to mobile `moment().fromNow()` */
export function formatTimeAgo(isoDate: string): string {
  const then = new Date(isoDate).getTime()
  if (Number.isNaN(then)) return ''

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const diffSec = Math.round((then - Date.now()) / 1000)
  const abs = Math.abs(diffSec)

  if (abs < 60) return rtf.format(diffSec, 'second')
  const diffMin = diffSec / 60
  if (abs < 3600) return rtf.format(Math.round(diffMin), 'minute')
  const diffHr = diffSec / 3600
  if (abs < 86400) return rtf.format(Math.round(diffHr), 'hour')
  const diffDay = diffSec / 86400
  if (abs < 604800) return rtf.format(Math.round(diffDay), 'day')
  const diffWeek = diffSec / 604800
  if (abs < 2592000) return rtf.format(Math.round(diffWeek), 'week')
  const diffMonth = diffSec / 2592000
  if (abs < 31536000) return rtf.format(Math.round(diffMonth), 'month')
  return rtf.format(Math.round(diffSec / 31536000), 'year')
}
