import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const requests = await prisma.order.findMany({
    where: { refillStatus: { in: ["PENDING", "COMPLETED"] } },
    include: { user: { select: { name: true, email: true } }, items: { include: { service: true } } },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ requests })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orderId, action } = await req.json()
  if (!orderId || !action) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })

  if (action === "complete") {
    await prisma.order.update({ where: { id: orderId }, data: { refillStatus: "COMPLETED" } })
  } else if (action === "reject") {
    await prisma.order.update({ where: { id: orderId }, data: { refillStatus: "NONE" } })
  }

  return NextResponse.json({ success: true })
}
