import { STATIC_EXPORT_MONGO_ID_PLACEHOLDER } from '@/app/staticExportPlaceholders'
import RejectionFeedbackPageClient from './RejectionFeedbackPageClient'

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [{ id: STATIC_EXPORT_MONGO_ID_PLACEHOLDER }]
}

export default function RejectionFeedbackPage() {
  return <RejectionFeedbackPageClient />
}
