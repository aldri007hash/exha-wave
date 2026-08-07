import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    // Parse body
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ status: "error", message: "Invalid JSON" }, { status: 400 })
    }

    const orderId = body.order_id as string | undefined
    const statusCode = body.status_code as string | undefined
    const grossAmount = body.gross_amount as string | undefined
    const signatureKey = body.signature_key as string | undefined
    const transactionStatus = body.transaction_status as string | undefined

    // Jika tidak ada order_id, abaikan
    if (!orderId) {
      return NextResponse.json({ status: "ok", message: "Missing order_id" })
    }

    // Verifikasi signature (jika ada)
    const serverKey = process.env.MIDTRANS_SERVER_KEY
    if (signatureKey && serverKey && orderId && statusCode && grossAmount) {
      const expectedSignature = crypto
        .createHash("sha512")
        .update(orderId + statusCode + grossAmount + serverKey)
        .digest("hex")
      if (signatureKey !== expectedSignature) {
        // Signature tidak valid – tetap kembalikan 200 agar Midtrans tidak retry, tapi log error
        console.error("Invalid signature for order:", orderId)
        return NextResponse.json({ status: "ok", message: "Signature mismatch - acknowledged" })
      }
    } else {
      // Jika tidak ada signature, tetap lanjutkan (test notification dari dashboard Midtrans biasanya tidak menyertakan signature)
      console.warn("Webhook received without signature, order:", orderId)
    }

    // Coba update topup transaction
    const topup = await prisma.topupTransaction.findUnique({ where: { id: orderId } })
    if (topup) {
      if (transactionStatus === "settlement" || transactionStatus === "capture") {
        await prisma.topupTransaction.update({
          where: { id: orderId },
          data: { status: "SUCCESS" },
        })
        // Pastikan wallet ada
        const wallet = await prisma.wallet.findUnique({ where: { userId: topup.userId } })
        if (wallet) {
          await prisma.wallet.update({
            where: { userId: topup.userId },
            data: { balance: { increment: topup.amount } },
          })
        } else {
          await prisma.wallet.create({
            data: {
              userId: topup.userId,
              balance: topup.amount,
            },
          })
        }
        await prisma.notification.create({
          data: {
            userId: topup.userId,
            title: "Topup Berhasil",
            message: `Saldo Exha Anda bertambah Rp${topup.amount.toLocaleString()}.`,
          },
        })
      } else if (["deny", "cancel", "expire"].includes(transactionStatus || "")) {
        await prisma.topupTransaction.update({
          where: { id: orderId },
          data: { status: "FAILED" },
        })
      }
      return NextResponse.json({ status: "ok" })
    }

    // Coba update order
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (order) {
      if (transactionStatus === "settlement" || transactionStatus === "capture") {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "PROCESSING" },
        })
        await prisma.notification.create({
          data: {
            userId: order.userId,
            title: "Pembayaran Dikonfirmasi",
            message: `Pembayaran untuk pesanan #Exha${order.id.slice(-6).toUpperCase()} telah dikonfirmasi.`,
          },
        })
      } else if (["deny", "cancel", "expire"].includes(transactionStatus || "")) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        })
      }
      return NextResponse.json({ status: "ok" })
    }

    // Transaksi tidak ditemukan (misal test dari Midtrans)
    return NextResponse.json({ status: "ok", message: "Transaction not found" })
  } catch (error: any) {
    console.error("Webhook Midtrans error:", error?.message || error)
    // SELALU kembalikan 200 agar Midtrans tidak retry
    return NextResponse.json({ status: "ok", message: "Internal processing error" })
  }
}
