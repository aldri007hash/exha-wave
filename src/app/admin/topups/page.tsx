"use client"
import { useState, useEffect } from "react"
import { Eye } from "lucide-react"

export default function AdminTopupsPage() {
  const [topups, setTopups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const fetchTopups = async () => {
    const res = await fetch("/api/admin/topups")
    const data = await res.json()
    setTopups(data.topups || [])
    setLoading(false)
  }

  useEffect(() => { fetchTopups() }, [])

  const formatTime = (d: string) => new Date(d).toLocaleString("id-ID")

  if (loading) return <p className="text-center py-12">Memuat...</p>

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Riwayat Topup Saldo</h2>

      <div className="bg-card border border-border rounded-xl p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">User</th>
              <th className="text-left py-2">Jumlah</th>
              <th className="text-left py-2">Metode</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Waktu</th>
              <th className="text-left py-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {topups.map((t: any) => (
              <tr key={t.id} className="border-b">
                <td className="py-2">{t.user.name}</td>
                <td className="py-2">Rp {t.amount.toLocaleString()}</td>
                <td className="py-2">{t.paymentMethod}</td>
                <td className="py-2">{t.status}</td>
                <td className="py-2 text-xs">{formatTime(t.createdAt)}</td>
                <td className="py-2">
                  <button onClick={() => setSelectedUser(t.user)} className="text-primary"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-background rounded-xl p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-semibold mb-4">Detail User</h3>
            <p><strong>Nama:</strong> {selectedUser.name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Telepon:</strong> {selectedUser.phone || "-"}</p>
            <button onClick={() => setSelectedUser(null)} className="mt-4 border px-4 py-2 rounded-full w-full">Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}