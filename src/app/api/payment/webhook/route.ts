import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import midtransClient from "midtrans-client"

export async function POST(req: Request) {
  const body = await req.json()

  let core = new midtransClient.CoreApi({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.MIDTRANS_CLIENT_KEY!,
  })

  try {
    const statusResponse = await core.transaction.notification(body)
    const orderId = statusResponse.order_id
    const transactionStatus = statusResponse.transaction_status
    const fraudStatus = statusResponse.fraud_status

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PROCESSING" },
      })
      // Notifikasi ke user
      const order = await prisma.order.findUnique({ where: { id: orderId } })
      if (order) {
        await prisma.notification.create({
          data: {
            userId: order.userId,
            title: "Pembayaran Dikonfirmasi",
            message: `Pembayaran untuk Order #${order.id.slice(-6)} berhasil. Pesanan sedang diproses.`,
          },
        })
      }
    } else if (transactionStatus === "expire" || transactionStatus === "cancel") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      })
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}