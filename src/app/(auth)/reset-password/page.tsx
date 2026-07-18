"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return setError("Token tidak valid")
    setLoading(true)

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })

    if (res.ok) {
      setSuccess(true)
    } else {
      const data = await res.json()
      setError(data.error || "Gagal reset password")
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-green-500">Password berhasil direset. Silakan login dengan password baru.</p>
        <button onClick={() => router.push("/login")} className="bg-primary text-white px-6 py-2 rounded-full mt-4">Login</button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold text-center mb-6">Reset Password</h1>
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input required type="password" placeholder="Password baru" value={password} onChange={e => setPassword(e.target.value)} className="border rounded px-3 py-2 bg-transparent" />
        <button disabled={loading || !token} type="submit" className="bg-primary text-white py-2 rounded-full font-semibold disabled:opacity-50">
          {loading ? "Menyimpan..." : "Reset Password"}
        </button>
      </form>
    </div>
  )
}