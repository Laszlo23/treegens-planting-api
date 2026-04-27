import { STATIC_EXPORT_MONGO_ID_PLACEHOLDER } from '@/app/staticExportPlaceholders'
import HealthCheckIdPageClient from './HealthCheckIdPageClient'

export async function generateStaticParams(): Promise<
  { healthCheckId: string }[]
> {
  return [{ healthCheckId: STATIC_EXPORT_MONGO_ID_PLACEHOLDER }]
}

export default function HealthCheckPage() {
  return <HealthCheckIdPageClient />
}
