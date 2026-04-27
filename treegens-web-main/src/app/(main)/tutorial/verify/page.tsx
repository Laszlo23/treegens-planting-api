'use client'

import { TutorialHeader } from '@/components/Layout/TutorialHeader'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  verifyInstructions,
  verifyTitle,
} from '@/components/tutorial/plantTutorialCopy'
import { appConfig } from '@/config/appConfig'

export default function TutorialVerifyPage() {
  const router = useRouter()
  const [lang, setLang] = useState<'English' | 'Swahili'>('English')

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TutorialHeader title="How to Verify" />
      <div className="relative z-0 mb-8 flex flex-1 flex-col gap-6 px-4 pb-48">
        <section>
          <div className="flex justify-end py-3">
            <Button
              onClick={() =>
                lang === 'English' ? setLang('Swahili') : setLang('English')
              }
              color="green"
              className="h-10"
            >
              {lang === 'English' ? 'Swahili' : 'English'}
            </Button>
          </div>
          <h3 className="text-lg font-semibold">{verifyTitle[lang]}</h3>
          <div className="text-sm mt-2 text-brown-3 list-decimal">
            {verifyInstructions[lang]}
          </div>
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold">Watch video tutorial</h3>
          <video
            className="aspect-video rounded-lg w-full"
            preload="metadata"
            controls
          >
            <source src="/videos/how-to-verify.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </section>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => router.push(appConfig.routes.NewPlant)}
            pill
            color="success"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}
