import { STATIC_EXPORT_MONGO_ID_PLACEHOLDER } from '@/app/staticExportPlaceholders'
import CreateHealthCheckPageClient from './CreateHealthCheckPageClient'

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [{ id: STATIC_EXPORT_MONGO_ID_PLACEHOLDER }]
}

export default function CreateHealthCheckPage() {
  return <CreateHealthCheckPageClient />
}
