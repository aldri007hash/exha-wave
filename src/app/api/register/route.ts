import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown"
  const result = await rateLimit(ip, "login")
  if (!result.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi nanti." }, { status: 429 })
  }

  try {
    const { name, username, email, phone, password, captchaToken, referralCode } = await req.json()
    if (!name || !username || !email || !password) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 })

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })
    if (existingUser) return NextResponse.json({ error: "Email atau username sudah digunakan" }, { status: 400 })

    if (process.env.RECAPTCHA_SECRET_KEY && captchaToken) {
      try {
        const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
          method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
        })
        const captchaData = await verifyRes.json()
        if (!captchaData.success) return NextResponse.json({ error: "Captcha tidak valid" }, { status: 400 })
      } catch (err) { console.error("Captcha verification error:", err) }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    const user = await prisma.user.create({
      data: {
        name, username, email, phone: phone || null, password: hashedPassword,
        role: "USER", status: "ACTIVE", referralCode: newReferralCode,
        points: 10,
      },
    })

    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } })
      if (referrer) {
        await prisma.referral.create({ data: { referrerId: referrer.id, refereeId: user.id, pointsGiven: 50 } })
        await prisma.user.update({ where: { id: referrer.id }, data: { points: { increment: 50 } } })
        await prisma.user.update({ where: { id: user.id }, data: { points: { increment: 20 } } })
      }
    }

    return NextResponse.json({ success: true, message: "Registrasi berhasil" }, { status: 201 })
  } catch (error: any) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
