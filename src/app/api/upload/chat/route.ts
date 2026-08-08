import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import path from "path"
import sharp from "sharp"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  const folder = (formData.get("folder") as string) || "images"

  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipe file tidak diizinkan" }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran maksimal 5MB" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `chat-${Date.now()}-${file.name.replace(/\s/g, "_").replace(/\.[^.]+$/, ".webp")}`
  const dir = path.join(process.cwd(), "public", "uploads", folder)
  await require("fs/promises").mkdir(dir, { recursive: true })
  const filePath = path.join(dir, filename)

  // Kompresi & konversi ke WebP
  await sharp(buffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filePath)

  const url = `/uploads/${folder}/${filename}`
  return NextResponse.json({ url })
}
