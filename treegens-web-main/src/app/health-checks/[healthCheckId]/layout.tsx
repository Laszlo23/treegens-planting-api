import { STATIC_EXPORT_MONGO_ID_PLACEHOLDER } from '@/app/staticExportPlaceholders'

export async function generateStaticParams(): Promise<
  { healthCheckId: string }[]
> {
  return [{ healthCheckId: STATIC_EXPORT_MONGO_ID_PLACEHOLDER }]
}

export default function HealthCheckIdLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
