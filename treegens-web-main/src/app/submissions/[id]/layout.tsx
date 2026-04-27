import { STATIC_EXPORT_MONGO_ID_PLACEHOLDER } from '@/app/staticExportPlaceholders'

/**
 * `generateStaticParams` is also on leaf `page.tsx` under `[id]/` (Next 16 static
 * export can require it per route). See `deploy/IPFS-FREENAME-DEPLOY.md`.
 */

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [{ id: STATIC_EXPORT_MONGO_ID_PLACEHOLDER }]
}

export default function SubmissionIdLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
