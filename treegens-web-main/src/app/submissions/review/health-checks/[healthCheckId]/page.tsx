import { STATIC_EXPORT_MONGO_ID_PLACEHOLDER } from '@/app/staticExportPlaceholders'
import ReviewHealthCheckLegacyRedirectClient from './ReviewHealthCheckLegacyRedirectClient'

export async function generateStaticParams(): Promise<
  { healthCheckId: string }[]
> {
  return [{ healthCheckId: STATIC_EXPORT_MONGO_ID_PLACEHOLDER }]
}

export default function ReviewHealthCheckLegacyRedirect() {
  return <ReviewHealthCheckLegacyRedirectClient />
}
