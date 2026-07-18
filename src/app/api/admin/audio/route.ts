import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, unlink } from "fs/promises"
import path from "path"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const category = searchParams.get("category") || ""

  const where: any = {}
  if (category) {
    where.category = category
  }

  const [tracks, total] = await Promise.all([
    prisma.audioTrack.findMany({
      where,
      orderBy: { order: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.audioTrack.count({ where }),
  ])

  return NextResponse.json({
    tracks,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  const category = formData.get("category") as string
  const title = formData.get("title") as string

  if (!file || !category) {
    return NextResponse.json({ error: "File dan kategori wajib" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = Date.now() + "-" + file.name.replace(/\s/g, "_")
  const dir = path.join(process.cwd(), "public", "audio")
  await require("fs/promises").mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)

  const count = await prisma.audioTrack.count({ where: { category } })
  await prisma.audioTrack.create({
    data: {
      category,
      title: title || file.name.replace(/\.[^/.]+$/, ""),
      fileUrl: `/audio/${filename}`,
      order: count + 1,
    },
  })

  return NextResponse.json({ success: true })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, title, category } = await req.json()
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })

  const data: any = {}
  if (title !== undefined) data.title = title
  if (category !== undefined) data.category = category

  await prisma.audioTrack.update({ where: { id }, data })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })

  const track = await prisma.audioTrack.findUnique({ where: { id } })
  if (!track) return NextResponse.json({ error: "Track tidak ditemukan" }, { status: 404 })

  // Hapus file fisik
  const filePath = path.join(process.cwd(), "public", track.fileUrl)
  try { await unlink(filePath) } catch (error) { console.error("Gagal hapus file:", error) }

  await prisma.audioTrack.delete({ where: { id } })
  return NextResponse.json({ success: true })
}