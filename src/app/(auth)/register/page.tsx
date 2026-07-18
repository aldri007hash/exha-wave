"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ReCAPTCHA from "react-google-recaptcha"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    referralCode: "",
  })
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaToken) return setError("Mohon selesaikan captcha")
    setLoading(true)
    setError("")

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        captchaToken,
        referralCode: form.referralCode,
      }),
    })

    if (res.ok) {
      router.push("/login?registered=true")
    } else {
      const data = await res.json()
      setError(data.error || "Gagal mendaftar")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold text-center mb-6">Daftar Exha Wave</h1>
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          required
          placeholder="Nama Lengkap"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="border rounded px-3 py-2 bg-transparent"
        />
        <input
          required
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          className="border rounded px-3 py-2 bg-transparent"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="border rounded px-3 py-2 bg-transparent"
        />
        <input
          required
          placeholder="Nomor Telepon"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          className="border rounded px-3 py-2 bg-transparent"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          className="border rounded px-3 py-2 bg-transparent"
        />
        <input
          placeholder="Kode Referral (opsional)"
          value={form.referralCode}
          onChange={e => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
          className="border rounded px-3 py-2 bg-transparent"
        />
        <ReCAPTCHA
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
          onChange={token => setCaptchaToken(token)}
        />
        <button
          disabled={loading}
          type="submit"
          className="bg-primary text-white py-2 rounded-full font-semibold disabled:opacity-50"
        >
          {loading ? "Mendaftar..." : "Daftar"}
        </button>
        <p className="text-sm text-center">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary">
            Masuk
          </Link>
        </p>
      </form>
    </div>
  )
}