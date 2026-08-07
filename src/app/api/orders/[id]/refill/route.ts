import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const order = await prisma.order.findUnique({ 
    where: { id: params.id },
    include: { items: { include: { service: true } } }
  })
  if (!order || order.userId !== session.user.id) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })

  // Cek apakah order memiliki layanan bergaransi
  const hasGaransiService = order.items.some(item => item.service.hasGaransi)
  if (!hasGaransiService) return NextResponse.json({ error: "Layanan ini tidak bergaransi" }, { status: 400 })

  // Validasi: hanya bisa ajukan refill jika COMPLETED, dalam rentang H+3 s/d H+7 (dari tanggal COMPLETED)
  const now = new Date()
  // Gunakan garansiStart (tanggal COMPLETED) sebagai acuan, fallback ke updatedAt
  const completedDate = order.garansiStart ? new Date(order.garansiStart) : new Date(order.updatedAt)
  const hPlus3 = new Date(completedDate.getTime() + 3 * 24 * 60 * 60 * 1000)
  const hPlus7 = new Date(completedDate.getTime() + 7 * 24 * 60 * 60 * 1000)

  if (order.status !== "COMPLETED") return NextResponse.json({ error: "Hanya order selesai yang bisa mengajukan garansi" }, { status: 400 })
  if (now < hPlus3) return NextResponse.json({ error: "Garansi bisa diajukan setelah H+3 dari waktu pesanan selesai" }, { status: 400 })
  if (now > hPlus7) return NextResponse.json({ error: "Garansi sudah melewati batas waktu H+7" }, { status: 400 })
  if (order.refillStatus === "PENDING") return NextResponse.json({ error: "Anda sudah mengajukan garansi, tunggu diproses" }, { status: 400 })

  const { reason } = await req.json()
  if (!reason || reason.trim() === "") return NextResponse.json({ error: "Alasan wajib diisi" }, { status: 400 })

  await prisma.order.update({
    where: { id: params.id },
    data: { refillStatus: "PENDING", refillReason: reason },
  })

  // Notifikasi ke admin
  const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } })
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: "Pengajuan Garansi",
        message: `User ${session.user.name} mengajukan garansi untuk order #Exha${order.id.slice(-6).toUpperCase()}. Alasan: ${reason}`,
      },
    })
  }

  return NextResponse.json({ success: true })
}
