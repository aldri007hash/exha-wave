import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import midtransClient from "midtrans-client"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount } = await req.json()

  const settings = await prisma.setting.findMany()
  const minTopup = Number(settings.find(s => s.key === "minTopup")?.value) || 15000
  const maxTopup = Number(settings.find(s => s.key === "maxTopup")?.value) || 1000000

  if (amount < minTopup) return NextResponse.json({ error: `Minimal topup Rp${minTopup.toLocaleString()}` }, { status: 400 })
  if (amount > maxTopup) return NextResponse.json({ error: `Maksimal topup Rp${maxTopup.toLocaleString()}` }, { status: 400 })

  // Cek promo aktif (tanggal)
  const now = new Date()
  const currentHour = now.getHours()

  let activePromo = await prisma.promo.findFirst({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      minAmount: { lte: amount },
      OR: [
        { jamMulai: null },
        { jamMulai: { lte: currentHour }, jamSelesai: { gte: currentHour } }
      ]
    },
    orderBy: { discount: "desc" },
  })

  // Jika tidak ada yang spesifik jam, cari promo tanpa jam
  if (!activePromo) {
    activePromo = await prisma.promo.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        minAmount: { lte: amount },
        jamMulai: null,
      },
      orderBy: { discount: "desc" },
    })
  }

  let finalAmount = amount
  let discountApplied = 0
  if (activePromo) {
    discountApplied = Math.floor(amount * activePromo.discount / 100)
    finalAmount = amount - discountApplied
  }

  const topup = await prisma.topupTransaction.create({
    data: {
      userId: session.user.id,
      amount,
      paymentMethod: "MIDTRANS",
      status: "PENDING",
    },
  })

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true"
  const snap = new midtransClient.Snap({
    isProduction: isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.MIDTRANS_CLIENT_KEY!,
  })

  const parameter = {
    transaction_details: {
      order_id: topup.id,
      gross_amount: finalAmount,
    },
    customer_details: {
      first_name: session.user.name || "User",
      email: session.user.email || "user@example.com",
    },
    custom_field1: "topup",
    custom_field2: session.user.id,
    custom_field3: `Topup Saldo Exha ${amount.toLocaleString("id-ID")}`,
  }

  try {
    const snapToken = await snap.createTransactionToken(parameter)
    return NextResponse.json({
      snapToken,
      topupId: topup.id,
      originalAmount: amount,
      discount: discountApplied,
      finalAmount,
      promoTitle: activePromo?.title,
      promoJamMulai: activePromo?.jamMulai,
      promoJamSelesai: activePromo?.jamSelesai,
    })
  } catch (error: any) {
    console.error("Midtrans Snap error:", error.message)
    return NextResponse.json({ error: "Gagal membuat transaksi. Silakan coba lagi." }, { status: 500 })
  }
}
