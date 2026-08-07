"use client"
import { useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function SoundNotifier() {
  const { data: session } = useSession()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastNotifIds = useRef<Set<string>>(new Set())

  const { data: soundsData } = useSWR("/api/sounds", fetcher, { refreshInterval: 0 })
  const sounds = soundsData?.sounds || []

  const { data: notifData } = useSWR(session?.user ? "/api/notifications" : null, fetcher, { refreshInterval: 60000 })

  const playSound = useCallback((category: string) => {
    const matching = sounds.find((s: any) => s.category === category)
    if (matching && audioRef.current) {
      audioRef.current.src = matching.fileUrl
      audioRef.current.play().catch(e => console.error("Gagal putar suara:", e))
    }
  }, [sounds])

  useEffect(() => {
    if (!notifData?.notifications) return
    for (const n of notifData.notifications) {
      if (lastNotifIds.current.has(n.id)) continue
      lastNotifIds.current.add(n.id)
      if (n.title === "Pesanan Baru") playSound("pesanan_baru")
      else if (n.title === "Status Pesanan Diperbarui") playSound("perubahan_status")
      else if (n.title === "Pesan Chat Masuk") playSound("pesan_chat")
    }
  }, [notifData, playSound])

  return <audio ref={audioRef} className="hidden" />
}