import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile } from "fs/promises"
import path from "path"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ announcements })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const formData = await req.formData()
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const image = formData.get("image") as File | null

  if (!title || !content) {
    return NextResponse.json({ error: "Judul dan konten wajib diisi" }, { status: 400 })
  }

  let imageUrl = null
  if (image && image.size > 0) {
    const buffer = Buffer.from(await image.arrayBuffer())
    const filename = `announcement-${Date.now()}-${image.name.replace(/\s/g, "_")}`
    const dir = path.join(process.cwd(), "public", "uploads", "announcements")
    await require("fs/promises").mkdir(dir, { recursive: true })
    const filePath = path.join(dir, filename)
    await writeFile(filePath, buffer)
    imageUrl = `/uploads/announcements/${filename}`
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      imageUrl,
      isActive: true,
    },
  })

  return NextResponse.json({ announcement }, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })

  await prisma.announcement.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
