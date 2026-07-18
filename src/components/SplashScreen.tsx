"use client"
import { useEffect, useState } from "react"
import Image from "next/image"

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("visited")
    if (!hasVisited) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        sessionStorage.setItem("visited", "true")
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center">
      <div className="animate-pulse">
        <Image src="/logo.png" alt="Exha Wave" width={120} height={120} className="mb-4" />
      </div>
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary mt-4">
        Exha Wave
      </h1>
      <p className="text-lg text-gray-500 mt-2">Boost Your Social Presence</p>
    </div>
  )
}