import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const refunds = await prisma.refund.findMany({
    include: {
      order: {
        select: {
          id: true,
          status: true,
          totalPrice: true,
        },
      },
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ refunds })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { refundId, action, adminNote } = await req.json()

  if (!refundId || !action) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
  }

  const refund = await prisma.refund.findUnique({ where: { id: refundId } })
  if (!refund || refund.status !== "PENDING") {
    return NextResponse.json({ error: "Refund tidak ditemukan atau sudah diproses" }, { status: 404 })
  }

  if (action === "approve") {
    // Update refund
    await prisma.refund.update({
      where: { id: refundId },
      data: { status: "APPROVED", adminNote: adminNote || null },
    })

    // Tambah saldo ke wallet user
    await prisma.wallet.upsert({
      where: { userId: refund.userId },
      update: { balance: { increment: refund.amount } },
      create: { userId: refund.userId, balance: refund.amount },
    })

    // Notifikasi ke user
    await prisma.notification.create({
      data: {
        userId: refund.userId,
        title: "Refund Disetujui",
        message: `Pengajuan refund Anda sebesar Rp${refund.amount.toLocaleString()} telah disetujui. Saldo telah ditambahkan ke wallet Anda.`,
      },
    })
  } else if (action === "reject") {
    await prisma.refund.update({
      where: { id: refundId },
      data: { status: "REJECTED", adminNote: adminNote || null },
    })

    await prisma.notification.create({
      data: {
        userId: refund.userId,
        title: "Refund Ditolak",
        message: `Pengajuan refund Anda ditolak. Alasan: ${adminNote || "Tidak ada alasan"}`,
      },
    })
  } else {
    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
