import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: { dripFeedRequest: true },
    include: { user: { select: { name: true, email: true } }, items: { include: { service: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ orders })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orderId, action } = await req.json()

  if (action === "approve") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PROGRESS" },
    })
  } else if (action === "reject") {
    await prisma.order.update({
      where: { id: orderId },
      data: { dripFeedRequest: false, dripFeedBatches: null },
    })
  }

  return NextResponse.json({ success: true })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orderId, day, completed } = await req.json()

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || !order.dripFeedBatches) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let batches: any[] = order.dripFeedBatches as any[]
  batches = batches.map(batch => {
    if (batch.day === day) {
      return { ...batch, completed }
    }
    return batch
  })

  // Jika semua batch selesai, ubah status ke COMPLETED
  if (batches.every(b => b.completed)) {
    await prisma.order.update({
      where: { id: orderId },
      data: { dripFeedBatches: batches, status: "COMPLETED" },
    })
  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: { dripFeedBatches: batches },
    })
  }

  return NextResponse.json({ success: true })
}