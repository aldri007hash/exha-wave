import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { token, password } = await req.json()

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token tidak valid atau kadaluarsa" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  })

  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })

  return NextResponse.json({ success: true })
}