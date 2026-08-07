import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipe file tidak diizinkan. Gunakan JPG, PNG, atau PDF." }, { status: 400 })
    }

    // Validasi ukuran (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `completion-${Date.now()}-${file.name.replace(/\s/g, "_")}`
    const dir = path.join(process.cwd(), "public", "uploads", "completion")
    await require("fs/promises").mkdir(dir, { recursive: true })
    const filePath = path.join(dir, filename)
    await writeFile(filePath, buffer)

    const url = `/uploads/completion/${filename}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Upload completion error:", error)
    return NextResponse.json({ error: "Gagal mengupload file" }, { status: 500 })
  }
}
