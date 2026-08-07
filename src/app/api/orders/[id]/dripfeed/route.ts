import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orderId, dripDays } = await req.json()

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  })
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
  }

  // Bagi items ke dalam batch per hari
  const items = order.items
  const itemsPerDay = Math.ceil(items.length / dripDays)
  const batches = []
  for (let i = 0; i < dripDays; i++) {
    const start = i * itemsPerDay
    const end = start + itemsPerDay
    const dayItems = items.slice(start, end)
    batches.push({
      day: i + 1,
      items: dayItems.map(item => ({
        id: item.id,
        serviceName: item.serviceId,
        targetLink: item.targetLink,
        quantity: item.quantity,
      })),
      completed: false,
    })
  }

  await prisma.order.update({
    where: { id: params.id },
    data: {
      dripFeedRequest: true,
      dripFeedBatches: batches,
      status: "PROCESSING",
    },
  })

  return NextResponse.json({ success: true })
}
