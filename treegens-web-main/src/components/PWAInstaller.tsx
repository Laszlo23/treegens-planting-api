'use client'

import { Button } from '@/components/ui/Button'
import { useEffect, useState } from 'react'
import { MdInstallMobile } from 'react-icons/md'
import { getNeverShowPWA, setNeverShowPWA } from '@/utils/helpers'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function PWAInstaller() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Respect user's choice to never show the prompt again
      const neverShow = getNeverShowPWA()
      if (neverShow) return

      setInstallPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)
    }

    const handleAppInstalled = () => {
      console.log('[PWA] App was installed')
      setShowInstallButton(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt')
      } else {
        console.log('[PWA] User dismissed the install prompt')
      }

      setInstallPrompt(null)
      setShowInstallButton(false)
    } catch (error) {
      console.error('[PWA] Error during installation:', error)
    }
  }

  if (!showInstallButton) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:hidden">
      <div className="bg-lime-green-1 text-brown-1 p-3 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdInstallMobile className="w-5 h-5" />
            <span className="text-sm font-medium">
              Install TreeGens for offline video uploads
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="xs" color="green" onClick={handleInstallClick}>
              Install
            </Button>
            <Button
              size="xs"
              color="gray"
              onClick={() => setShowInstallButton(false)}
            >
              Later
            </Button>
            <Button
              size="xs"
              color="gray"
              onClick={() => {
                setNeverShowPWA()
                setShowInstallButton(false)
                setInstallPrompt(null)
              }}
            >
              Don't show again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
