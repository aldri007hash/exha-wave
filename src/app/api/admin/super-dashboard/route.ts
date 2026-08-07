import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Hanya Superadmin yang bisa mengakses" }, { status: 403 })
  }

  // Ambil semua admin (ADMIN dan SUPER_ADMIN)
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })

  // Statistik per admin: jumlah order diproses, user di-suspend/diban, chat di-handle
  const adminStats = await Promise.all(
    admins.map(async (admin) => {
      // Jumlah aksi ubah status order (dari ActivityLog)
      const orderActions = await prisma.activityLog.count({
        where: {
          userId: admin.id,
          action: { contains: "Mengubah status order" },
        },
      })

      // Jumlah user yang di-suspend/ban
      const userActions = await prisma.activityLog.count({
        where: {
          userId: admin.id,
          OR: [
            { action: { contains: "Ban user" } },
            { action: { contains: "Suspend user" } },
            { action: { contains: "Aktifkan kembali user" } },
          ],
        },
      })

      // Jumlah chat room yang di-handle
      const chatHandled = await prisma.chatRoom.count({
        where: { adminId: admin.id },
      })

      // Jumlah chat yang masih baru (belum di-handle oleh admin manapun)
      const chatUnhandled = await prisma.chatRoom.count({
        where: { adminId: null },
      })

      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
        orderActions,
        userActions,
        chatHandled,
        chatUnhandled,
      }
    })
  )

  // Log aktivitas terbaru (50)
  const recentActivities = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  })

  // Ringkasan total
  const totalOrders = await prisma.order.count()
  const totalUsers = await prisma.user.count({ where: { role: "USER" } })
  const totalRevenue = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    where: { status: "COMPLETED" },
  })
  const pendingChats = await prisma.chatRoom.count({ where: { adminId: null } })

  return NextResponse.json({
    admins: adminStats,
    recentActivities: recentActivities.map((a) => ({
      id: a.id,
      adminName: a.user.name,
      adminEmail: a.user.email,
      action: a.action,
      ip: a.ip,
      userAgent: a.userAgent,
      timestamp: a.createdAt,
    })),
    summary: {
      totalAdmins: admins.length,
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      pendingChats,
    },
  })
}
