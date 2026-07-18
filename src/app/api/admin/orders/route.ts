import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTier } from "@/lib/utils"

function checkRole(session: any) {
  return session && (session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN")
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!checkRole(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const status = searchParams.get("status")
  const search = searchParams.get("search") || ""
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const where: any = {}
  if (status && status !== "ALL") where.status = status
  if (search) {
    where.OR = [
      { user: { email: { contains: search, mode: "insensitive" } } },
      { id: { contains: search, mode: "insensitive" } },
      { items: { some: { service: { name: { contains: search, mode: "insensitive" } } } } },
    ]
  }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59.999Z")
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { service: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return NextResponse.json({
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!checkRole(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orderId, status, reason } = await req.json()
  await prisma.order.update({ where: { id: orderId }, data: { status } })

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (order) {
    let message = `Pesanan #${order.id.slice(-6)} sekarang berstatus ${status}.`
    if (reason) message += ` Alasan: ${reason}`
    await prisma.notification.create({
      data: { userId: order.userId, title: "Status Pesanan Diperbarui", message },
    })

    if (status === "COMPLETED") {
      const result = await prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { userId: order.userId, status: "COMPLETED" },
      })
      const totalSpent = result._sum.totalPrice || 0
      const newTier = calculateTier(totalSpent)
      await prisma.user.update({
        where: { id: order.userId },
        data: { totalSpent, tier: newTier },
      })
    }
  }

  return NextResponse.json({ success: true })
}