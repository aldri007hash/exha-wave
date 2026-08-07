import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

function triggerChatSSE(data: any) {
  try {
    const cacheDir = path.join(process.cwd(), "cache")
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })
    const payload = { ...data, time: Date.now() }
    fs.writeFileSync(path.join(cacheDir, "chat_stream.json"), JSON.stringify(payload))
  } catch (err) {
    console.error("Gagal trigger chat SSE:", err)
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || ""
  const isSuperAdmin = session.user.role === "SUPER_ADMIN"

  // Superadmin bisa lihat SEMUA room, admin biasa hanya room yang di-handle dirinya atau belum di-handle
  const where: any = {}
  if (!isSuperAdmin) {
    where.OR = [
      { adminId: session.user.id },
      { adminId: null },
    ]
  }
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }
  }

  const rooms = await prisma.chatRoom.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      admin: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
        select: {
          id: true,
          role: true,
          content: true,
          imageUrl: true,
          audioUrl: true,
          createdAt: true,
          userId: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  let searchUsers: any[] = []
  if (search) {
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
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { roomId, userId, content, imageUrl, audioUrl } = await req.json()
  const isSuperAdmin = session.user.role === "SUPER_ADMIN"

  let room = null
  if (roomId) {
    room = await prisma.chatRoom.findUnique({ where: { id: roomId } })
    if (!room) return NextResponse.json({ error: "Room tidak ditemukan" }, { status: 404 })

    // Auto-claim jika room belum punya admin
    if (!room.adminId) {
      room = await prisma.chatRoom.update({
        where: { id: roomId },
        data: { adminId: session.user.id, status: "di-handle" },
      })
      triggerChatSSE({
        type: "claimed",
        session_id: roomId,
        admin_id: session.user.id,
        admin_name: session.user.name,
      })
    }

    // Cek izin: admin biasa hanya bisa kirim jika room di-handle oleh dirinya
    // Superadmin bisa kirim ke room manapun
    if (!isSuperAdmin && room.adminId && room.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "Room ini sudah ditangani admin lain. Gunakan Takeover untuk mengambil alih." },
        { status: 403 }
      )
    }
  } else if (userId) {
    room = await prisma.chatRoom.findFirst({ where: { userId } })
    if (!room) {
      room = await prisma.chatRoom.create({
        data: { userId, adminId: session.user.id, status: "di-handle" },
      })
      triggerChatSSE({
        type: "new_room",
        session_id: room.id,
        user_id: userId,
        admin_id: session.user.id,
      })
    } else if (!room.adminId) {
      room = await prisma.chatRoom.update({
        where: { id: room.id },
        data: { adminId: session.user.id, status: "di-handle" },
      })
      triggerChatSSE({
        type: "claimed",
        session_id: room.id,
        admin_id: session.user.id,
        admin_name: session.user.name,
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

  await prisma.chatRoom.update({
    where: { id: room.id },
    data: { updatedAt: new Date() },
  })

  triggerChatSSE({
    type: "new_message",
    session_id: room.id,
    pesan: content || "[media]",
    sender_id: session.user.id,
  })

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

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get("roomId")
  if (!roomId) return NextResponse.json({ error: "Room ID diperlukan" }, { status: 400 })

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } })
  if (!room) return NextResponse.json({ error: "Room tidak ditemukan" }, { status: 404 })

  // Superadmin bisa hapus room manapun
  if (session.user.role !== "SUPER_ADMIN" && room.adminId !== session.user.id) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
  }

  await prisma.chatMessage.deleteMany({ where: { roomId } })
  await prisma.chatRoom.delete({ where: { id: roomId } })

  return NextResponse.json({ success: true })
}
