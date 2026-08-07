"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet } from "lucide-react"

export default function FinancePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user?.role !== "SUPER_ADMIN") {
      router.push("/admin")
      return
    }
    fetch("/api/admin/finance")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status, session, router])

  if (loading) return <p className="p-4">Memuat data keuangan...</p>
  if (!data) return <p className="p-4 text-red-500">Gagal memuat data</p>

  const { summary, chartData } = data

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign size={24} /> Laporan Keuangan</h1>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2"><TrendingUp size={18} className="text-green-500" /><span className="text-sm text-gray-500">Pemasukan</span></div>
          <p className="text-xl font-bold">Rp {summary.revenue.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">Dari pesanan selesai</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2"><CreditCard size={18} className="text-blue-500" /><span className="text-sm text-gray-500">Topup Sukses</span></div>
          <p className="text-xl font-bold">Rp {summary.topupSuccess.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2"><Wallet size={18} className="text-yellow-500" /><span className="text-sm text-gray-500">Topup Pending</span></div>
          <p className="text-xl font-bold">Rp {summary.topupPending.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2"><TrendingDown size={18} className="text-red-500" /><span className="text-sm text-gray-500">Refund</span></div>
          <p className="text-xl font-bold">Rp {summary.refund.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2"><DollarSign size={18} className="text-primary" /><span className="text-sm text-gray-500">Laba Kotor</span></div>
          <p className="text-xl font-bold">Rp {summary.labaKotor.toLocaleString()}</p>
        </div>
      </div>

      {/* Grafik */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-4">Pendapatan & Refund per Bulan</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bulan" />
            <YAxis />
            <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="pendapatan" fill="#0088FE" name="Pendapatan" />
            <Bar dataKey="refund" fill="#FF8042" name="Refund" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-4">Laba Bersih per Bulan</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bulan" />
            <YAxis />
            <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="laba" stroke="#00C49F" name="Laba" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
