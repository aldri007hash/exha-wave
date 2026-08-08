import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  // Hitung jumlah order >6 bulan yang belum soft-delete
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
  const oldOrders = await prisma.order.findMany({
    where: {
      createdAt: { lte: sixMonthsAgo },
      deletedAt: null,
      status: { in: ["COMPLETED", "CANCELLED"] },
    },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { service: { select: { name: true } } } },
    },
    take: 1000,
  })

  // Soft delete order lama
  const result = await prisma.order.updateMany({
    where: {
      createdAt: { lte: sixMonthsAgo },
      deletedAt: null,
      status: { in: ["COMPLETED", "CANCELLED"] },
    },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({
    success: true,
    archivedCount: result.count,
    message: `${result.count} pesanan lama telah di-soft delete. Data akan dihapus permanen setelah 30 hari.`,
  })
}
