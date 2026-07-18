import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: Request) {
  const body = await req.json()

  // Validasi signature (hanya production)
  if (process.env.MIDTRANS_SERVER_KEY && !process.env.MIDTRANS_SERVER_KEY.startsWith("SB-")) {
    const signature = req.headers.get("x-midtrans-signature")
    if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 401 })

    const hash = crypto
      .createHash("sha512")
      .update(`${body.order_id}${body.status_code}${body.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
      .digest("hex")

    if (signature !== hash) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  // Hanya proses status settlement/capture
  if (!body.transaction_status || !["settlement", "capture"].includes(body.transaction_status)) {
    return NextResponse.json({ status: "ignored" })
  }

  const orderId = body.order_id
  if (!orderId) return NextResponse.json({ error: "Missing order_id" }, { status: 400 })

  // Cegah replay attack
  const existingOrder = await prisma.order.findUnique({ where: { id: orderId } })
  if (!existingOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  if (["PROCESSING", "COMPLETED"].includes(existingOrder.status)) {
    return NextResponse.json({ status: "already_processed" })
  }

  // Update status order
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PROCESSING" },
  })

  // Kirim notifikasi ke user
  await prisma.notification.create({
    data: {
      userId: existingOrder.userId,
      title: "Pembayaran Dikonfirmasi",
      message: `Pembayaran untuk pesanan #${orderId.slice(-6)} telah dikonfirmasi. Pesanan sedang diproses.`,
    },
  })

  return NextResponse.json({ status: "ok" })
}