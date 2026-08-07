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

const quickAmounts = [
  { value: 15000, label: "Rp 15.000" },
  { value: 20000, label: "Rp 20.000" },
  { value: 50000, label: "Rp 50.000" },
  { value: 100000, label: "Rp 100.000", popular: true },
  { value: 200000, label: "Rp 200.000" },
  { value: 500000, label: "Rp 500.000" },
  { value: 1000000, label: "Rp 1.000.000" },
]

export default function TopupPage() {
  const { data: session, status } = useSession()
  const [amount, setAmount] = useState<number | "">("")
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [minTopup, setMinTopup] = useState(15000)
  const [maxTopup, setMaxTopup] = useState(1000000)

  // State promo diskon tanggal
  const [activePromo, setActivePromo] = useState<any>(null)

  // Riwayat transaksi
  const [transactions, setTransactions] = useState<any[]>([])
  const [transFilter, setTransFilter] = useState("ALL")
  const [transPage, setTransPage] = useState(1)
  const [transTotalPages, setTransTotalPages] = useState(1)

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login")
  }, [status])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        setMinTopup(data.minTopup)
        setMaxTopup(data.maxTopup)
      })
    fetch("/api/wallet")
      .then(res => res.json())
      .then(data => setWalletBalance(data.balance || 0))
    fetchHistory()
    fetchActivePromo()
  }, [status, transFilter, transPage])

  const fetchHistory = async () => {
    try {
      const params = new URLSearchParams()
      params.set("page", String(transPage))
      params.set("limit", "10")
      if (transFilter !== "ALL") params.set("status", transFilter)
      const res = await fetch(`/api/topup/history?${params.toString()}`)
      const data = await res.json()
      setTransactions(data.transactions || [])
      setTransTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      console.error("Gagal fetch history:", err)
    }
  }

  const fetchActivePromo = async () => {
    try {
      const res = await fetch("/api/promo")
      const data = await res.json()
      if (data.promos?.length > 0) {
        // Cari promo DISKON_TANGGAL yang aktif
        const diskonTanggal = data.promos.find((p: any) => p.promoType === "DISKON_TANGGAL")
        if (diskonTanggal) {
          setActivePromo(diskonTanggal)
        } else {
          setActivePromo(null)
        }
      }
    } catch (err) {
      console.error("Gagal fetch promo:", err)
    }
  }

  if (status === "loading") {
    return <div className="text-center py-12">Memeriksa sesi...</div>
  }

  const calculateDiscount = () => {
    const numAmount = Number(amount)
    if (activePromo && numAmount >= activePromo.minAmount) {
      return Math.round(numAmount * (activePromo.discount / 100))
    }
    return 0
  }

  const discount = calculateDiscount()
  const finalAmount = Number(amount) || 0
  const totalAfterDiscount = finalAmount - discount

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
        body: JSON.stringify({ amount: totalAfterDiscount }),
      })
      const data = await res.json()
      if (data.snapToken) {
        window.snap.pay(data.snapToken, {
          onSuccess: function () {
            setWalletBalance(prev => prev + totalAfterDiscount)
            alert("Top up berhasil!")
            fetchHistory()
          },
          onPending: function () {
            alert("Menunggu pembayaran...")
            fetchHistory()
          },
          onError: function () {
            alert("Pembayaran gagal")
          },
          onClose: function () {},
        })
      } else {
        setError(data.error || "Gagal membuat topup")
      }
    } catch {
      setError("Terjadi kesalahan jaringan")
    }
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    SUCCESS: "text-green-600 bg-green-100 dark:bg-green-900/20",
    PENDING: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20",
    FAILED: "text-red-600 bg-red-100 dark:bg-red-900/20",
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Script src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.midtrans.com/snap/snap.js"} data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""} />

      <h1 className="font-heading text-3xl font-bold mb-2">Topup Saldo Exha</h1>
      <p className="text-muted-foreground mb-6">
        Saldo saat ini: <strong className="text-primary">{formatCurrency(walletBalance)}</strong>
      </p>

      {/* Banner Promo Diskon Tanggal */}
      {activePromo && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-4 text-center">
          <p className="font-semibold text-yellow-700 dark:text-yellow-300">{activePromo.title}</p>
          <p className="text-sm">Diskon {activePromo.discount}% untuk topup minimal {formatCurrency(activePromo.minAmount)}</p>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 mb-8">
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
        </div>

        <div className="mb-4">
          <label className="text-sm mb-2 block font-medium">Pilih Nominal Cepat</label>
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((item) => {
              const isSelected = Number(amount) === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setAmount(item.value)}
                  className={`relative py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {item.label}
                  {item.popular && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">Terlaris</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {discount > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3 mb-4 text-sm">
            <p className="flex justify-between"><span>Total Topup</span><span>{formatCurrency(finalAmount)}</span></p>
            <p className="flex justify-between text-green-600"><span>Diskon ({activePromo?.discount}%)</span><span>-{formatCurrency(discount)}</span></p>
            <p className="flex justify-between font-bold mt-1 pt-1 border-t"><span>Total Bayar</span><span>{formatCurrency(totalAfterDiscount)}</span></p>
          </div>
        )}

        <button
          onClick={handleTopup}
          disabled={loading}
          className="ripple w-full bg-primary text-white py-3.5 rounded-xl font-semibold disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Topup Sekarang"}
        </button>

        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs text-center text-muted-foreground mb-3">Mendukung Metode Pembayaran:</p>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-medium"><span className="text-lg">🔳</span> QRIS</div>
            <div className="flex items-center gap-1.5 text-xs font-medium"><span className="text-lg">💙</span> DANA</div>
            <div className="flex items-center gap-1.5 text-xs font-medium"><span className="text-lg">🟣</span> OVO</div>
            <div className="flex items-center gap-1.5 text-xs font-medium"><span className="text-lg">🟢</span> GOPAY</div>
            <div className="flex items-center gap-1.5 text-xs font-medium"><span className="text-lg">🏦</span> Bank BRI</div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading text-xl font-bold mb-4">Riwayat Transaksi</h2>
        <div className="flex gap-2 mb-4">
          {["ALL", "SUCCESS", "PENDING", "FAILED"].map((f) => (
            <button
              key={f}
              onClick={() => { setTransFilter(f); setTransPage(1) }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                transFilter === f
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {f === "ALL" ? "Semua" : f === "SUCCESS" ? "Berhasil" : f === "PENDING" ? "Pending" : "Gagal"}
            </button>
          ))}
        </div>

        {transactions.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">Belum ada transaksi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 text-xs font-medium text-gray-500">Tanggal</th>
                  <th className="py-2 text-xs font-medium text-gray-500">Nominal</th>
                  <th className="py-2 text-xs font-medium text-gray-500">Metode</th>
                  <th className="py-2 text-xs font-medium text-gray-500">Status</th>
                  <th className="py-2 text-xs font-medium text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t: any) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2 text-xs">
                      {new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      <br />
                      <span className="text-gray-400">{new Date(t.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td className="py-2 font-medium">+Rp {t.amount.toLocaleString("id-ID")}</td>
                    <td className="py-2 text-xs">{t.paymentMethod || "-"}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[t.status] || "text-gray-500 bg-gray-100"}`}>
                        {t.status === "SUCCESS" ? "Berhasil" : t.status === "PENDING" ? "Pending" : t.status === "FAILED" ? "Gagal" : t.status}
                      </span>
                    </td>
                    <td className="py-2">
                      <a href={`/api/topup/receipt?id=${t.id}`} target="_blank" className="text-xs text-primary hover:underline">📄 Download</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {transTotalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button onClick={() => setTransPage(transPage - 1)} disabled={transPage <= 1} className="p-1.5 border rounded-full disabled:opacity-50">←</button>
            <span className="text-xs text-gray-500">{transPage} / {transTotalPages}</span>
            <button onClick={() => setTransPage(transPage + 1)} disabled={transPage >= transTotalPages} className="p-1.5 border rounded-full disabled:opacity-50">→</button>
          </div>
        )}
      </div>
    </div>
  )
}
