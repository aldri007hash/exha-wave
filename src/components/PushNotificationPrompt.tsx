"use client"
import { useEffect, useState } from "react"
import { Bell } from "lucide-react"

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const hasAsked = localStorage.getItem("push-prompt-asked")
    if (hasAsked) return

    if ("Notification" in window && "serviceWorker" in navigator) {
      if (Notification.permission === "default") {
        setShowPrompt(true)
      }
    }
  }, [])

  const handleSubscribe = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        })

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        })
      }
    } catch (err) {
      console.error("Push subscription failed:", err)
    }
    localStorage.setItem("push-prompt-asked", "true")
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem("push-prompt-asked", "true")
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-2xl animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <Bell className="text-primary" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">Dapatkan Notifikasi!</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Izinkan notifikasi untuk mendapat update status pesanan secara real-time.
            </p>
            <div className="flex gap-2">
              <button onClick={handleSubscribe} className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-medium">
                Izinkan
              </button>
              <button onClick={handleDismiss} className="border border-border px-4 py-1.5 rounded-full text-xs">
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
