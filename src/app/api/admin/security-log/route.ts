import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Hanya Superadmin" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")

  // Filter: login gagal, reset password, hapus data
  const actions = [
    "LOGIN_FAILED",
    "RESET_PASSWORD",
    "DELETE_SERVICE",
    "DELETE_USER",
    "DELETE_ORDER",
  ]

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: {
        action: { in: actions },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count({
      where: { action: { in: actions } },
    }),
  ])

  return NextResponse.json({
    logs: logs.map(log => ({
      id: log.id,
      adminName: log.user.name,
      adminEmail: log.user.email,
      action: log.action,
      ip: log.ip,
      userAgent: log.userAgent,
      timestamp: log.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}
