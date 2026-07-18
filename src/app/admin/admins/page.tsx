"use client"
import { useState, useEffect } from "react"
import { Shield, Trash2 } from "lucide-react"

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", username: "", email: "", phone: "", password: "" })

  const fetchAdmins = async () => {
    const res = await fetch("/api/admin/admins")
    const data = await res.json()
    setAdmins(data.admins || [])
    setLoading(false)
  }

  useEffect(() => { fetchAdmins() }, [])

  const handleCreate = async () => {
    await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ name: "", username: "", email: "", phone: "", password: "" })
    fetchAdmins()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus admin ini?")) return
    await fetch(`/api/admin/admins?id=${id}`, { method: "DELETE" })
    fetchAdmins()
  }

  if (loading) return <p className="text-center py-12">Memuat...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold">Kelola Admin</h2>
        <button onClick={() => setShowForm(true)} className="bg-primary text-white px-4 py-2 rounded-full flex items-center gap-2">
          <Shield size={16} /> Tambah Admin
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3">Tambah Admin Baru</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Nama" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
            <input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
            <input placeholder="Telepon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
            <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} className="bg-primary text-white px-4 py-2 rounded-full">Simpan</button>
            <button onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-full">Batal</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Nama</th>
              <th className="text-left py-2">Email</th>
              <th className="text-left py-2">Username</th>
              <th className="text-left py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin: any) => (
              <tr key={admin.id} className="border-b">
                <td className="py-2">{admin.name}</td>
                <td className="py-2">{admin.email}</td>
                <td className="py-2">{admin.username}</td>
                <td className="py-2">
                  <button onClick={() => handleDelete(admin.id)} className="text-red-500"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}