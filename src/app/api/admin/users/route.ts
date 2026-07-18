import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const search = searchParams.get("search") || ""
  const tier = searchParams.get("tier") || ""
  const status = searchParams.get("status") || ""

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }
  if (tier) where.tier = tier
  if (status) where.status = status

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true,
        tier: true, points: true, totalSpent: true,
        status: true, banReason: true, suspendUntil: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { userId, action, reason, months } = await req.json()

  if (action === "ban") {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "BANNED", banReason: reason, suspendUntil: null },
    })
  } else if (action === "suspend") {
    const suspendUntil = new Date()
    suspendUntil.setMonth(suspendUntil.getMonth() + months)
    await prisma.user.update({
      where: { id: userId },
      data: { status: "SUSPENDED", banReason: reason, suspendUntil },
    })
  } else if (action === "unban" || action === "unsuspend") {
    // Kembalikan user ke status ACTIVE
    await prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE", banReason: null, suspendUntil: null },
    })
  }

  await prisma.notification.create({
    data: {
      userId,
      title: "Status Akun Diperbarui",
      message: reason ? `Akun Anda terkena ${action}. Alasan: ${reason}` : `Status akun diperbarui.`,
    },
  })

  return NextResponse.json({ success: true })
}