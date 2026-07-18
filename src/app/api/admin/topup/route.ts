import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const transactions = await prisma.topupTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  return NextResponse.json({ transactions })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount, paymentMethod } = await req.json()

  // Validasi minimal & maksimal
  if (amount < 15000) return NextResponse.json({ error: "Minimal topup Rp15.000" }, { status: 400 })
  if (amount > 1000000) return NextResponse.json({ error: "Maksimal topup Rp1.000.000" }, { status: 400 })

  const transaction = await prisma.topupTransaction.create({
    data: {
      userId: session.user.id,
      amount,
      paymentMethod,
      status: "PENDING",
    },
  })

  // Notifikasi ke user
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "Topup Saldo",
      message: `Topup sebesar Rp${amount.toLocaleString()} sedang menunggu konfirmasi admin.`,
    },
  })

  // Notifikasi ke admin
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" } })
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: "Topup Baru",
        message: `User ${session.user.name} mengajukan topup Rp${amount.toLocaleString()}.`,
      },
    })
  }

  return NextResponse.json({ transaction })
}