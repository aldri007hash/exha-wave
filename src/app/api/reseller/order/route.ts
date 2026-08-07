import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key")
  if (!apiKey) {
    return NextResponse.json({ error: "API Key diperlukan" }, { status: 401 })
  }

  const keyRecord = await prisma.apiKey.findUnique({ where: { key: apiKey } })
  if (!keyRecord || !keyRecord.isActive) {
    return NextResponse.json({ error: "API Key tidak valid atau dinonaktifkan" }, { status: 401 })
  }

  const { serviceId, targetLink, quantity, profileName, notes } = await req.json()

  if (!serviceId || !targetLink || !quantity) {
    return NextResponse.json({ error: "serviceId, targetLink, dan quantity wajib diisi" }, { status: 400 })
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service || !service.isActive) {
    return NextResponse.json({ error: "Layanan tidak ditemukan atau tidak aktif" }, { status: 404 })
  }

  if (quantity < service.minOrder) {
    return NextResponse.json({ error: `Minimal order ${service.minOrder} unit` }, { status: 400 })
  }

  let price: number
  if (service.type === "BUNDLE" && service.bundlePrice) {
    const bundles = Math.ceil(quantity / service.minOrder)
    price = bundles * service.bundlePrice
  } else {
    price = Math.round((quantity / service.minOrder) * service.pricePerUnit)
  }

  const order = await prisma.order.create({
    data: {
      userId: keyRecord.userId,
      status: "PENDING_PAYMENT",
      totalPrice: price,
      paymentMethod: "reseller_api",
      items: {
        create: {
          serviceId: service.id,
          targetLink,
          profileName: profileName || null,
          quantity,
          price,
          notes: notes || null,
        },
      },
    },
  })

  // Notifikasi ke admin
  const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } })
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: "Pesanan Baru (API Reseller)",
        message: `Pesanan baru #Exha${order.id.slice(-6).toUpperCase()} via API reseller.`,
      },
    })
  }

  return NextResponse.json({
    success: true,
    orderId: `Exha${order.id.slice(-6).toUpperCase()}`,
    message: "Pesanan berhasil dibuat",
    totalPrice: price,
  })
}
