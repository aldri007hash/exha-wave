import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"

const ALLOWED_FOLDERS = ["images", "audio"] as const
const ALLOWED_EXT_IMAGES = ["png", "jpg", "jpeg", "webp"]
const ALLOWED_EXT_AUDIO = ["webm", "mp3", "wav", "ogg"]

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  const folder = (formData.get("folder") as string) || "chat"

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  // *** PENTING: Hanya izinkan folder tertentu ***
  if (!ALLOWED_FOLDERS.includes(folder as any)) {
    return NextResponse.json({ error: "Folder tidak diizinkan" }, { status: 400 })
  }

  // Validasi ukuran file (maks 5MB)
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 })
  }

  // Ambil ekstensi dari nama file asli
  const originalName = file.name || ""
  const ext = originalName.split(".").pop()?.toLowerCase() || ""

  // Validasi tipe MIME
  const allowedMimeImages = ["image/png", "image/jpeg", "image/webp"]
  const allowedMimeAudio = ["audio/webm", "audio/mp3", "audio/wav", "audio/ogg"]

  if (folder === "images") {
    if (!allowedMimeImages.includes(file.type)) {
      return NextResponse.json({ error: "Hanya gambar PNG, JPG, WebP yang diizinkan" }, { status: 400 })
    }
    if (!ALLOWED_EXT_IMAGES.includes(ext)) {
      return NextResponse.json({ error: "Ekstensi gambar tidak diizinkan" }, { status: 400 })
    }
  }

  if (folder === "audio") {
    if (!allowedMimeAudio.includes(file.type)) {
      return NextResponse.json({ error: "Hanya audio WebM, MP3, WAV, OGG yang diizinkan" }, { status: 400 })
    }
    if (!ALLOWED_EXT_AUDIO.includes(ext)) {
      return NextResponse.json({ error: "Ekstensi audio tidak diizinkan" }, { status: 400 })
    }
  }

  // Nama file acak
  const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`
  const dir = path.join(process.cwd(), "public", "uploads", folder)
  await require("fs/promises").mkdir(dir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, safeName), buffer)

  const url = `/uploads/${folder}/${safeName}`
  return NextResponse.json({ url })
}
