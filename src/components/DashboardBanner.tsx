"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"

export default function DashboardBanner() {
  const { data: session } = useSession()
  const [walletBalance, setWalletBalance] = useState(0)

  useEffect(() => {
    if (session?.user) {
      fetch("/api/wallet")
        .then(res => res.json())
        .then(data => setWalletBalance(data.balance || 0))
    }
  }, [session])

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3 mb-6 text-sm">
      👋 Selamat datang kembali, {session?.user?.name || "User"}! Saldo kamu: <strong className="text-green-600">{formatCurrency(walletBalance)}</strong>. Ada Promo Setiap Hari Disini!
    </div>
  )
}
