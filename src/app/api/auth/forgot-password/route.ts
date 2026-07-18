import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/nodemailer"
import crypto from "crypto"

export async function POST(req: Request) {
  const { email } = await req.json()

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "Email tidak ditemukan" }, { status: 404 })
    }

    // Buat token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 3600000) // 1 jam

    // Hapus token lama user ini
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

    // Simpan token baru
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    // Kirim email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    await sendEmail({
      to: user.email,
      subject: "Reset Password - Exha Wave",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Password Exha Wave</h2>
          <p>Klik tombol di bawah untuk mereset password Anda:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          <p style="margin-top: 20px; color: #666;">Link ini berlaku selama 1 jam.</p>
          <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        </div>
      `,
    })

    return NextResponse.json({ message: "Link reset password telah dikirim ke email Anda" })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Gagal mengirim email reset password" }, { status: 500 })
  }
}