const path = require('path')

/** Use `STATIC_EXPORT=true yarn build` for IPFS / 4everland (static `out/`). */
const isStaticExport =
  process.env.STATIC_EXPORT === 'true' || process.env.STATIC_EXPORT === '1'

if (isStaticExport && !process.env.NEXT_PUBLIC_API_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    '\n[treegens] STATIC_EXPORT: set NEXT_PUBLIC_API_URL to your public Node/Express API (HTTPS, no trailing slash). See deploy/4EVERLAND.md\n',
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Avoid inferring workspace root from a parent lockfile (e.g. ~/yarn.lock)
  outputFileTracingRoot: path.join(__dirname),
  ...(isStaticExport
    ? {
        output: 'export',
        // IPFS: no Next image optimizer server
        images: {
          unoptimized: true,
        },
        // `redirects` is not supported with static export; see `src/app/dashboard/[[...segments]]/page.tsx`
      }
    : {}),
  ...(!isStaticExport
    ? {
        async redirects() {
          return [
            {
              source: '/dashboard/stake',
              destination: '/stake',
              permanent: true,
            },
            { source: '/dashboard', destination: '/', permanent: false },
            {
              source: '/dashboard/how-to-plant',
              destination: '/tutorial',
              permanent: true,
            },
            {
              source: '/dashboard/new-plant',
              destination: '/submissions/create',
              permanent: true,
            },
            {
              source: '/dashboard/my-plants',
              destination: '/submissions',
              permanent: true,
            },
            {
              source: '/dashboard/submissions',
              destination: '/submissions/review',
              permanent: true,
            },
            {
              source: '/dashboard/submissions/:userWalletAddress/:submissionId',
              destination:
                '/submissions/review/:userWalletAddress/:submissionId',
              permanent: true,
            },
            {
              source: '/dashboard/leaderboard',
              destination: '/leaderboard',
              permanent: true,
            },
          ]
        },
      }
    : {}),
}

module.exports = nextConfig
