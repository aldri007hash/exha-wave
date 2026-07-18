"use client"
import { SessionProvider } from "next-auth/react"
import { useTheme } from "@/hooks/useTheme"

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  return <SessionProvider>{children}</SessionProvider>
}