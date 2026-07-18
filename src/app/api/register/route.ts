import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"

function generateReferralCode(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let code = "EXHA"
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(req: Request) {
  const { name, username, email, phone, password, captchaToken, referralCode } = await req.json()

  // Verifikasi captcha ke Google
  const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
  })
  const verifyData = await verifyRes.json()

  if (!verifyData.success || verifyData.score < 0.5) {
    return NextResponse.json({ error: "Captcha tidak valid" }, { status: 400 })
  }

  // Cek duplikat
  const existingEmail = await prisma.user.findUnique({ where: { email } })
  if (existingEmail) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })

  const existingUsername = await prisma.user.findUnique({ where: { username } })
  if (existingUsername) return NextResponse.json({ error: "Username sudah dipakai" }, { status: 400 })

  const hashedPassword = await bcrypt.hash(password, 12)

  // Generate kode referral unik
  let newReferralCode = generateReferralCode()
  // Pastikan unik
  let existingCode = await prisma.user.findFirst({ where: { referralCode: newReferralCode } })
  while (existingCode) {
    newReferralCode = generateReferralCode()
    existingCode = await prisma.user.findFirst({ where: { referralCode: newReferralCode } })
  }

  // Buat user baru
  const user = await prisma.user.create({
    data: {
      name,
      username,
      email,
      phone,
      password: hashedPassword,
      referralCode: newReferralCode,
    },
  })

  // Proses referral jika ada kode referral
  if (referralCode) {
    const referrer = await prisma.user.findFirst({ where: { referralCode } })
    if (referrer && referrer.id !== user.id) {
      // Buat record referral
      await prisma.referral.create({
        data: {
          referrerId: referrer.id,
          refereeId: user.id,
          pointsGiven: 50, // 50 poin untuk yang mengajak
        },
      })

      // Update poin referrer (+50)
      await prisma.user.update({
        where: { id: referrer.id },
        data: { points: { increment: 50 } },
      })

      // Update poin referee (+30)
      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: 30 } },
      })
    }
  }

  return NextResponse.json({ success: true })
}