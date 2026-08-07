"use client"
import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface InfoBannerProps {
  id: string
  children: React.ReactNode
}

export default function InfoBanner({ id, children }: InfoBannerProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const closed = localStorage.getItem(`banner-closed-${id}`)
    if (!closed) setShow(true)
  }, [id])

  const closeBanner = () => {
    setShow(false)
    localStorage.setItem(`banner-closed-${id}`, "true")
  }

  if (!show) return null

  return (
    <div className="rounded-xl p-3 mb-4 text-sm flex justify-between items-start" style={{ backgroundColor: "#FFF8F0", border: "1px solid #C9A96E" }}>
      <div className="flex-1" style={{ color: "#6B1D40" }}>{children}</div>
      <button onClick={closeBanner} className="p-1 ml-2 flex-shrink-0 hover:opacity-70" style={{ color: "#C9A96E" }} title="Tutup">
        <X size={16} />
      </button>
    </div>
  )
}
