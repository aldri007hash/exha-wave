import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { userId, title, message } = await req.json()

  if (userId) {
    await prisma.notification.create({
      data: { userId, title, message },
    })
  } else {
    const users = await prisma.user.findMany({ select: { id: true } })
    await prisma.notification.createMany({
      data: users.map(u => ({ userId: u.id, title, message })),
    })
  }

  return NextResponse.json({ success: true })
}