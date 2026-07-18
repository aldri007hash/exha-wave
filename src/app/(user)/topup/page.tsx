"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Script from "next/script"
import { formatCurrency } from "@/lib/utils"

declare global {
  interface Window {
    snap: any
  }
}

export default function TopupPage() {
  const { data: session } = useSession()
  const [amount, setAmount] = useState<number | "">("")
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [minTopup, setMinTopup] = useState(15000)
  const [maxTopup, setMaxTopup] = useState(1000000)

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        setMinTopup(data.minTopup)
        setMaxTopup(data.maxTopup)
      })
    if (session?.user) {
      fetch("/api/wallet")
        .then(res => res.json())
        .then(data => setWalletBalance(data.balance || 0))
    }
  }, [session])

  if (!session?.user) redirect("/login")

  const handleTopup = async () => {
    const numAmount = Number(amount)
    if (!numAmount || numAmount < minTopup) {
      setError(`Minimal topup ${formatCurrency(minTopup)}`)
      return
    }
    if (numAmount > maxTopup) {
      setError(`Maksimal topup ${formatCurrency(maxTopup)}`)
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount }),
      })
      const data = await res.json()
      if (data.snapToken) {
        // Tampilkan popup Midtrans
        window.snap.pay(data.snapToken, {
          onSuccess: function (result: any) {
            console.log("success", result)
            setWalletBalance(prev => prev + numAmount)
            alert("Top up berhasil!")
          },
          onPending: function (result: any) {
            console.log("pending", result)
            alert("Menunggu pembayaran...")
          },
          onError: function (result: any) {
            console.log("error", result)
            alert("Pembayaran gagal")
          },
          onClose: function () {
            console.log("customer closed the popup without finishing the payment")
          },
        })
      } else {
        setError(data.error || "Gagal membuat topup")
      }
    } catch {
      setError("Terjadi kesalahan jaringan")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      {/* Load Snap.js dari Midtrans */}
      <Script src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js"} data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""} />

      <h1 className="font-heading text-3xl font-bold mb-2">Topup Saldo Exha</h1>
      <p className="text-muted-foreground mb-6">
        Saldo saat ini: <strong className="text-primary">{formatCurrency(walletBalance)}</strong>
      </p>

      <div className="bg-card border border-border rounded-xl p-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>
        )}
        <div className="mb-4">
          <label className="text-sm mb-1 block font-medium">Jumlah Topup</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder={`Minimal ${formatCurrency(minTopup)}`}
            value={amount}
            onChange={e => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className="border rounded-xl px-3 py-3 w-full bg-transparent text-lg font-semibold"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Minimal {formatCurrency(minTopup)} — Maksimal {formatCurrency(maxTopup)}
          </p>
        </div>

        <button
          onClick={handleTopup}
          disabled={loading}
          className="ripple w-full bg-primary text-white py-3.5 rounded-xl font-semibold disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Topup Sekarang"}
        </button>
      </div>
    </div>
  )
}