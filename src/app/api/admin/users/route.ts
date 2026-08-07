import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

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
  const role = searchParams.get("role") || ""

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }
  if (tier) where.tier = tier
  if (status) where.status = status
  if (role) where.role = role

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, role: true,
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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { name, email, password, role } = await req.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nama, email, dan password wajib diisi" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      username: email.split("@")[0] + Math.random().toString(36).substring(2, 5),
      password: hashedPassword,
      role: role || "USER",
      status: "ACTIVE",
    },
  })

  return NextResponse.json({ user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } }, { status: 201 })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { userId, action, reason, months, role } = await req.json()

  let actionDescription = ""

  if (action === "ban") {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "BANNED", banReason: reason, suspendUntil: null },
    })
    actionDescription = `Ban user ${userId}`
  } else if (action === "suspend") {
    const suspendUntil = new Date()
    suspendUntil.setMonth(suspendUntil.getMonth() + (months || 1))
    await prisma.user.update({
      where: { id: userId },
      data: { status: "SUSPENDED", banReason: reason, suspendUntil },
    })
    actionDescription = `Suspend user ${userId} selama ${months || 1} bulan`
  } else if (action === "unban" || action === "unsuspend") {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE", banReason: null, suspendUntil: null },
    })
    actionDescription = `Aktifkan kembali user ${userId}`
  } else if (action === "change_role") {
    if (!["USER", "TALENT"].includes(role)) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 })
    }
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Tidak dapat mengubah role Super Admin" }, { status: 400 })
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        passwordChangedAt: new Date(), // force logout
      },
    })
    actionDescription = `Mengubah role user ${userId} menjadi ${role}`
  } else if (action === "delete") {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Tidak dapat menghapus Super Admin" }, { status: 400 })
    }
    await prisma.job.updateMany({ where: { assignedTo: userId }, data: { assignedTo: null } })
    await prisma.job.deleteMany({ where: { createdBy: userId } })
    await prisma.notification.deleteMany({ where: { userId } })
    await prisma.activityLog.deleteMany({ where: { userId } })
    await prisma.chatMessage.deleteMany({ where: { userId } })
    await prisma.chatRoom.deleteMany({ where: { userId } })
    await prisma.orderItem.deleteMany({ where: { order: { userId } } })
    await prisma.order.deleteMany({ where: { userId } })
    await prisma.refund.deleteMany({ where: { userId } })
    await prisma.review.deleteMany({ where: { userId } })
    await prisma.wallet.deleteMany({ where: { userId } })
    await prisma.topupTransaction.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json({ success: true, message: "User berhasil dihapus" })
  }

  if (action !== "change_role" && action !== "delete") {
    await prisma.notification.create({
      data: {
        userId,
        title: "Status Akun Diperbarui",
        message: reason
          ? `Akun Anda telah ${action === "ban" ? "diblokir" : action === "suspend" ? "ditangguhkan" : "diaktifkan kembali"}. Alasan: ${reason}`
          : `Status akun Anda telah diperbarui menjadi ${action === "unban" || action === "unsuspend" ? "ACTIVE" : action}.`,
      },
    })
  } else if (action === "change_role") {
    await prisma.notification.create({
      data: {
        userId,
        title: "Role Akun Diperbarui",
        message: `Role akun Anda telah diubah menjadi ${role === "TALENT" ? "Talent" : "User"}. Silakan login ulang.`,
      },
    })
  }

  if (action !== "delete") {
    try {
      await prisma.activityLog.create({
        data: { userId: session.user.id, action: actionDescription, ip: "system", userAgent: "admin" },
      })
    } catch (err) { console.error("Gagal catat activity log:", err) }
  }

  return NextResponse.json({ success: true, message: actionDescription || "User dihapus" })
}
