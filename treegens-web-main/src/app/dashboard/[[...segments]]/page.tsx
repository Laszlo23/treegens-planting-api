import LegacyDashboardRedirectClient from './LegacyDashboardRedirectClient'

/**
 * Prerender common legacy /dashboard/* paths for static IPFS export.
 * Deep links not listed may still 404 on static hosts; in-app navigation works.
 */
export async function generateStaticParams(): Promise<
  { segments: string[] }[]
> {
  return [
    { segments: [] },
    { segments: ['stake'] },
    { segments: ['how-to-plant'] },
    { segments: ['new-plant'] },
    { segments: ['my-plants'] },
    { segments: ['submissions'] },
    { segments: ['leaderboard'] },
  ]
}

export default function LegacyDashboardPage() {
  return <LegacyDashboardRedirectClient />
}
