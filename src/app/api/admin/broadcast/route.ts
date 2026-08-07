import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { userId, title, message } = await req.json()

  if (!title || !message) {
    return NextResponse.json({ error: "Judul dan pesan wajib diisi" }, { status: 400 })
  }

  if (userId) {
    await prisma.notification.create({
      data: { userId, title, message },
    })
  } else {
    // Broadcast ke semua user
    const users = await prisma.user.findMany({ select: { id: true } })
    await prisma.notification.createMany({
      data: users.map(u => ({ userId: u.id, title, message })),
    })

    // Tulis file cache untuk SSE dengan path absolut yang benar
    try {
      const cacheDir = path.join(process.cwd(), "cache")
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
      }
      const cacheFile = path.join(cacheDir, "broadcast.json")
      const cacheData = { type: "broadcast", pesan: message, title, time: Date.now() }
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData))
      console.log("Broadcast cache ditulis:", cacheFile)
    } catch (err) {
      console.error("Gagal menulis cache broadcast:", err)
    }
  }

  return NextResponse.json({ success: true })
}
