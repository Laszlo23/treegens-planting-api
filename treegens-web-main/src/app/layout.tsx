import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { ThirdwebProvider } from 'thirdweb/react'
import { AuthGuard } from '@/components/AuthGuard'
import { ThirdwebAutoConnect } from '@/components/providers/ThirdwebAutoConnect'
import ErudaConsole from '@/components/ErudaConsole'
import PWAInstaller from '@/components/PWAInstaller'
import { AuthProvider } from '@/contexts/AuthProvider'
import { ConnectivityProvider } from '@/contexts/ConnectivityProvider'
import { UserProvider } from '@/contexts/UserProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TreeGens - Tree Planting Verification',
  description:
    'Decentralized tree planting verification platform with offline video upload capability',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TreeGens',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#DFEA8A',
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErudaConsole>
          <ThirdwebProvider>
            <ThirdwebAutoConnect />
            <ConnectivityProvider>
              <AuthProvider>
                <UserProvider>
                  <AuthGuard>
                    <PWAInstaller />
                    <div className="fixed inset-0 w-full overflow-y-auto md:hidden">
                      {children}
                    </div>
                    <div className="fixed inset-0 items-center justify-center hidden md:flex">
                      You can see the app only on mobile
                    </div>
                  </AuthGuard>
                </UserProvider>
              </AuthProvider>
            </ConnectivityProvider>
          </ThirdwebProvider>
        </ErudaConsole>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}

export default RootLayout
