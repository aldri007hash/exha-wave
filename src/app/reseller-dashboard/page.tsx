"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Copy, Check, BarChart3, ShoppingCart } from "lucide-react"

export default function ResellerDashboardPage() {
  const { data: session, status } = useSession()
  const [apiKey, setApiKey] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login")
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/reseller/my-key").then(r => r.json()),
        fetch("/api/reseller/stats").then(r => r.json()),
      ]).then(([keyData, statsData]) => {
        setApiKey(keyData.apiKey || null)
        setStats(statsData)
        setLoading(false)
      })
    }
  }, [status])

  if (status === "loading" || loading) return <p className="p-4">Memuat...</p>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold mb-6">Dashboard Reseller</h1>
      {apiKey ? (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">✅ Akun reseller Anda aktif</div>
          <div>
            <p className="text-sm text-gray-500 mb-1">API Key Anda:</p>
            <div className="flex items-center gap-2"><code className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-sm font-mono break-all flex-1">{apiKey.key}</code><button onClick={() => { navigator.clipboard.writeText(apiKey.key); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="p-2 bg-primary text-white rounded-lg hover:bg-primary/80">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>
          </div>
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card/50 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2"><ShoppingCart size={16} className="text-primary" /><span className="text-sm text-gray-500">Total Order</span></div>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="bg-card/50 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2"><BarChart3 size={16} className="text-primary" /><span className="text-sm text-gray-500">Total API Calls</span></div>
                <p className="text-2xl font-bold">{stats.totalApiCalls}</p>
              </div>
            </div>
          )}
          <div className="text-sm text-gray-500"><p>Gunakan API Key ini dengan header <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">x-api-key</code> pada setiap request.</p><p className="mt-1">Baca dokumentasi lengkap di <a href="/dokumentasi-api" className="text-primary hover:underline">Dokumentasi API</a>.</p></div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center"><p className="text-gray-500 mb-4">Anda belum memiliki API Key reseller.</p><a href="/daftar-reseller" className="text-primary hover:underline">Daftar sebagai Reseller</a></div>
      )}
    </div>
  )
}
