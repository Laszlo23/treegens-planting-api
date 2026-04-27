/** Canonical app paths (mirror mobile Expo routes). */

export const routes = {
  Login: '/auth',
  Home: '/',
  /** @deprecated Use routes.Home — kept for refactors */
  Dashboard: '/',
  Profile: '/profile',
  Tutorial: '/tutorial',
  TutorialVerify: '/tutorial/verify',
  Leaderboard: '/leaderboard',
  LeaderboardFunded: '/leaderboard/funded',
  NewPlant: '/submissions/create',
  /** User's submissions list (replaces legacy my-plants as primary list). */
  MySubmissions: '/submissions',
  /** @deprecated Use MySubmissions — same URL */
  MyPlants: '/submissions',
  /** Verifier moderation queue */
  SubmissionsReview: '/submissions/review',
  /** @deprecated Use SubmissionsReview */
  Submissions: '/submissions/review',
  Stake: '/stake',
  HealthChecks: '/health-checks',
  /** Dynamic — use buildReviewSubmissionPath */
  ReviewSubmission: '/submissions/review/[userWalletAddress]/[submissionId]',
  SubmissionDetail: '/submissions/[id]',
  RejectionFeedback: '/submissions/[id]/rejection-feedback',
}

/** @deprecated Use routes.Home */
export const legacyDashboardPath = '/dashboard'

export function buildReviewSubmissionPath(
  userWalletAddress: string,
  submissionId: string,
) {
  return `/submissions/review/${encodeURIComponent(userWalletAddress)}/${encodeURIComponent(submissionId)}`
}

/** Bottom tab shell (home, tutorial, leaderboard) — show AppBottomNav; AppHeader only on home */
export const tabShellPaths: string[] = [
  routes.Home,
  routes.Tutorial,
  routes.TutorialVerify,
  routes.Leaderboard,
  routes.LeaderboardFunded,
]

const dynamicTitleRoutesMap: Record<string, string> = {
  [routes.NewPlant]: 'Plant new trees',
  [routes.Stake]: 'Stake TGN',
  [routes.MySubmissions]: 'My submissions',
  [routes.Profile]: 'Profile',
  [routes.SubmissionsReview]: 'Review submissions',
  [routes.ReviewSubmission]: 'Review submission',
  [routes.SubmissionDetail]: 'Submission',
  [routes.RejectionFeedback]: 'Feedback',
  [routes.HealthChecks]: 'Health checks',
  '/submissions/[id]/health-checks': 'Health checks',
  '/submissions/[id]/health-checks/create': 'New health check',
  '/health-checks/[healthCheckId]': 'Health check',
  '/submissions/review/health-checks/[healthCheckId]': 'Review health check',
}

const dynamicTitleRoutes = Object.keys(dynamicTitleRoutesMap)

export const appConfig = {
  routes,
  tabShellPaths,
  dynamicTitleRoutes,
  dynamicTitleRoutesMap,
}
