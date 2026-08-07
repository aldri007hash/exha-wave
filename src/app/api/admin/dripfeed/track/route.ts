import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: {
      dripFeedRequest: true,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ orders })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orderId, day } = await req.json()
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order?.dripFeedBatches) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const batches = order.dripFeedBatches as any[]
  const updated = batches.map((b: any) => (b.day === day ? { ...b, completed: true } : b))
  const completedCount = updated.filter((b: any) => b.completed).length

  await prisma.order.update({
    where: { id: orderId },
    data: {
      dripFeedBatches: updated,
      status: completedCount === batches.length ? "COMPLETED" : "PROGRESS",
    },
  })

  return NextResponse.json({ success: true })
}
