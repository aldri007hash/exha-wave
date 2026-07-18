import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const messages = await prisma.chatMessage.findMany({
    where: { userId: params.userId },
    include: { user: { select: { name: true, image: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ messages })
}

export async function DELETE(req: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Hapus semua chat dengan user ini
  await prisma.chatMessage.deleteMany({ where: { userId: params.userId } })
  return NextResponse.json({ success: true })
}