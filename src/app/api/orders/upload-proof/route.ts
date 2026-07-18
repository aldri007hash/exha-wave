import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  const orderId = formData.get("orderId") as string

  if (!file || !orderId) {
    return NextResponse.json({ error: "File dan orderId wajib" }, { status: 400 })
  }

  // Validasi tipe file
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Hanya JPG, PNG, PDF yang diizinkan" }, { status: 400 })
  }

  // Validasi ukuran (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 })
  }

  // Cek order milik user
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
  }

  // Upload ke Cloudinary
  const cloudFormData = new FormData()
  cloudFormData.append("file", file)
  cloudFormData.append("upload_preset", "exha_wave_payment")

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: "POST", body: cloudFormData }
  )
  const cloudData = await cloudRes.json()

  if (!cloudData.secure_url) {
    return NextResponse.json({ error: "Gagal upload ke Cloudinary" }, { status: 500 })
  }

  // Update order dengan URL bukti
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentProof: cloudData.secure_url },
  })

  return NextResponse.json({ url: cloudData.secure_url })
}