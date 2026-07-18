import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order || order.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) return NextResponse.json({ error: "File diperlukan" }, { status: 400 })

  // Validasi tipe file
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Hanya JPG, PNG, dan PDF yang diizinkan" }, { status: 400 })
  }

  // Validasi ukuran (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `proof-${Date.now()}-${file.name.replace(/\s/g, "_")}`
  const dir = path.join(process.cwd(), "public", "uploads", "proofs")
  await require("fs/promises").mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)

  const proofUrl = `/uploads/proofs/${filename}`

  await prisma.order.update({
    where: { id: params.id },
    data: {
      paymentProof: proofUrl,
      status: "PROCESSING", // Otomatis ubah status ke PROCESSING
    },
  })

  // Notifikasi ke admin (semua admin)
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } })
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: "Bukti Pembayaran Baru",
        message: `Order #${order.id.slice(-6)} telah mengupload bukti pembayaran.`,
      },
    })
  }

  return NextResponse.json({ success: true, proofUrl })
}