import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { token, newPassword } = await req.json()

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })
    if (!resetToken) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 400 })
    }

    if (resetToken.used) {
      return NextResponse.json({ error: "Token sudah digunakan" }, { status: 400 })
    }

    if (new Date() > new Date(resetToken.expiresAt)) {
      return NextResponse.json({ error: "Token sudah kadaluarsa" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    })

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    })

    return NextResponse.json({ message: "Password berhasil direset" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Gagal mereset password" }, { status: 500 })
  }
}