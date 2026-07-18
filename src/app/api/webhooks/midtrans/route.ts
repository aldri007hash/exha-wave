import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: Request) {
  const body = await req.json()

  // Verifikasi signature
  const serverKey = process.env.MIDTRANS_SERVER_KEY!
  const orderId = body.order_id
  const statusCode = body.status_code
  const grossAmount = body.gross_amount
  const signature = crypto.createHash("sha512").update(orderId + statusCode + grossAmount + serverKey).digest("hex")

  if (body.signature_key !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
  }

  const transactionStatus = body.transaction_status // settlement, capture, deny, cancel, etc.

  if (transactionStatus === "settlement" || transactionStatus === "capture") {
    // Update status topup menjadi SUCCESS
    const topup = await prisma.topupTransaction.update({
      where: { id: orderId },
      data: { status: "SUCCESS" },
    })

    // Tambah saldo user
    await prisma.wallet.upsert({
      where: { userId: topup.userId },
      update: { balance: { increment: topup.amount } },
      create: { userId: topup.userId, balance: topup.amount },
    })

    // Notifikasi ke user
    await prisma.notification.create({
      data: {
        userId: topup.userId,
        title: "Topup Berhasil",
        message: `Saldo Exha Anda bertambah Rp${topup.amount.toLocaleString()}.`,
      },
    })

    // Notifikasi ke admin
    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "Topup Saldo Baru",
          message: `User ${topup.userId} baru saja topup Rp${topup.amount.toLocaleString()}.`,
        },
      })
    }
  } else if (transactionStatus === "deny" || transactionStatus === "cancel") {
    await prisma.topupTransaction.update({
      where: { id: orderId },
      data: { status: "FAILED" },
    })
  }

  return NextResponse.json({ status: "ok" })
}