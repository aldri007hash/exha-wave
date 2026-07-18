"use client"
import { useState, useEffect } from "react"

interface Competitor {
  id: string
  platform: string
  service: string
  competitorName: string
  competitorPrice: number
  ourPrice: number
}

export default function AdminCompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [form, setForm] = useState({
    platform: "",
    service: "",
    competitorName: "",
    competitorPrice: 0,
    ourPrice: 0,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCompetitors = async () => {
    const res = await fetch("/api/admin/competitors")
    const data = await res.json()
    setCompetitors(data.competitors || [])
    setLoading(false)
  }

  useEffect(() => { fetchCompetitors() }, [])

  const handleSubmit = async () => {
    if (editingId) {
      await fetch("/api/admin/competitors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form }),
      })
    } else {
      await fetch("/api/admin/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    }
    setEditingId(null)
    setForm({ platform: "", service: "", competitorName: "", competitorPrice: 0, ourPrice: 0 })
    fetchCompetitors()
  }

  const handleEdit = (comp: Competitor) => {
    setForm({
      platform: comp.platform,
      service: comp.service,
      competitorName: comp.competitorName,
      competitorPrice: comp.competitorPrice,
      ourPrice: comp.ourPrice,
    })
    setEditingId(comp.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data?")) return
    await fetch(`/api/admin/competitors?id=${id}`, { method: "DELETE" })
    fetchCompetitors()
  }

  if (loading) return <p className="text-center py-12">Memuat data...</p>

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Analisis Kompetitor</h2>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-3">{editingId ? "Edit" : "Tambah"} Data Kompetitor</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input placeholder="Platform" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
          <input placeholder="Layanan" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
          <input placeholder="Nama Kompetitor" value={form.competitorName} onChange={e => setForm({ ...form, competitorName: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
          <input type="number" placeholder="Harga Kompetitor" value={form.competitorPrice} onChange={e => setForm({ ...form, competitorPrice: Number(e.target.value) })} className="border rounded px-3 py-2 bg-transparent" />
          <input type="number" placeholder="Harga Kita" value={form.ourPrice} onChange={e => setForm({ ...form, ourPrice: Number(e.target.value) })} className="border rounded px-3 py-2 bg-transparent" />
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleSubmit} className="bg-primary text-white px-4 py-2 rounded-full">{editingId ? "Update" : "Tambah"}</button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setForm({ platform: "", service: "", competitorName: "", competitorPrice: 0, ourPrice: 0 }) }} className="border px-4 py-2 rounded-full">Batal</button>
          )}
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-4">Daftar Perbandingan</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Platform</th>
              <th className="text-left py-2">Layanan</th>
              <th className="text-left py-2">Kompetitor</th>
              <th className="text-left py-2">Harga Kompetitor</th>
              <th className="text-left py-2">Harga Exha</th>
              <th className="text-left py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map(comp => (
              <tr key={comp.id} className="border-b">
                <td className="py-2">{comp.platform}</td>
                <td className="py-2">{comp.service}</td>
                <td className="py-2">{comp.competitorName}</td>
                <td className="py-2">Rp {comp.competitorPrice.toLocaleString()}</td>
                <td className="py-2">Rp {comp.ourPrice.toLocaleString()}</td>
                <td className="py-2 flex gap-2">
                  <button onClick={() => handleEdit(comp)} className="text-primary">Edit</button>
                  <button onClick={() => handleDelete(comp.id)} className="text-red-500">Hapus</button>
                </td>
              </tr>
            ))}
            {competitors.length === 0 && (
              <tr><td colSpan={6} className="py-4 text-center text-gray-500">Belum ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}