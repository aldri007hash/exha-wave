import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orderId, reason } = await req.json()

  if (!orderId) {
    return NextResponse.json({ error: "Order ID diperlukan" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
  }

  if (!["CANCELLED", "PARTIAL"].includes(order.status)) {
    return NextResponse.json({ error: "Hanya order Cancelled atau Partial yang bisa mengajukan refund" }, { status: 400 })
  }

  // Cek apakah sudah ada refund pending
  const existingRefund = await prisma.refund.findFirst({
    where: { orderId, status: "PENDING" },
  })
  if (existingRefund) {
    return NextResponse.json({ error: "Anda sudah mengajukan refund untuk order ini. Tunggu diproses." }, { status: 400 })
  }

  // Hitung jumlah refund
  let refundAmount = order.totalPrice
  if (order.status === "PARTIAL") {
    const totalDelivered = order.items.reduce((sum, item) => sum + (item.delivered || 0), 0)
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
    if (totalQuantity > 0 && totalDelivered < totalQuantity) {
      refundAmount = Math.round(order.totalPrice * (1 - totalDelivered / totalQuantity))
    }
  }

  if (refundAmount <= 0) {
    return NextResponse.json({ error: "Tidak ada jumlah yang bisa direfund" }, { status: 400 })
  }

  const refund = await prisma.refund.create({
    data: {
      orderId,
      userId: session.user.id,
      amount: refundAmount,
      reason: reason || null,
      status: "PENDING",
    },
  })

  // Notifikasi ke admin
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
  })
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: "Pengajuan Refund",
        message: `User ${session.user.name} mengajukan refund Rp${refundAmount.toLocaleString()} untuk order #Exha${order.id.slice(-6).toUpperCase()}. Alasan: ${reason || "Tidak ada alasan"}`,
      },
    })
  }

  return NextResponse.json({ success: true, refund })
}
