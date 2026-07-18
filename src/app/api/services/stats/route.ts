import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // Hitung total order per service (COMPLETED)
  const serviceOrderCounts = await prisma.orderItem.groupBy({
    by: ["serviceId"],
    _count: { id: true },
    where: {
      order: { status: "COMPLETED" },
    },
  })

  // Mapping serviceId -> orderCount
  const countMap = new Map<string, number>()
  for (const item of serviceOrderCounts) {
    countMap.set(item.serviceId, item._count.id)
  }

  // Hitung rating rata-rata per service (dari testimoni approved)
  // Kita perlu join melalui OrderItem -> Order -> Review
  const reviews = await prisma.review.findMany({
    where: { isApproved: true },
    include: {
      order: {
        include: {
          items: {
            include: { service: true },
          },
        },
      },
    },
  })

  // Mapping serviceId -> { totalRating, count }
  const ratingMap = new Map<string, { total: number; count: number }>()
  for (const review of reviews) {
    for (const item of review.order.items) {
      const existing = ratingMap.get(item.serviceId) || { total: 0, count: 0 }
      ratingMap.set(item.serviceId, {
        total: existing.total + review.rating,
        count: existing.count + 1,
      })
    }
  }

  // Gabungkan
  const stats: Record<string, { orderCount: number; avgRating: number }> = {}
  for (const [serviceId, orderCount] of countMap) {
    const ratingData = ratingMap.get(serviceId)
    const avgRating = ratingData ? ratingData.total / ratingData.count : 0
    stats[serviceId] = {
      orderCount,
      avgRating: Math.round(avgRating * 10) / 10,
    }
  }

  return NextResponse.json({ stats })
}