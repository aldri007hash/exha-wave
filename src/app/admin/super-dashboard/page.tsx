"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Shield, Users, ShoppingCart, DollarSign, MessageSquare, Activity } from "lucide-react"

interface AdminStat {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastLoginAt: string | null
  createdAt: string
  orderActions: number
  userActions: number
  chatHandled: number
  chatUnhandled: number
}

interface Activity {
  id: string
  adminName: string
  adminEmail: string
  action: string
  ip: string
  userAgent: string
  timestamp: string
}

interface Summary {
  totalAdmins: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  pendingChats: number
}

export default function SuperDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [admins, setAdmins] = useState<AdminStat[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/super-dashboard")
      if (!res.ok) throw new Error("Gagal memuat data")
      const data = await res.json()
      setAdmins(data.admins || [])
      setActivities(data.recentActivities || [])
      setSummary(data.summary)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user?.role !== "SUPER_ADMIN") {
      router.push("/admin")
      return
    }
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [status, session, router, fetchData])

  if (loading) return <p className="p-4">Memuat data superadmin...</p>
  if (error) return <p className="p-4 text-red-500">{error}</p>

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="text-yellow-500" size={28} />
        <h1 className="text-2xl font-bold">Super Dashboard - Monitoring Admin</h1>
      </div>

      {/* Ringkasan */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2"><Users size={18} className="text-primary" /><span className="text-sm text-gray-500">Admin</span></div>
            <p className="text-2xl font-bold">{summary.totalAdmins}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2"><ShoppingCart size={18} className="text-primary" /><span className="text-sm text-gray-500">Total Order</span></div>
            <p className="text-2xl font-bold">{summary.totalOrders}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2"><Users size={18} className="text-primary" /><span className="text-sm text-gray-500">User</span></div>
            <p className="text-2xl font-bold">{summary.totalUsers}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2"><DollarSign size={18} className="text-primary" /><span className="text-sm text-gray-500">Pendapatan</span></div>
            <p className="text-2xl font-bold">Rp {summary.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2"><MessageSquare size={18} className="text-primary" /><span className="text-sm text-gray-500">Chat Pending</span></div>
            <p className="text-2xl font-bold">{summary.pendingChats}</p>
          </div>
        </div>
      )}

      {/* Tabel Admin */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-2 flex items-center gap-2"><Activity size={18} /> Kinerja Admin</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Nama</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Login Terakhir</th>
                <th className="text-left py-2">Order Diproses</th>
                <th className="text-left py-2">User Diatur</th>
                <th className="text-left py-2">Chat Di-handle</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b">
                  <td className="py-2">{admin.name}<br /><span className="text-xs text-gray-400">{admin.email}</span></td>
                  <td className="py-2">{admin.role}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${admin.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{admin.status}</span></td>
                  <td className="py-2 text-xs">{admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString("id-ID") : "-"}</td>
                  <td className="py-2">{admin.orderActions}</td>
                  <td className="py-2">{admin.userActions}</td>
                  <td className="py-2">{admin.chatHandled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Aktivitas Terbaru */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-2">Log Aktivitas Terbaru</h2>
        {activities.length === 0 ? (
          <p className="text-gray-500">Belum ada aktivitas.</p>
        ) : (
          <ul className="space-y-1 max-h-80 overflow-y-auto">
            {activities.map((act) => (
              <li key={act.id} className="text-sm border-b pb-1">
                <span className="font-medium">{act.adminName}</span> ({act.adminEmail}) - {act.action} -{" "}
                {new Date(act.timestamp).toLocaleString("id-ID", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
