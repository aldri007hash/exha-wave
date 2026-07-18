import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import midtransClient from "midtrans-client"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount } = await req.json()

  // Ambil pengaturan batas topup dari database
  const settings = await prisma.setting.findMany()
  const minTopup = Number(settings.find(s => s.key === "minTopup")?.value) || 15000
  const maxTopup = Number(settings.find(s => s.key === "maxTopup")?.value) || 1000000

  if (amount < minTopup) return NextResponse.json({ error: `Minimal topup Rp${minTopup.toLocaleString()}` }, { status: 400 })
  if (amount > maxTopup) return NextResponse.json({ error: `Maksimal topup Rp${maxTopup.toLocaleString()}` }, { status: 400 })

  // Buat transaksi di database dengan status PENDING
  const topup = await prisma.topupTransaction.create({
    data: {
      userId: session.user.id,
      amount,
      paymentMethod: "MIDTRANS",
      status: "PENDING",
    },
  })

  // Generate Snap Token
  const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.MIDTRANS_CLIENT_KEY!,
  })

  const parameter = {
    transaction_details: {
      order_id: topup.id, // gunakan ID transaksi kita sebagai order_id
      gross_amount: amount,
    },
    customer_details: {
      first_name: session.user.name,
      email: session.user.email,
    },
  }

  const snapToken = await snap.createTransactionToken(parameter)

  return NextResponse.json({ snapToken, topupId: topup.id })
}