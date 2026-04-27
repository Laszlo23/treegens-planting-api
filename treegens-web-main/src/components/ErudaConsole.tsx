'use client'

import { useEffect, useState } from 'react'

const ErudaConsole = ({ children }: { children: React.ReactNode }) => {
  const isDevelopment = process.env.NEXT_PUBLIC_NODE_ENV === 'development'
  const [isErudaInitialized, setIsErudaInitialized] = useState(false)
  useEffect(() => {
    if (isDevelopment) {
      import('eruda').then(eruda => {
        eruda.default.init()
        console.log('Eruda console initialized for mobile debugging')
        setIsErudaInitialized(true)
      })
    }
  }, [])

  return !isDevelopment || isErudaInitialized ? children : null
}

export default ErudaConsole
