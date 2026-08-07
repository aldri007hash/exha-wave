"use client"
import { useState, useEffect } from "react"
import { X } from "lucide-react"

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    fetch("/api/announcements")
      .then(r => r.json())
      .then(data => {
        if (data.announcement) {
          setAnnouncement(data.announcement)
          // Cek apakah pengumuman ini sudah pernah ditutup sebelumnya (di localStorage)
          const closed = localStorage.getItem(`announcement-closed-${data.announcement.id}`)
          if (!closed) {
            setShow(true)
          }
        }
      })
  }, [])

  const closePopup = () => {
    setShow(false)
    if (announcement) {
      localStorage.setItem(`announcement-closed-${announcement.id}`, "true")
    }
  }

  if (!announcement || !show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button onClick={closePopup} className="absolute top-3 right-3 p-1 hover:bg-card rounded-full"><X size={18} /></button>
        <h2 className="font-heading text-xl font-bold mb-2">{announcement.title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{announcement.content}</p>
        {announcement.imageUrl && (
          <img src={announcement.imageUrl} alt="pengumuman" className="rounded-lg max-h-60 w-full object-cover" />
        )}
      </div>
    </div>
  )
}
