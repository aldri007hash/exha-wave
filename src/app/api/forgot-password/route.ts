import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendContactEmail } from "@/lib/nodemailer"
import crypto from "crypto"

export async function POST(req: Request) {
  const { email } = await req.json()

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // Tetap sukses agar tidak bocor informasi
    return NextResponse.json({ success: true })
  }

  // Hapus token lama
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  // Buat token baru
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 jam

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  })

  // Kirim email
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
  await sendContactEmail({
    name: user.name,
    email: user.email,
    phone: "",
    message: `Klik link berikut untuk reset password Anda: ${resetLink}`,
  })

  return NextResponse.json({ success: true })
}