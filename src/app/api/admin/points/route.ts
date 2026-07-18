import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")

  const [history, total] = await Promise.all([
    prisma.pointHistory.findMany({
      include: { admin: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.pointHistory.count(),
  ])

  return NextResponse.json({
    history,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, kuota, poin, userIds } = await req.json()

  let recipients: string[] = []

  if (userIds && userIds.length > 0) {
    recipients = userIds
    for (const userId of userIds) {
      await prisma.user.update({ where: { id: userId }, data: { points: { increment: poin } } })
      await prisma.notification.create({
        data: {
          userId,
          title: "Bonus Poin!",
          message: `Anda mendapatkan ${poin} poin dari bonus "${name}".`,
        },
      })
    }
  } else if (kuota > 0) {
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE", role: "USER" },
      take: kuota,
      orderBy: { totalSpent: "desc" },
    })
    recipients = users.map(u => u.id)
    for (const user of users) {
      await prisma.user.update({ where: { id: user.id }, data: { points: { increment: poin } } })
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Bonus Poin!",
          message: `Anda mendapatkan ${poin} poin dari bonus "${name}".`,
        },
      })
    }
  }

  // Simpan riwayat
  await prisma.pointHistory.create({
    data: {
      adminId: session.user.id,
      name,
      poin,
      userCount: recipients.length || kuota || 1,
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const all = searchParams.get("all")

  if (all === "true") {
    await prisma.pointHistory.deleteMany()
  } else if (id) {
    await prisma.pointHistory.delete({ where: { id } })
  } else {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}