import { STATIC_EXPORT_MONGO_ID_PLACEHOLDER } from '@/app/staticExportPlaceholders'
import CompleteSubmissionPageClient from './CompleteSubmissionPageClient'

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [{ id: STATIC_EXPORT_MONGO_ID_PLACEHOLDER }]
}

export default function CompleteSubmissionPage() {
  return <CompleteSubmissionPageClient />
}
