"use client"
import { useState, useEffect, useCallback } from "react"
import { useAudio } from "@/context/AudioContext"
import { Upload, X, Trash2, Edit3, ChevronLeft, ChevronRight } from "lucide-react"

const categories = ["DJ Remix", "Phonk & Funk", "Pop Hits", "Lofi Chill"]


export default function AdminAudioPage() {
  const { setTracks, setCurrentIndex } = useAudio()
  const [tracks, setLocalTracks] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("DJ Remix")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Upload state
  const [showModal, setShowModal] = useState(false)
  const [category, setCategory] = useState("DJ Remix")
  const [title, setTitle] = useState("")
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)

  // Edit state
  const [editingTrack, setEditingTrack] = useState<any>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editCategory, setEditCategory] = useState("")

  const fetchTracks = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/audio?page=${page}&limit=10&category=${encodeURIComponent(activeCategory)}`)
    const data = await res.json()
    setLocalTracks(data.tracks || [])
    setTotalPages(data.pagination?.totalPages || 1)
    // Update context dengan semua track (untuk player)
    const allRes = await fetch(`/api/admin/audio?limit=9999`)
    const allData = await allRes.json()
    setTracks(allData.tracks || [])
    setLoading(false)
  }, [page, activeCategory, setTracks])

  useEffect(() => {
    fetchTracks()
  }, [fetchTracks])

  const handleUpload = async () => {
    if (!files || files.length === 0) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", category)
      formData.append("title", title || file.name.replace(/\.[^/.]+$/, ""))
      await fetch("/api/admin/audio", { method: "POST", body: formData })
    }
    setUploading(false)
    setFiles(null)
    setTitle("")
    setShowModal(false)
    fetchTracks()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus lagu ini?")) return
    await fetch(`/api/admin/audio?id=${id}`, { method: "DELETE" })
    fetchTracks()
  }

  const handleEdit = (track: any) => {
    setEditingTrack(track)
    setEditTitle(track.title)
    setEditCategory(track.category)
  }

  const handleSaveEdit = async () => {
    if (!editingTrack) return
    await fetch("/api/admin/audio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingTrack.id, title: editTitle, category: editCategory }),
    })
    setEditingTrack(null)
    fetchTracks()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold">Menu Audio</h2>
        <button onClick={() => setShowModal(true)} className="bg-primary text-white px-4 py-2 rounded-full flex items-center gap-2">
          <Upload size={16} /> Upload File Lagu
        </button>
      </div>

      {/* Tab Kategori */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setPage(1) }}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${activeCategory === cat ? "bg-primary text-white" : "border border-border"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Modal Upload */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-semibold">Upload Lagu</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)} className="border rounded px-3 py-2 w-full mb-3 bg-transparent">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Judul (opsional)" value={title} onChange={e => setTitle(e.target.value)} className="border rounded px-3 py-2 w-full mb-3 bg-transparent" />
            <input type="file" accept=".mp3" multiple onChange={e => setFiles(e.target.files)} className="mb-3" />
            <button onClick={handleUpload} disabled={uploading} className="bg-primary text-white px-4 py-2 rounded-full w-full disabled:opacity-50">
              {uploading ? "Mengupload..." : "Upload"}
            </button>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editingTrack && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 w-full max-w-md">
            <h3 className="font-heading font-semibold mb-4">Edit Lagu</h3>
            <input placeholder="Judul" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="border rounded px-3 py-2 w-full mb-3 bg-transparent" />
            <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="border rounded px-3 py-2 w-full mb-4 bg-transparent">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingTrack(null)} className="border px-4 py-2 rounded-full">Batal</button>
              <button onClick={handleSaveEdit} className="bg-primary text-white px-4 py-2 rounded-full">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Daftar Lagu */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-4">Daftar Lagu - {activeCategory} ({loading ? "..." : totalPages > 0 ? (page-1)*10 + tracks.length : 0})</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : tracks.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada lagu di kategori ini.</p>
        ) : (
          <>
            <div className="space-y-2">
              {tracks.map((track, idx) => (
                <div key={track.id} className="flex justify-between items-center hover:bg-primary/5 p-2 rounded group">
                  <div>
                    <p className="text-sm font-medium">{track.title || "Tanpa judul"}</p>
                    <p className="text-xs text-gray-400">Urutan: {track.order}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentIndex((page-1)*10 + idx)} className="text-primary text-sm">Putar</button>
                    <button onClick={() => handleEdit(track)} className="text-blue-500 opacity-0 group-hover:opacity-100 transition"><Edit3 size={14} /></button>
                    <button onClick={() => handleDelete(track.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
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