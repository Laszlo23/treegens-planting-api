import { STATIC_EXPORT_MONGO_ID_PLACEHOLDER } from '@/app/staticExportPlaceholders'
import CautionedSubmissionDetailPageClient from './CautionedSubmissionDetailPageClient'

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [{ id: STATIC_EXPORT_MONGO_ID_PLACEHOLDER }]
}

export default function CautionedSubmissionDetailPage() {
  return <CautionedSubmissionDetailPageClient />
}
