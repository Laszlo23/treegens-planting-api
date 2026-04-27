import {
  STATIC_EXPORT_MONGO_ID_PLACEHOLDER,
  STATIC_EXPORT_ZERO_WALLET,
} from '@/app/staticExportPlaceholders'

export async function generateStaticParams(): Promise<
  { userWalletAddress: string; submissionId: string }[]
> {
  return [
    {
      userWalletAddress: STATIC_EXPORT_ZERO_WALLET,
      submissionId: STATIC_EXPORT_MONGO_ID_PLACEHOLDER,
    },
  ]
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
