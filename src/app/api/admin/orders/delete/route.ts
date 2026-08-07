import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get("orderId")

  if (!orderId) return NextResponse.json({ error: "Order ID diperlukan" }, { status: 400 })

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })

    await prisma.orderItem.deleteMany({ where: { orderId } })
    await prisma.order.delete({ where: { id: orderId } })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `DELETE_ORDER`,
        ip: "system",
        userAgent: `Menghapus order #Exha${orderId.slice(-6).toUpperCase()}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Gagal menghapus pesanan" }, { status: 500 })
  }
}
