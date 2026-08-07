import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTier } from "@/lib/utils"
import { Tier } from "@prisma/client"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
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

  // Ambil semua payment methods untuk mapping
  const paymentMethods = await prisma.paymentMethod.findMany()
  const paymentMethodMap = new Map<string, string>()
  paymentMethods.forEach(pm => paymentMethodMap.set(pm.id, pm.name))

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

  // Tambahkan nama payment method
  const ordersWithPaymentName = orders.map(order => ({
    ...order,
    paymentMethodName: paymentMethodMap.get(order.paymentMethod || "") || order.paymentMethod || "Tidak diketahui",
  }))

  return NextResponse.json({
    orders: ordersWithPaymentName,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orderId, status, reason, completionFile, itemUpdates } = await req.json()
  console.log("PUT /api/admin/orders - data:", { orderId, status, reason, completionFile })

  if (["COMPLETED", "PARTIAL", "CANCELLED", "PROGRESS"].includes(status) && (!reason || reason.trim() === "")) {
    return NextResponse.json({ error: "Alasan wajib diisi untuk status ini" }, { status: 400 })
  }

  if (status === "COMPLETED") {
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      include: { service: true },
    })
    const hasGaransiService = orderItems.some(item => item.service.hasGaransi)

    const updateData: any = { status, adminNote: reason || null, completionFile: completionFile || null }
    if (hasGaransiService) {
      updateData.isGaransi = true
      updateData.garansiStart = new Date()
      updateData.garansiEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    } else {
      updateData.isGaransi = false
    }
    await prisma.order.update({ where: { id: orderId }, data: updateData })
  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: { status, adminNote: reason || null, completionFile: completionFile || null },
    })
  }

  if (itemUpdates && Array.isArray(itemUpdates)) {
    for (const item of itemUpdates) {
      const updateItemData: any = {}
      if (item.startCount !== undefined) updateItemData.startCount = item.startCount
      if (item.endCount !== undefined) updateItemData.endCount = item.endCount
      if (Object.keys(updateItemData).length > 0) {
        await prisma.orderItem.update({ where: { id: item.itemId }, data: updateItemData })
      }
    }
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (order) {
    let message = `Pesanan #Exha${order.id.slice(-6).toUpperCase()} sekarang berstatus ${status}.`
    if (reason) message += `\nAlasan: ${reason}`
    if (completionFile) message += `\nFile: ${completionFile}`
    
    try {
      await prisma.notification.create({
        data: { userId: order.userId, title: "Status Pesanan Diperbarui", message },
      })
      await prisma.activityLog.create({
        data: { userId: session.user.id, action: `Mengubah status order #Exha${order.id.slice(-6).toUpperCase()} menjadi ${status}`, ip: "system", userAgent: "admin" },
      })
    } catch (err) { console.error("Gagal notifikasi/activity log:", err) }

    if (status === "COMPLETED") {
      const result = await prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { userId: order.userId, status: "COMPLETED" },
      })
      const totalSpent = result._sum.totalPrice || 0
      await prisma.user.update({ where: { id: order.userId }, data: { totalSpent, tier: calculateTier(totalSpent) as Tier } })
    }
  }

  return NextResponse.json({ success: true })
}
