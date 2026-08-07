import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Hanya Superadmin" }, { status: 403 })
  }

  try {
    // Ringkasan total
    const [totalRevenue, totalRefund, totalTopupPending, totalTopupSuccess] = await Promise.all([
      prisma.order.aggregate({ _sum: { totalPrice: true }, where: { status: "COMPLETED" } }),
      prisma.refund.aggregate({ _sum: { amount: true }, where: { status: "APPROVED" } }),
      prisma.topupTransaction.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
      prisma.topupTransaction.aggregate({ _sum: { amount: true }, where: { status: { in: ["SUCCESS", "APPROVED"] } } }),
    ])

    const revenue = totalRevenue._sum.totalPrice || 0
    const refund = totalRefund._sum.amount || 0
    const topupPending = totalTopupPending._sum.amount || 0
    const topupSuccess = totalTopupSuccess._sum.amount || 0
    const labaKotor = revenue + topupSuccess - refund

    // Data per bulan (6 bulan terakhir)
    const today = new Date()
    const monthlyData: Record<string, { revenue: number; topup: number; refund: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthlyData[key] = { revenue: 0, topup: 0, refund: 0 }
    }

    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)
    
    const monthlyOrders = await prisma.order.findMany({
      where: { status: "COMPLETED", createdAt: { gte: sixMonthsAgo } },
      select: { totalPrice: true, createdAt: true },
    })
    monthlyOrders.forEach(o => {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`
      if (monthlyData[key]) monthlyData[key].revenue += o.totalPrice
    })

    const monthlyTopups = await prisma.topupTransaction.findMany({
      where: { status: { in: ["SUCCESS", "APPROVED"] }, createdAt: { gte: sixMonthsAgo } },
      select: { amount: true, createdAt: true },
    })
    monthlyTopups.forEach(t => {
      const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, "0")}`
      if (monthlyData[key]) monthlyData[key].topup += t.amount
    })

    const monthlyRefunds = await prisma.refund.findMany({
      where: { status: "APPROVED", createdAt: { gte: sixMonthsAgo } },
      select: { amount: true, createdAt: true },
    })
    monthlyRefunds.forEach(r => {
      const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`
      if (monthlyData[key]) monthlyData[key].refund += r.amount
    })

    const chartData = Object.entries(monthlyData).map(([bulan, data]) => ({
      bulan,
      pendapatan: data.revenue + data.topup,
      refund: data.refund,
      laba: data.revenue + data.topup - data.refund,
    }))

    return NextResponse.json({
      summary: { revenue, refund, topupPending, topupSuccess, labaKotor },
      chartData,
    })
  } catch (error) {
    console.error("Finance API error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
