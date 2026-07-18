"use client"
import { useState, useEffect } from "react"

export default function AdminTestimonialsPage() {
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    const res = await fetch("/api/admin/testimonials")
    const data = await res.json()
    setReviews(data.reviews || [])
  }

  const handleApprove = async (id: string) => {
    await fetch("/api/admin/testimonials", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved: true }),
    })
    fetchReviews()
  }

  const handleReject = async (id: string) => {
    if (!confirm("Tolak dan hapus permanen ulasan ini?")) return
    await fetch("/api/admin/testimonials", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved: false }),
    })
    fetchReviews()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus permanen ulasan ini?")) return
    await fetch("/api/admin/testimonials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    fetchReviews()
  }

  const pendingReviews = reviews.filter(r => !r.isApproved)
  const approvedReviews = reviews.filter(r => r.isApproved)

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Testimoni</h2>

      {/* Pending */}
      <h3 className="font-semibold mb-3">Menunggu Persetujuan ({pendingReviews.length})</h3>
      {pendingReviews.length === 0 ? (
        <p className="text-gray-500 mb-6">Tidak ada testimoni pending.</p>
      ) : (
        <div className="space-y-4 mb-8">
          {pendingReviews.map(review => (
            <div key={review.id} className="bg-card border border-border rounded-xl p-4">
              <p className="font-semibold">{review.user.name}</p>
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={i < review.rating ? "text-yellow-500" : "text-gray-300"}>★</span>
                ))}
              </div>
              <p className="text-sm mt-2">{review.comment}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleApprove(review.id)} className="bg-green-500 text-white px-4 py-1 rounded-full text-sm">Setujui</button>
                <button onClick={() => handleReject(review.id)} className="bg-yellow-500 text-white px-4 py-1 rounded-full text-sm">Tolak (Hapus)</button>
                <button onClick={() => handleDelete(review.id)} className="bg-red-500 text-white px-4 py-1 rounded-full text-sm">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approved */}
      <h3 className="font-semibold mb-3">Disetujui ({approvedReviews.length})</h3>
      {approvedReviews.length === 0 ? (
        <p className="text-gray-500">Belum ada testimoni disetujui.</p>
      ) : (
        <div className="space-y-4">
          {approvedReviews.map(review => (
            <div key={review.id} className="bg-card border border-border rounded-xl p-4">
              <p className="font-semibold">{review.user.name}</p>
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={i < review.rating ? "text-yellow-500" : "text-gray-300"}>★</span>
                ))}
              </div>
              <p className="text-sm mt-2">{review.comment}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleDelete(review.id)} className="bg-red-500 text-white px-4 py-1 rounded-full text-sm">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}