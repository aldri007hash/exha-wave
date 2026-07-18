import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const { dripFeedDays, dripFeedPerDay } = await req.json()
  if (!dripFeedDays || !dripFeedPerDay) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
  }

  // Hitung unit per hari dan siapkan batch
  const batches = Array.from({ length: dripFeedDays }, (_, i) => ({
    day: i + 1,
    quantity: dripFeedPerDay,
    completed: false,
  }))

  await prisma.order.update({
    where: { id: params.id },
    data: {
      dripFeed: true,
      dripFeedDays,
      dripFeedPerDay,
      dripFeedStatus: "PENDING",
      dripFeedBatches: batches,
      status: "PENDING_DRIP_FEED",
    },
  })

  return NextResponse.json({ success: true })
}