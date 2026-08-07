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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { roomId } = await req.json()

  if (!roomId) {
    return NextResponse.json({ error: "Room ID diperlukan" }, { status: 400 })
  }

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } })
  if (!room) {
    return NextResponse.json({ error: "Room tidak ditemukan" }, { status: 404 })
  }

  // Update admin ke admin yang melakukan takeover
  await prisma.chatRoom.update({
    where: { id: roomId },
    data: { adminId: session.user.id, status: "di-handle" },
  })

  triggerChatSSE({
    type: "claimed",
    session_id: roomId,
    admin_id: session.user.id,
    admin_name: session.user.name,
  })

  return NextResponse.json({ success: true, message: "Berhasil mengambil alih chat" })
}
