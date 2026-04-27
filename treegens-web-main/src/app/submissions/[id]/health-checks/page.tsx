import { STATIC_EXPORT_MONGO_ID_PLACEHOLDER } from '@/app/staticExportPlaceholders'
import SubmissionHealthChecksListClient from './SubmissionHealthChecksListClient'

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [{ id: STATIC_EXPORT_MONGO_ID_PLACEHOLDER }]
}

export default function SubmissionHealthChecksListPage() {
  return <SubmissionHealthChecksListClient />
}
