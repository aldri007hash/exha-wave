"use client"
import { useState, useEffect } from "react"

export default function AdminAboutPage() {
  const [content, setContent] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/about")
      .then(res => {
        if (!res.ok) throw new Error("Gagal memuat data")
        return res.json()
      })
      .then(data => setContent(data.content || ""))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error("Gagal menyimpan")
      alert("Konten berhasil disimpan!")
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-center py-12">Memuat...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold">Edit Halaman Tentang Kami</h2>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="border px-4 py-2 rounded-full"
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>
      {showPreview ? (
        <div
          className="bg-card border border-border rounded-xl p-6 prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={15}
            className="border rounded px-3 py-2 w-full bg-transparent mb-4 font-mono text-sm"
            placeholder="<h2>Tentang Kami</h2><p>...</p>"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-white px-4 py-2 rounded-full disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </>
      )}
    </div>
  )
}