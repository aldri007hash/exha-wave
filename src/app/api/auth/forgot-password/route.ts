import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { transporter } from "@/lib/nodemailer"
import crypto from "crypto"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown"
  const result = await rateLimit(ip, "forgot")
  if (!result.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi nanti." }, { status: 429 })
  }

  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ message: "Jika email terdaftar, link reset password telah dikirim." })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 jam

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

    await transporter.sendMail({
      from: `"Exha Wave" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Password - Exha Wave",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0066FF; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Reset Password</h1>
          </div>
          <div style="padding: 20px;">
            <p>Halo, <strong>${user.name}</strong>!</p>
            <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
            <p>Klik tombol di bawah untuk mengatur ulang password Anda (link berlaku 1 jam):</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 12px 0;">Reset Password</a>
            <p>Atau salin dan buka link ini di browser:</p>
            <p style="color: #0066FF;">${resetUrl}</p>
            <p>Jika Anda tidak merasa meminta reset password, abaikan email ini.</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ message: "Jika email terdaftar, link reset password telah dikirim." })
  } catch (error) {
    console.error("Error forgot password:", error)
    return NextResponse.json({ error: "Gagal mengirim email reset password" }, { status: 500 })
  }
}
