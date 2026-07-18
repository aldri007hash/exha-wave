import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { serviceId, items } = await req.json()

  if (!serviceId || !items || items.length === 0) {
    return NextResponse.json({ error: "Service dan items diperlukan" }, { status: 400 })
  }

  // Buat order baru atau tambahkan ke order pending (keranjang)
  const order = await prisma.order.upsert({
    where: { id: `cart-${session.user.id}` },
    update: {},
    create: {
      userId: session.user.id,
      status: "PENDING_PAYMENT",
      totalPrice: 0,
      items: {
        create: items.map((item: any) => ({
          serviceId,
          targetLink: item.targetLink,
          profileName: item.profileName,
          quantity: item.quantity,
          price: 0, // akan dihitung ulang nanti
        })),
      },
    },
  })

  // Hitung ulang total harga
  const updatedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: { items: { include: { service: true } } },
  })

  if (updatedOrder) {
    let total = 0
    for (const item of updatedOrder.items) {
      const unitPrice = item.service.pricePerUnit / item.service.minOrder
      const itemTotal = item.quantity * unitPrice
      total += itemTotal
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { price: itemTotal },
      })
    }
    await prisma.order.update({
      where: { id: order.id },
      data: { totalPrice: total },
    })
  }

  return NextResponse.json({ success: true })
}