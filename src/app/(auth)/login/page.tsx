"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import ReCAPTCHA from "react-google-recaptcha"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const middlewareError = searchParams.get("error")
  const middlewareReason = searchParams.get("reason")
  const middlewareUntil = searchParams.get("until")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!captchaToken) { setError("Harap selesaikan captcha"); return }
    setLoading(true)
    const res = await signIn("credentials", {
      email, password, captchaToken, rememberMe: String(rememberMe), redirect: false,
    })
    setLoading(false)
    if (res?.error) { setError(res.error) }
    else if (res?.ok) { router.push("/dashboard") }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8">
        <h1 className="font-heading text-2xl font-bold text-center mb-6">Masuk ke Exha Wave</h1>
        {middlewareError === "banned" && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 mb-4 text-sm text-red-700 dark:text-red-300">
            <p className="font-semibold">Akun Anda telah diblokir</p><p>Alasan: {middlewareReason || "Tidak ada alasan"}</p>
          </div>
        )}
        {middlewareError === "suspended" && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-4 text-sm text-yellow-700 dark:text-yellow-300">
            <p className="font-semibold">Akun Anda ditangguhkan</p><p>Alasan: {middlewareReason || "Tidak ada alasan"}</p>{middlewareUntil && <p>Hingga: {middlewareUntil}</p>}
          </div>
        )}
        {middlewareError === "password_changed" && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-4 text-sm text-blue-700 dark:text-blue-300">
            <p className="font-semibold">Password Anda telah diubah</p><p>Silakan login dengan password baru.</p>
          </div>
        )}
        {error && !middlewareError && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 mb-4 text-sm text-red-600 dark:text-red-300">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border rounded-xl px-4 py-3 w-full bg-transparent" required placeholder="contoh@email.com" /></div>
          <div><label className="block text-sm mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="border rounded-xl px-4 py-3 w-full bg-transparent pr-12" required placeholder="Masukkan password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4" />
            <label htmlFor="rememberMe" className="text-sm text-gray-500 dark:text-gray-400">Ingat saya</label>
          </div>
          <div className="flex justify-center"><ReCAPTCHA sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!} onChange={token => setCaptchaToken(token)} /></div>
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-primary/30 transition-all">{loading ? "Memproses..." : "Masuk"}</button>
        </form>
        <div className="mt-4 text-center space-y-2">
          <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="w-full border border-border rounded-xl py-2.5 text-sm hover:bg-card transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-gray-200 dark:hover:shadow-gray-800 flex items-center justify-center gap-2 font-medium">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Masuk dengan Google
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400"><Link href="/forgot-password" className="text-primary hover:underline">Lupa Password?</Link></p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum punya akun? <Link href="/register" className="text-primary hover:underline">Daftar</Link></p>
        </div>
      </div>
    </div>
  )
}
