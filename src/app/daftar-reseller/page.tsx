"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DaftarResellerPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", businessName: "", notes: "" })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) return setError("Nama dan email wajib diisi")
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/reseller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.error || "Gagal mendaftar")
      }
    } catch {
      setError("Terjadi kesalahan")
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <h1 className="font-heading text-3xl font-bold mb-4 text-green-500">Pendaftaran Berhasil!</h1>
        <p className="text-gray-500 mb-6">Permintaan Anda akan ditinjau oleh admin. Kami akan menghubungi Anda melalui email jika disetujui.</p>
        <button onClick={() => router.push("/")} className="bg-primary text-white px-6 py-2 rounded-full">Kembali ke Beranda</button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold mb-2">Daftar Reseller</h1>
      <p className="text-gray-500 mb-6">Dapatkan API Key untuk mengintegrasikan layanan Exha Wave ke platform Anda.</p>
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label className="text-sm mb-1 block">Nama *</label>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Email *</label>
          <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Nama Bisnis (opsional)</label>
          <input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Catatan (opsional)</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="border rounded px-3 py-2 w-full bg-transparent" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-full font-semibold disabled:opacity-50">
          {loading ? "Mengirim..." : "Kirim Permintaan"}
        </button>
      </form>
    </div>
  )
}
