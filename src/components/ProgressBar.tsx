"use client"
import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import NProgress from "nprogress"
import "nprogress/nprogress.css"

NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.3 })

export default function ProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    NProgress.done()
  }, [pathname, searchParams])

  useEffect(() => {
    const handleStart = () => NProgress.start()
    const handleStop = () => NProgress.done()

    // Tangkap navigasi client-side
    window.addEventListener("beforeunload", handleStart)
    window.addEventListener("load", handleStop)

    return () => {
      window.removeEventListener("beforeunload", handleStart)
      window.removeEventListener("load", handleStop)
    }
  }, [])

  return null
}