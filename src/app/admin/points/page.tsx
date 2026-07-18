"use client"
import { useState, useEffect } from "react"
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react"

interface PointHistory {
  id: string
  name: string
  poin: number
  userCount: number
  createdAt: string
  admin: { name: string }
}

interface User {
  id: string
  name: string
  email: string
}

export default function AdminPointsPage() {
  const [form, setForm] = useState({ name: "", kuota: 0, poin: 0, targetUserId: "" })
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [history, setHistory] = useState<PointHistory[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    const res = await fetch(`/api/admin/points?page=${page}&limit=10`)
    const data = await res.json()
    setHistory(data.history || [])
    setTotalPages(data.pagination?.totalPages || 1)
    setLoading(false)
  }

  useEffect(() => {
    fetch("/api/admin/users?limit=9999")
      .then(res => res.json())
      .then(data => setAllUsers(data.users || []))
    fetchHistory()
  }, [page])

  const filteredUsers = allUsers.filter(
    u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleShare = async () => {
    if (form.targetUserId) {
      await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, userIds: [form.targetUserId], poin: form.poin }),
      })
    } else if (form.kuota > 0) {
      await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, kuota: form.kuota, poin: form.poin }),
      })
    }
    setForm({ name: "", kuota: 0, poin: 0, targetUserId: "" })
    setPage(1)
    fetchHistory()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus riwayat ini?")) return
    await fetch(`/api/admin/points?id=${id}`, { method: "DELETE" })
    fetchHistory()
  }

  const handleDeleteAll = async () => {
    if (!confirm("Hapus SEMUA riwayat pemberian poin?")) return
    await fetch(`/api/admin/points?all=true`, { method: "DELETE" })
    fetchHistory()
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Manajemen Exha Points</h2>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-6 max-w-2xl mb-8">
        <h3 className="font-semibold mb-4">Bagikan Bonus Poin</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Nama Bonus</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" placeholder="Misal: Bonus Login" />
          </div>
          <div>
            <label className="block text-sm mb-1">Jumlah Poin per User</label>
            <input type="number" value={form.poin} onChange={e => setForm({ ...form, poin: Number(e.target.value) })} className="border rounded px-3 py-2 w-full bg-transparent" />
          </div>
          <div>
            <label className="block text-sm mb-1">Pilih User Spesifik (opsional)</label>
            <div className="relative">
              <input placeholder="Cari user..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border rounded px-3 py-2 w-full bg-transparent mb-1" />
              <select value={form.targetUserId} onChange={e => setForm({ ...form, targetUserId: e.target.value, kuota: 0 })} className="border rounded px-3 py-2 w-full bg-transparent">
                <option value="">Semua User (kuota)</option>
                {filteredUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          </div>
          {!form.targetUserId && (
            <div>
              <label className="block text-sm mb-1">Kuota (Jumlah User)</label>
              <input type="number" value={form.kuota} onChange={e => setForm({ ...form, kuota: Number(e.target.value) })} className="border rounded px-3 py-2 w-full bg-transparent" />
            </div>
          )}
        </div>
        <button onClick={handleShare} className="bg-primary text-white px-4 py-2 rounded-full mt-4">Bagikan</button>
      </div>

      {/* Riwayat */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Riwayat Pemberian Poin</h3>
          <button onClick={handleDeleteAll} className="text-red-500 text-sm flex items-center gap-1">
            <Trash2 size={14} /> Hapus Semua
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada riwayat.</p>
        ) : (
          <>
            <div className="space-y-2">
              {history.map(item => (
                <div key={item.id} className="flex justify-between items-center p-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">Oleh {item.admin.name} · {item.userCount} user · +{item.poin} poin</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString("id-ID")}</span>
                    <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-2 border rounded-full disabled:opacity-50"><ChevronLeft size={18} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-full text-sm ${p === page ? "bg-primary text-white" : "border hover:bg-primary/10"}`}>{p}</button>
                ))}
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="p-2 border rounded-full disabled:opacity-50"><ChevronRight size={18} /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}