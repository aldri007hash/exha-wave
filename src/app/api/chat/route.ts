import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || ""

  const rooms = await prisma.chatRoom.findMany({
    where: {
      user: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  let searchUsers: any[] = []
  if (search && rooms.length === 0) {
    searchUsers = await prisma.user.findMany({
      where: {
        role: "USER",
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 10,
    })
  }

  return NextResponse.json({ rooms, searchUsers })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { roomId, content, imageUrl, audioUrl, userId } = await req.json()

  let room = null
  if (roomId) {
    room = await prisma.chatRoom.findUnique({ where: { id: roomId } })
  } else if (userId) {
    room = await prisma.chatRoom.findFirst({
      where: { userId, adminId: session.user.id },
    })
    if (!room) {
      room = await prisma.chatRoom.create({
        data: { userId, adminId: session.user.id },
      })
    }
  }

  if (!room) return NextResponse.json({ error: "Room tidak ditemukan" }, { status: 404 })

  const message = await prisma.chatMessage.create({
    data: {
      roomId: room.id,
      userId: session.user.id,
      role: "admin",
      content: content || null,
      imageUrl: imageUrl || null,
      audioUrl: audioUrl || null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  await prisma.chatRoom.update({ where: { id: room.id }, data: { updatedAt: new Date() } })

  if (room.userId) {
    await prisma.notification.create({
      data: {
        userId: room.userId,
        title: "Pesan Chat Masuk",
        message: `Anda mendapat pesan baru dari admin.`,
      },
    })
  }

  return NextResponse.json({ message })
}