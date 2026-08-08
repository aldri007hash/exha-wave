import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { rateLimit } from "@/lib/rate-limit"

function getClientIP(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown"
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = getClientIP(req)

  // Rate limiting untuk endpoint sensitif
  if (pathname === "/api/auth/signin") {
    const result = await rateLimit(`login:${ip}`, "login")
    if (!result.success) return NextResponse.json({ error: "Terlalu banyak percobaan login." }, { status: 429 })
  }
  if (pathname === "/api/auth/forgot-password") {
    const result = await rateLimit(`forgot:${ip}`, "forgot")
    if (!result.success) return NextResponse.json({ error: "Terlalu banyak permintaan reset password." }, { status: 429 })
  }
  if (pathname.startsWith("/api/reseller/")) {
    const result = await rateLimit(`reseller:${ip}`, "reseller")
    if (!result.success) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 })
  }
  if (pathname.startsWith("/api/chat/user")) {
    const result = await rateLimit(`chat:${ip}`, "chat")
    if (!result.success) return NextResponse.json({ error: "Anda mengirim terlalu cepat." }, { status: 429 })
  }

  // ========== RATE LIMITING BARU ==========
  if (pathname.startsWith("/api/refund")) {
    const result = await rateLimit(`refund:${ip}`, "refund")
    if (!result.success) return NextResponse.json({ error: "Terlalu banyak permintaan refund. Coba lagi nanti." }, { status: 429 })
  }
  if (pathname.startsWith("/api/topup")) {
    const result = await rateLimit(`topup:${ip}`, "topup")
    if (!result.success) return NextResponse.json({ error: "Terlalu banyak permintaan topup. Coba lagi nanti." }, { status: 429 })
  }
  if (pathname.startsWith("/api/orders")) {
    const result = await rateLimit(`orders:${ip}`, "orders")
    if (!result.success) return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 })
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // Proteksi halaman admin: hanya ADMIN & SUPER_ADMIN
  if (pathname.startsWith("/admin")) {
    if (!token || (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN")) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  // Proteksi halaman talent: hanya TALENT
  if (pathname.startsWith("/talent")) {
    if (!token || token.role !== "TALENT") {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  // Proteksi API talent: TALENT, ADMIN, SUPER_ADMIN
  if (pathname.startsWith("/api/talent")) {
    if (!token || (token.role !== "TALENT" && token.role !== "ADMIN" && token.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
  }

  const isPublicPath = 
    pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") || pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/services") || pathname.startsWith("/api/promo") ||
    pathname.startsWith("/api/payment/methods") || pathname.startsWith("/api/testimonials") ||
    pathname.startsWith("/api/settings") || pathname.startsWith("/api/public") ||
    pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/logo") ||
    pathname.startsWith("/manifest") || pathname.startsWith("/sw.js") || pathname.startsWith("/sounds") ||
    pathname.startsWith("/api/upload") || pathname.startsWith("/api/webhooks")

  if (!isPublicPath && token) {
    const now = new Date()
    const tokenStatus = String(token.status || "ACTIVE")
    const tokenBanReason = String(token.banReason || "Tidak ada alasan")
    const tokenSuspendUntil = token.suspendUntil ? new Date(String(token.suspendUntil)) : null
    const tokenPasswordChangedAt = token.passwordChangedAt ? new Date(String(token.passwordChangedAt)) : null
    const tokenIat = Number(token.iat || 0)

    if (tokenStatus === "BANNED") {
      const loginUrl = new URL("/login", req.url); loginUrl.searchParams.set("error", "banned"); loginUrl.searchParams.set("reason", tokenBanReason); return NextResponse.redirect(loginUrl)
    }
    if (tokenStatus === "SUSPENDED" && tokenSuspendUntil) {
      if (now < tokenSuspendUntil) {
        const loginUrl = new URL("/login", req.url); loginUrl.searchParams.set("error", "suspended"); loginUrl.searchParams.set("reason", tokenBanReason); loginUrl.searchParams.set("until", tokenSuspendUntil.toLocaleDateString("id-ID")); return NextResponse.redirect(loginUrl)
      }
    }
    if (tokenPasswordChangedAt) {
      const tokenIssuedAt = new Date(tokenIat * 1000)
      if (tokenPasswordChangedAt > tokenIssuedAt) {
        const loginUrl = new URL("/login", req.url); loginUrl.searchParams.set("error", "password_changed"); return NextResponse.redirect(loginUrl)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|manifest.json|sw.js).*)"],
}
