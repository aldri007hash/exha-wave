"use client"
import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setSent(true)
    } else {
      const data = await res.json()
      setError(data.error || "Gagal mengirim email")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold text-center mb-6">Lupa Password</h1>
      {sent ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-green-500">Link reset password telah dikirim ke email Anda.</p>
          <Link href="/login" className="text-primary mt-4 inline-block">Kembali ke Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input required type="email" placeholder="Email terdaftar" value={email} onChange={e => setEmail(e.target.value)} className="border rounded px-3 py-2 bg-transparent" />
          <button disabled={loading} type="submit" className="bg-primary text-white py-2 rounded-full font-semibold disabled:opacity-50">
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </button>
          <p className="text-sm text-center"><Link href="/login" className="text-primary">Kembali ke Login</Link></p>
        </form>
      )}
    </div>
  )
}