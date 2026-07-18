import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const [totalUsers, completedOrders, activePlatforms, avgRating] = await Promise.all([
    prisma.user.count({ where: { orders: { some: { status: "COMPLETED" } } } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.platform.count({ where: { services: { some: { isActive: true } } } }),
    prisma.review.aggregate({ where: { isApproved: true }, _avg: { rating: true } }),
  ])

  const rating = avgRating._avg.rating ? avgRating._avg.rating.toFixed(1) : "0.0"

  return NextResponse.json({ totalUsers, completedOrders, activePlatforms, rating })
}