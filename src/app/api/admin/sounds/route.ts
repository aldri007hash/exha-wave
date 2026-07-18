import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, unlink } from "fs/promises"
import path from "path"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sounds = await prisma.sound.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({ sounds })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  const category = formData.get("category") as string
  const label = formData.get("label") as string

  if (!file || !category) {
    return NextResponse.json({ error: "File dan kategori wajib" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `sound-${Date.now()}-${file.name.replace(/\s/g, "_")}`
  const dir = path.join(process.cwd(), "public", "sounds")
  await require("fs/promises").mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)

  const sound = await prisma.sound.create({
    data: {
      category,
      label: label || file.name,
      fileUrl: `/sounds/${filename}`,
    },
  })

  return NextResponse.json({ sound })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })

  const sound = await prisma.sound.findUnique({ where: { id } })
  if (!sound) return NextResponse.json({ error: "Suara tidak ditemukan" }, { status: 404 })

  const filePath = path.join(process.cwd(), "public", sound.fileUrl)
  try { await unlink(filePath) } catch (error) { console.error("Gagal hapus file:", error) }

  await prisma.sound.delete({ where: { id } })
  return NextResponse.json({ success: true })
}