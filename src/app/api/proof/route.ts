import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Klien Puas: total user yang sudah memberikan ulasan (tidak harus di-approve)
    const totalUsers = await prisma.review.count()

    // Campaign Selesai: total order dengan status COMPLETED
    const completedOrders = await prisma.order.count({
      where: { status: "COMPLETED" },
    })

    // Platform Aktif: platform yang memiliki setidaknya 1 layanan aktif
    const activePlatforms = await prisma.platform.count({
      where: {
        services: { some: { isActive: true } },
      },
    })

    // Rating Kepuasan: rata-rata semua rating dari review
    const ratingAgg = await prisma.review.aggregate({
      _avg: { rating: true },
    })
    const rating = ratingAgg._avg.rating ? ratingAgg._avg.rating.toFixed(1) : "0.0"

    return NextResponse.json({
      totalUsers,
      completedOrders,
      activePlatforms,
      rating,
    })
  } catch (error) {
    console.error("Proof API error:", error)
    return NextResponse.json({
      totalUsers: 0,
      completedOrders: 0,
      activePlatforms: 0,
      rating: "0.0",
    })
  }
}
