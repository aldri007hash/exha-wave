"use client"
import { useState, useEffect } from "react"

interface FAQ {
  id: string
  question: string
  answer: string
  order: number
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [form, setForm] = useState({ question: "", answer: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchFAQs = async () => {
    try {
      const res = await fetch("/api/admin/faq")
      if (!res.ok) throw new Error("Gagal memuat FAQ")
      const data = await res.json()
      setFaqs(data.faqs || [])
    } catch (error) {
      console.error("Error fetching FAQs:", error)
      setFaqs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFAQs()
  }, [])

  const handleSubmit = async () => {
    if (!form.question.trim() || !form.answer.trim()) return

    if (editingId) {
      await fetch("/api/admin/faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form }),
      })
    } else {
      await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    }
    setForm({ question: "", answer: "" })
    setEditingId(null)
    fetchFAQs()
  }

  const handleEdit = (faq: FAQ) => {
    setForm({ question: faq.question, answer: faq.answer })
    setEditingId(faq.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus FAQ ini?")) return
    await fetch(`/api/admin/faq?id=${id}`, { method: "DELETE" })
    fetchFAQs()
  }

  if (loading) return <p className="text-center py-12">Memuat FAQ...</p>

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Manajemen FAQ</h2>

      {/* Form Tambah/Edit */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-3">{editingId ? "Edit FAQ" : "Tambah FAQ Baru"}</h3>
        <input
          placeholder="Pertanyaan"
          value={form.question}
          onChange={e => setForm({ ...form, question: e.target.value })}
          className="border rounded px-3 py-2 w-full mb-2 bg-transparent"
        />
        <textarea
          placeholder="Jawaban"
          value={form.answer}
          onChange={e => setForm({ ...form, answer: e.target.value })}
          rows={3}
          className="border rounded px-3 py-2 w-full mb-2 bg-transparent"
        />
        <button onClick={handleSubmit} className="bg-primary text-white px-4 py-2 rounded-full">
          {editingId ? "Update" : "Tambah"}
        </button>
        {editingId && (
          <button onClick={() => { setEditingId(null); setForm({ question: "", answer: "" }) }} className="ml-2 border px-4 py-2 rounded-full">
            Batal
          </button>
        )}
      </div>

      {/* Daftar FAQ */}
      {faqs.length === 0 ? (
        <p className="text-gray-500">Belum ada FAQ.</p>
      ) : (
        <div className="space-y-2">
          {faqs.map(faq => (
            <div key={faq.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold">{faq.question}</p>
                <p className="text-sm text-gray-500 mt-1">{faq.answer}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => handleEdit(faq)} className="text-primary text-sm">Edit</button>
                <button onClick={() => handleDelete(faq.id)} className="text-red-500 text-sm">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}