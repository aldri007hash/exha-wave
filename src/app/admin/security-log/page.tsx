"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Shield, ChevronLeft, ChevronRight } from "lucide-react"

export default function SecurityLogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/security-log?page=${page}&limit=50`)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user?.role !== "SUPER_ADMIN") {
      router.push("/admin")
      return
    }
    fetchLogs()
  }, [status, session, router, page])

  const actionLabel = (action: string) => {
    switch (action) {
      case "LOGIN_FAILED": return "Login Gagal"
      case "RESET_PASSWORD": return "Reset Password"
      case "DELETE_SERVICE": return "Hapus Layanan"
      case "DELETE_USER": return "Hapus User"
      case "DELETE_ORDER": return "Hapus Pesanan"
      default: return action
    }
  }

  const actionColor = (action: string) => {
    if (action.includes("FAILED")) return "text-red-600 bg-red-50 dark:bg-red-900/20"
    if (action.includes("DELETE")) return "text-orange-600 bg-orange-50 dark:bg-orange-900/20"
    return "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Shield size={24} className="text-red-500" />
        <h1 className="text-2xl font-bold">Log Keamanan</h1>
      </div>

      {loading ? <p>Memuat...</p> : logs.length === 0 ? <p className="text-gray-500">Belum ada log keamanan.</p> : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Admin</th>
                  <th className="text-left py-3 px-4">Aksi</th>
                  <th className="text-left py-3 px-4">Waktu</th>
                  <th className="text-left py-3 px-4">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b">
                    <td className="py-2 px-4">{log.adminName}<br /><span className="text-xs text-gray-400">{log.adminEmail}</span></td>
                    <td className="py-2 px-4"><span className={`px-2 py-0.5 rounded-full text-xs ${actionColor(log.action)}`}>{actionLabel(log.action)}</span></td>
                    <td className="py-2 px-4 text-xs">{new Date(log.timestamp).toLocaleString("id-ID")}</td>
                    <td className="py-2 px-4 text-xs">{log.ip || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 border rounded-full disabled:opacity-50"><ChevronLeft size={18} /></button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 border rounded-full disabled:opacity-50"><ChevronRight size={18} /></button>
        </div>
      )}
    </div>
  )
}
