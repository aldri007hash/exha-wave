import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { userId, serviceId, items } = await req.json()

  if (!userId || !serviceId || !items || items.length === 0) {
    return NextResponse.json({ error: "Semua field diperlukan" }, { status: 400 })
  }

  // Cari user berdasarkan ID atau email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: userId },
        { email: userId },
      ],
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
  }

  // Buat order
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      status: "PROCESSING", // langsung proses
      totalPrice: 0,
      items: {
        create: items.map((item: any) => ({
          serviceId,
          targetLink: item.targetLink,
          profileName: item.profileName,
          quantity: item.quantity,
          price: 0,
        })),
      },
    },
  })

  // Hitung total
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