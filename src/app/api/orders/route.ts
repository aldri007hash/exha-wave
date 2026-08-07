import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import midtransClient from "midtrans-client"

const MIN_GLOBAL_ORDER = 10

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { items, paymentMethod, usePoints } = await req.json()

  let calculatedTotal = 0
  const validatedItems: any[] = []

  for (const item of items) {
    const service = await prisma.service.findUnique({ where: { id: item.serviceId } })
    if (!service || !service.isActive) return NextResponse.json({ error: "Layanan tidak tersedia" }, { status: 400 })
    const effectiveMin = Math.max(service.minOrder, MIN_GLOBAL_ORDER)
    if (item.quantity < effectiveMin) return NextResponse.json({ error: `Minimal order ${effectiveMin} unit` }, { status: 400 })
    let price: number
    if (service.type === "BUNDLE" && service.bundlePrice) { const bundles = Math.ceil(item.quantity / effectiveMin); price = bundles * service.bundlePrice }
    else { price = Math.round((item.quantity / effectiveMin) * service.pricePerUnit) }
    calculatedTotal += price
    validatedItems.push({ serviceId: service.id, targetLink: item.targetLink, profileName: item.profileName, notes: item.notes || null, quantity: item.quantity, price })
  }

  const now = new Date()
  const activePromo = await prisma.promo.findFirst({ where: { promoType: "JAM_SIBUK", isActive: true, startDate: { lte: now }, endDate: { gte: now }, jamMulai: { lte: now.getHours() }, jamSelesai: { gte: now.getHours() } }, orderBy: { discount: "desc" } })
  let discount = 0
  if (activePromo) { discount = Math.round(calculatedTotal * (activePromo.discount / 100)); calculatedTotal -= discount }

  const existingCart = await prisma.order.findFirst({ where: { userId: session.user.id, status: "PENDING_PAYMENT", paymentMethod: null } })
  if (existingCart) { await prisma.orderItem.deleteMany({ where: { orderId: existingCart.id } }); await prisma.order.delete({ where: { id: existingCart.id } }) }

  if (usePoints) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user && user.points > 0) {
      const pointsValue = Math.floor(user.points / 10); const pointDiscount = Math.min(pointsValue, calculatedTotal)
      calculatedTotal = Math.max(0, calculatedTotal - pointDiscount)
      await prisma.user.update({ where: { id: session.user.id }, data: { points: 0 } })
      await prisma.pointHistory.create({ data: { adminId: session.user.id, userId: session.user.id, name: "Penggunaan Poin untuk Pembayaran", poin: -user.points, userCount: 1 } })
    }
  }

  // ========== VALIDASI TOTAL > 0 ==========
  if (calculatedTotal <= 0) {
    return NextResponse.json({ error: "Total pembayaran tidak valid (Rp 0). Silakan periksa kembali pesanan Anda." }, { status: 400 })
  }

  if (paymentMethod === "wallet") {
    const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } })
    if (!wallet || wallet.balance < calculatedTotal) return NextResponse.json({ error: "Saldo Exha tidak mencukupi" }, { status: 400 })
    await prisma.wallet.update({ where: { userId: session.user.id }, data: { balance: { decrement: calculatedTotal } } })
    const order = await prisma.order.create({ data: { userId: session.user.id, status: "PROCESSING", totalPrice: calculatedTotal, paymentMethod: "wallet", items: { create: validatedItems } } })
    await prisma.notification.create({ data: { userId: session.user.id, title: "Pesanan Dibayar dengan Saldo", message: `Pesanan #Exha${order.id.slice(-6).toUpperCase()} telah dibayar menggunakan Saldo Exha. Total: Rp${calculatedTotal.toLocaleString()}` } })
    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } })
    for (const admin of admins) { await prisma.notification.create({ data: { userId: admin.id, title: "Pesanan Baru", message: `Pesanan baru #Exha${order.id.slice(-6).toUpperCase()} dari ${session.user.name} (${session.user.email}).` } }) }
    return NextResponse.json({ order, instruction: { instructions: "Pembayaran berhasil menggunakan Saldo Exha." }, discount })
  }

  const order = await prisma.order.create({ data: { userId: session.user.id, status: "PENDING_PAYMENT", totalPrice: calculatedTotal, paymentMethod, items: { create: validatedItems } } })

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true"
  let snapToken = null
  try {
    const snap = new midtransClient.Snap({ isProduction, serverKey: process.env.MIDTRANS_SERVER_KEY!, clientKey: process.env.MIDTRANS_CLIENT_KEY! });
    snapToken = await snap.createTransactionToken({
      transaction_details: { order_id: order.id, gross_amount: calculatedTotal },
      customer_details: { first_name: session.user.name || "User", email: session.user.email || "user@example.com" }
    })
  } catch (error: any) {
    console.error("Midtrans Snap error:", error.message)
  }

  const method = await prisma.paymentMethod.findUnique({ where: { id: paymentMethod } })
  const instruction = method ? { instructions: method.instructions } : { instructions: "Silakan transfer ke rekening yang tertera." }

  await prisma.notification.create({ data: { userId: session.user.id, title: "Pesanan Baru", message: `Pesanan #Exha${order.id.slice(-6).toUpperCase()} berhasil dibuat. Total: Rp${calculatedTotal.toLocaleString()}. Silakan lakukan pembayaran.` } })
  const admins2 = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } })
  for (const admin of admins2) { await prisma.notification.create({ data: { userId: admin.id, title: "Pesanan Baru", message: `Pesanan baru #Exha${order.id.slice(-6).toUpperCase()} dari ${session.user.name} (${session.user.email}).` } }) }

  return NextResponse.json({ order, snapToken, instruction, discount })
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, paymentMethod: { not: null } },
    include: { items: { include: { service: true } }, review: true },
    orderBy: { createdAt: "desc" },
  })

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id, title: "Status Pesanan Diperbarui" },
    orderBy: { createdAt: "desc" },
  })

  const ordersWithCompletion = orders.map(order => {
    const shortId = order.id.slice(-6).toUpperCase()
    const notif = notifications.find(n => n.message.includes(shortId))
    let completionReason: string | undefined
    let completionFile: string | undefined
    if (notif) {
      const reasonMatch = notif.message.match(/Alasan: (.*?)(?:\n|$)/)
      const fileMatch = notif.message.match(/File: (.*?)(?:\n|$)/)
      completionReason = reasonMatch ? reasonMatch[1] : undefined
      completionFile = fileMatch ? fileMatch[1] : undefined
    }
    return { ...order, completionReason, completionFile }
  })

  return NextResponse.json({ orders: ordersWithCompletion })
}
