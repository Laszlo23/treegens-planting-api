import { AppBottomNav } from '@/components/Layout/AppBottomNav'

export default function MainTabLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {children}
      <AppBottomNav />
    </>
  )
}
