import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token dan password wajib diisi" }, { status: 400 })
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 400 })
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ error: "Token sudah kadaluarsa" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    })

    // Hapus semua token reset untuk user ini
    await prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Gagal mereset password" }, { status: 500 })
  }
}
