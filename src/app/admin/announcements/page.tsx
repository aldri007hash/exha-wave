"use client"
import { useState, useEffect } from "react"
import { Trash2, Plus } from "lucide-react"

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchAnnouncements = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/announcements")
    const data = await res.json()
    setAnnouncements(data.announcements || [])
    setLoading(false)
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    const formData = new FormData()
    formData.append("title", title)
    formData.append("content", content)
    if (image) formData.append("image", image)
    await fetch("/api/admin/announcements", { method: "POST", body: formData })
    setTitle(""); setContent(""); setImage(null); setShowForm(false)
    fetchAnnouncements()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengumuman ini?")) return
    await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" })
    fetchAnnouncements()
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pengumuman</h1>
        <button onClick={() => setShowForm(true)} className="bg-primary text-white px-4 py-2 rounded-full flex items-center gap-2"><Plus size={18} /> Tambah Pengumuman</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 w-full max-w-md">
            <h3 className="font-heading font-semibold mb-4">Tambah Pengumuman</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Judul" value={title} onChange={e => setTitle(e.target.value)} className="border rounded px-3 py-2 w-full bg-transparent" required />
              <textarea placeholder="Isi pengumuman" value={content} onChange={e => setContent(e.target.value)} className="border rounded px-3 py-2 w-full bg-transparent" rows={4} required />
              <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-full">Batal</button>
                <button type="submit" disabled={saving} className="bg-primary text-white px-4 py-2 rounded-full disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <p>Memuat...</p> : announcements.length === 0 ? <p className="text-gray-500">Belum ada pengumuman.</p> : (
        <div className="space-y-4">
          {announcements.map((a: any) => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{a.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{a.content}</p>
                {a.imageUrl && <img src={a.imageUrl} alt="gambar" className="mt-2 max-w-xs rounded-lg" />}
                <span className={`text-xs ${a.isActive ? "text-green-500" : "text-red-500"}`}>{a.isActive ? "Aktif" : "Nonaktif"}</span>
                <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleString("id-ID")}</p>
              </div>
              <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-full"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
