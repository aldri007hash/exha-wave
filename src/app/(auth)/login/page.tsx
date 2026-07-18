"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ReCAPTCHA from "react-google-recaptcha"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaToken) return setError("Mohon selesaikan captcha")
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    })

    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl shadow-[20px_20px_60px_rgba(0,0,0,0.1),-20px_-20px_60px_rgba(255,255,255,0.5)] dark:shadow-[20px_20px_60px_rgba(0,0,0,0.3),-20px_-20px_60px_rgba(255,255,255,0.02)] p-8 border border-border/50 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Selamat Datang
            </h1>
            <p className="text-muted-foreground mt-2">Masuk ke akun Exha Wave Anda</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</p>}
            <div>
              <input
                required
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border-0 bg-background rounded-2xl px-4 py-3.5 shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] dark:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.2),inset_-4px_-4px_10px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div>
              <input
                required
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border-0 bg-background rounded-2xl px-4 py-3.5 shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] dark:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.2),inset_-4px_-4px_10px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="rounded" />
                Ingat Saya
              </label>
              <Link href="/forgot-password" className="text-primary hover:underline font-medium">Lupa Password?</Link>
            </div>
            <ReCAPTCHA sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!} onChange={token => setCaptchaToken(token)} />
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold shadow-[4px_4px_10px_rgba(0,0,0,0.1),-4px_-4px_10px_rgba(255,255,255,0.2)] hover:shadow-[6px_6px_15px_rgba(0,0,0,0.15),-6px_-6px_15px_rgba(255,255,255,0.3)] active:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.1)] transition-all disabled:opacity-50"
            >
              {loading ? "Masuk..." : "Masuk"}
            </button>
            <p className="text-sm text-center">
              Belum punya akun? <Link href="/register" className="text-primary font-semibold">Daftar</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}