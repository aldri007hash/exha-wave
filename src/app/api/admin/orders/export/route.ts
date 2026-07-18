import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { service: { include: { platform: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  const header = [
    "Order ID",
    "User Name",
    "User Email",
    "Status",
    "Platform",
    "Service",
    "Target Link",
    "Quantity",
    "Price",
    "Total Price",
    "Created At",
  ]

  const rows = orders.flatMap(order =>
    order.items.map(item => [
      order.id,
      order.user.name,
      order.user.email,
      order.status,
      item.service.platform.name,
      item.service.name,
      item.targetLink,
      item.quantity,
      item.price,
      order.totalPrice,
      order.createdAt.toISOString(),
    ])
  )

  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="orders-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}