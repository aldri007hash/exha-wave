import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile } from "fs/promises"
import path from "path"

const ALLOWED_EXT = ["jpg", "jpeg", "png", "pdf"]

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  const orderId = formData.get("orderId") as string

  if (!file || !orderId) return NextResponse.json({ error: "File dan orderId wajib" }, { status: 400 })

  // Ambil ekstensi dari nama file asli
  const originalName = file.name || ""
  const ext = originalName.split(".").pop()?.toLowerCase() || ""

  // Validasi tipe MIME
  const allowedMime = ["image/jpeg", "image/png", "application/pdf"]
  if (!allowedMime.includes(file.type)) return NextResponse.json({ error: "Hanya JPG, PNG, PDF yang diizinkan" }, { status: 400 })

  // Validasi ekstensi
  if (!ALLOWED_EXT.includes(ext)) return NextResponse.json({ error: "Ekstensi file tidak diizinkan" }, { status: 400 })

  // Validasi ukuran (max 2MB)
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 })

  // Cek order milik user
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.userId !== session.user.id) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })

  // Buat nama file acak + ekstensi asli (tanpa nama asli)
  const safeName = `proof-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`
  const dir = path.join(process.cwd(), "public", "uploads", "proofs")
  await require("fs/promises").mkdir(dir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, safeName), buffer)

  const proofUrl = `/uploads/proofs/${safeName}`

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentProof: proofUrl },
  })

  return NextResponse.json({ success: true, proofUrl })
}
