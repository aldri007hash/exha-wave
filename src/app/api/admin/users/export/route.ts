import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      tier: true,
      points: true,
      totalSpent: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const header = [
    "ID",
    "Name",
    "Email",
    "Phone",
    "Tier",
    "Points",
    "Total Spent",
    "Status",
    "Created At",
  ]

  const rows = users.map(user => [
    user.id,
    user.name,
    user.email,
    user.phone || "",
    user.tier,
    user.points,
    user.totalSpent,
    user.status,
    user.createdAt.toISOString(),
  ])

  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="users-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}