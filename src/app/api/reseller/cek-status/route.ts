import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const apiKey = req.headers.get("x-api-key")
  if (!apiKey) {
    return NextResponse.json({ error: "API Key diperlukan" }, { status: 401 })
  }

  const keyRecord = await prisma.apiKey.findUnique({ where: { key: apiKey } })
  if (!keyRecord || !keyRecord.isActive) {
    return NextResponse.json({ error: "API Key tidak valid atau dinonaktifkan" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const orderIdRaw = searchParams.get("orderId")
  if (!orderIdRaw) {
    return NextResponse.json({ error: "orderId diperlukan" }, { status: 400 })
  }

  // Cari order berdasarkan ID (bisa partial match untuk format ExhaXXXXXX)
  const orders = await prisma.order.findMany({
    where: { userId: keyRecord.userId },
    include: { items: { include: { service: true } } },
    orderBy: { createdAt: "desc" },
  })

  const order = orders.find(o => {
    const shortId = o.id.slice(-6).toUpperCase()
    return orderIdRaw.toUpperCase().includes(shortId) || o.id.includes(orderIdRaw)
  })

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    order: {
      id: `Exha${order.id.slice(-6).toUpperCase()}`,
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        serviceName: item.service.name,
        targetLink: item.targetLink,
        quantity: item.quantity,
        startCount: item.startCount,
        endCount: item.endCount,
        delivered: item.delivered,
      })),
    },
  })
}
