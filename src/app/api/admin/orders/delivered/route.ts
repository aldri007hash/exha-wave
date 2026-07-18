import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { itemId, delivered } = await req.json()

  // Update delivered
  const item = await prisma.orderItem.update({
    where: { id: itemId },
    data: { delivered },
    include: { order: { include: { items: true } } },
  })

  // Cek apakah semua item dalam order sudah delivered >= quantity
  const order = item.order
  const allCompleted = order.items.every(i => i.delivered >= i.quantity)
  const currentStatus = order.status

  if (allCompleted && currentStatus !== "COMPLETED" && currentStatus !== "CANCELLED") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED" },
    })

    // Update tier & poin jika belum (bisa panggil fungsi yang sama seperti di orders/route.ts)
  }

  return NextResponse.json({ success: true })
}