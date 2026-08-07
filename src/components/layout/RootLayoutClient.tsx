"use client"

import { usePathname } from "next/navigation"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import MobileBottomNav from "@/components/MobileBottomNav"
import BroadcastOverlay from "@/components/BroadcastOverlay"

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password")

  if (isAdmin || isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      <BroadcastOverlay />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  )
}
