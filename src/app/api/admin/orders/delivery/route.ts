import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTier } from "@/lib/utils"
import { Tier } from "@prisma/client"

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orderItemId, delivered } = await req.json()

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } })
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })

  const updated = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { delivered },
  })

  const order = await prisma.order.findUnique({
    where: { id: item.orderId },
    include: { items: true },
  })
  if (order) {
    const allDone = order.items.every(i => i.delivered >= i.quantity)
    if (allDone && order.status !== "COMPLETED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED" },
      })
      const pointsEarned = order.totalPrice >= 100000 ? 50 : order.totalPrice >= 50000 ? 20 : 0
      if (pointsEarned > 0) {
        await prisma.user.update({
          where: { id: order.userId },
          data: { points: { increment: pointsEarned } },
        })
      }
      const result = await prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { userId: order.userId, status: "COMPLETED" },
      })
      const totalSpent = result._sum.totalPrice || 0
      const tierString = calculateTier(totalSpent)
      // Cast ke enum Tier agar sesuai dengan schema Prisma
      const newTier: Tier = (tierString as Tier) || "BRONZE"
      await prisma.user.update({
        where: { id: order.userId },
        data: { totalSpent, tier: newTier },
      })
      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: "Pesanan Selesai",
          message: `Pesanan #${order.id.slice(-6)} telah selesai.`,
        },
      })
    }
  }

  return NextResponse.json({ success: true, item: updated })
}
