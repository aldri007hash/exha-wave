"use client"

import { useEffect, useRef } from "react"
import { signOut } from "next-auth/react"

export default function ForceLogoutPolling() {
  const lastCheckRef = useRef<string | null>(null)
  const isChecking = useRef(false)

  useEffect(() => {
    if (!lastCheckRef.current) {
      lastCheckRef.current = new Date().toISOString()
    }

    const checkStatus = async () => {
      if (isChecking.current) return
      isChecking.current = true
      try {
        const res = await fetch("/api/auth/check-status")
        if (!res.ok) {
          console.warn("Check-status failed:", res.status)
          return
        }

        const data = await res.json()

        if (!data.valid) {
          signOut({ callbackUrl: "/login?error=session_expired" })
          return
        }

        // Cek BANNED
        if (data.status === "BANNED") {
          signOut({ callbackUrl: `/login?error=banned&reason=${encodeURIComponent(data.banReason || "Tidak ada alasan")}` })
          return
        }

        // Cek SUSPENDED
        if (data.status === "SUSPENDED" && data.suspendUntil) {
          const suspendUntil = new Date(data.suspendUntil)
          if (new Date() < suspendUntil) {
            signOut({
              callbackUrl: `/login?error=suspended&reason=${encodeURIComponent(data.banReason || "Tidak ada alasan")}&until=${suspendUntil.toLocaleDateString("id-ID")}`,
            })
            return
          }
        }

        // Cek PASSWORD CHANGED
        if (data.passwordChangedAt) {
          const passwordChangedAt = new Date(data.passwordChangedAt)
          const lastCheck = new Date(lastCheckRef.current!)
          if (passwordChangedAt > lastCheck) {
            signOut({ callbackUrl: "/login?error=password_changed" })
            return
          }
        }

        // Cek FORCE LOGOUT
        if (data.forceLogoutAt) {
          const forceLogoutAt = new Date(data.forceLogoutAt)
          const lastCheck = new Date(lastCheckRef.current!)
          if (forceLogoutAt > lastCheck) {
            signOut({ callbackUrl: "/login?error=force_logout" })
            return
          }
        }

        lastCheckRef.current = new Date().toISOString()
      } catch (err) {
        console.error("ForceLogoutPolling error:", err)
      } finally {
        isChecking.current = false
      }
    }

    // Jalankan segera, lalu setiap 60 detik
    checkStatus()
    const interval = setInterval(checkStatus, 60000)

    return () => clearInterval(interval)
  }, [])

  return null
}
