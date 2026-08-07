import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Ambil order items dari order yang COMPLETED
  const orderItems = await prisma.orderItem.findMany({
    where: { order: { status: "COMPLETED" } },
    select: { serviceId: true },
  })

  // Hitung jumlah order per service
  const countMap = new Map<string, number>()
  orderItems.forEach(item => {
    countMap.set(item.serviceId, (countMap.get(item.serviceId) || 0) + 1)
  })

  // Ambil review yang sudah disetujui
  const reviews = await prisma.review.findMany({
    where: { isApproved: true },
    select: {
      order: { select: { items: { select: { serviceId: true } } } },
      rating: true,
    },
  })

  // Hitung rata-rata rating per service
  const ratingMap = new Map<string, { total: number; count: number }>()
  reviews.forEach(review => {
    const serviceIds = review.order?.items?.map(i => i.serviceId) || []
    serviceIds.forEach(sid => {
      const current = ratingMap.get(sid) || { total: 0, count: 0 }
      ratingMap.set(sid, { total: current.total + review.rating, count: current.count + 1 })
    })
  })

  // Gabungkan hasil menggunakan Array.from (kompatibel tanpa downlevelIteration)
  const stats: Record<string, { orderCount: number; avgRating: number }> = {}
  Array.from(countMap.entries()).forEach(([serviceId, orderCount]) => {
    const ratingData = ratingMap.get(serviceId)
    const avgRating = ratingData ? ratingData.total / ratingData.count : 0
    stats[serviceId] = { orderCount, avgRating: Math.round(avgRating * 10) / 10 }
  })

  return NextResponse.json({ stats })
}
