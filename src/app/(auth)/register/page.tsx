"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ReCAPTCHA from "react-google-recaptcha"
import { Eye, EyeOff } from "lucide-react"

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
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8">
        <h1 className="font-heading text-3xl font-bold text-center mb-6">Daftar Exha Wave</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input
            required
            placeholder="Nama Lengkap"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="border rounded-xl px-4 py-3 bg-transparent"
          />
          <input
            required
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            className="border rounded-xl px-4 py-3 bg-transparent"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="border rounded-xl px-4 py-3 bg-transparent"
          />
          <input
            required
            placeholder="Nomor Telepon"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="border rounded-xl px-4 py-3 bg-transparent"
          />
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="border rounded-xl px-4 py-3 bg-transparent w-full pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <input
            placeholder="Kode Referral (opsional)"
            value={form.referralCode}
            onChange={e => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
            className="border rounded-xl px-4 py-3 bg-transparent"
          />
          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
              onChange={token => setCaptchaToken(token)}
            />
          </div>
          <button
            disabled={loading}
            type="submit"
            className="bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            {loading ? "Mendaftar..." : "Daftar"}
          </button>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Masuk
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
