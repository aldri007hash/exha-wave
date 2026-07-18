"use client"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return alert("Ulasan tidak boleh kosong")
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      })
      if (res.ok) {
        router.push("/orders")
      } else {
        const data = await res.json()
        alert(data.error || "Gagal mengirim ulasan")
      }
    } catch (err) {
      alert("Terjadi kesalahan. Silakan coba lagi.")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-heading text-2xl font-bold mb-4">Beri Ulasan</h1>
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button type="button" key={i} onClick={() => setRating(i)} className={i <= rating ? "text-yellow-500 text-2xl" : "text-gray-300 text-2xl"}>★</button>
          ))}
        </div>
        <textarea required placeholder="Tulis ulasan Anda..." rows={4} value={comment} onChange={e => setComment(e.target.value)} className="border rounded px-3 py-2 bg-transparent" />
        <p className="text-xs text-gray-500">{comment.length} karakter</p>
        <button disabled={loading || !comment.trim()} type="submit" className="bg-primary text-white py-2 rounded-full disabled:opacity-50">
          {loading ? "Mengirim..." : "Kirim Ulasan"}
        </button>
      </form>
    </div>
  )
}