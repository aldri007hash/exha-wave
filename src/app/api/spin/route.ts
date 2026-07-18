import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (user.lastSpinDate && new Date(user.lastSpinDate) >= today) {
    return NextResponse.json({ error: "Already spun today" }, { status: 400 })
  }

  const { prize } = await req.json()
  await prisma.user.update({
    where: { id: user.id },
    data: {
      points: { increment: prize },
      lastSpinDate: new Date(),
    },
  })

  await prisma.spinRecord.create({
    data: { userId: user.id, prize },
  })

  return NextResponse.json({ message: `Kamu dapat +${prize} Exha Points!` })
}