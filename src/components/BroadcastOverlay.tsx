"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { X } from "lucide-react"

export default function BroadcastOverlay() {
  const [pesan, setPesan] = useState<string | null>(null)
  const [title, setTitle] = useState<string>("")
  const [show, setShow] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTimeRef = useRef<number>(0)

  const closeBroadcast = useCallback(() => {
    setShow(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setTimeout(() => {
      setPesan(null)
      setTitle("")
    }, 300)
  }, [])

  useEffect(() => {
    // Inisialisasi audio
    audioRef.current = new Audio("/sounds/iphone.mp3")
    audioRef.current.volume = 0.6

    console.log("[BroadcastOverlay] Komponen dipasang, polling setiap 5 detik")

    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/broadcast/latest")
        if (res.ok) {
          const data = await res.json()
          if (data && data.time && data.time > lastTimeRef.current && (Date.now() - data.time) < 60000) {
            lastTimeRef.current = data.time
            if (document.visibilityState === "visible") {
              console.log("[BroadcastOverlay] Broadcast diterima:", data.pesan)
              setTitle(data.title || "PENGUMUMAN ADMIN")
              setPesan(data.pesan)
              setShow(true)
              // Coba putar suara (pastikan ada interaksi user sebelumnya)
              audioRef.current?.play().catch(() => {})
              if (timeoutRef.current) clearTimeout(timeoutRef.current)
              timeoutRef.current = setTimeout(() => closeBroadcast(), 5000)
            }
          }
        }
      } catch (err) {
        console.error("[BroadcastOverlay] Gagal fetch:", err)
      }
    }

    // Panggil pertama kali setelah 1 detik
    const initialTimeout = setTimeout(() => {
      fetchLatest()
    }, 1000)

    // Polling setiap 5 detik
    intervalRef.current = setInterval(fetchLatest, 5000)

    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [closeBroadcast])

  if (!pesan) return null

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-lg transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
      }`}
    >
      <div className="bg-gradient-to-r from-[#007AFF] via-[#5856D6] to-[#AF52DE] text-white px-4 py-3 sm:px-6 sm:py-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] font-semibold backdrop-blur-xl flex items-start gap-3">
        <svg className="w-6 h-6 flex-shrink-0 mt-0.5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-bold">{title}</p>
          <p className="text-xs sm:text-sm font-normal mt-0.5 break-words">{pesan}</p>
        </div>
        <button
          onClick={closeBroadcast}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 active:scale-90 transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
