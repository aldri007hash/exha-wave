import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { roomId } = await req.json()
  await prisma.chatRoom.update({ where: { id: roomId }, data: { adminId: session.user.id } })
  return NextResponse.json({ success: true })
}