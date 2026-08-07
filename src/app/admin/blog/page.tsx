"use client"
import { useState, useEffect } from "react"
import { Trash2, Edit, Plus } from "lucide-react"

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)
  const [form, setForm] = useState({ title: "", content: "", excerpt: "", image: "", published: false })

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/blog")
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (err) {
      console.error("Gagal memuat blog:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPosts() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return

    if (editingPost) {
      await fetch("/api/admin/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingPost.id, ...form }),
      })
    } else {
      await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    }
    setShowForm(false)
    setEditingPost(null)
    setForm({ title: "", content: "", excerpt: "", image: "", published: false })
    fetchPosts()
  }

  const handleEdit = (post: any) => {
    setEditingPost(post)
    setForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
      image: post.image || "",
      published: post.published,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus artikel ini?")) return
    await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" })
    fetchPosts()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold">Kelola Blog</h2>
        <button onClick={() => { setShowForm(true); setEditingPost(null); setForm({ title: "", content: "", excerpt: "", image: "", published: false }) }} className="bg-primary text-white px-4 py-2 rounded-full flex items-center gap-2">
          <Plus size={18} /> Artikel Baru
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">{editingPost ? "Edit" : "Tambah"} Artikel</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input placeholder="Judul" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" required />
            <textarea placeholder="Konten (HTML)" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} className="border rounded px-3 py-2 w-full bg-transparent" required />
            <input placeholder="Kutipan (ringkasan)" value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" />
            <input placeholder="URL Gambar (opsional)" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
              Publikasikan
            </label>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-full">{editingPost ? "Update" : "Simpan"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-full">Batal</button>
            </div>
          </form>
        </div>
      )}

      {/* Daftar Artikel */}
      {loading ? (
        <p className="text-center py-12">Memuat...</p>
      ) : posts.length === 0 ? (
        <p className="text-center py-12 text-gray-500">Belum ada artikel.</p>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{post.title}</h3>
                <p className="text-sm text-gray-500">{post.excerpt}</p>
                <span className={`text-xs ${post.published ? "text-green-500" : "text-yellow-500"}`}>
                  {post.published ? "Published" : "Draft"}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(post)} className="text-primary"><Edit size={16} /></button>
                <button onClick={() => handleDelete(post.id)} className="text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
