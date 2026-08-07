import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })

  if (user.bonusClaimed) {
    return NextResponse.json({ error: "Bonus sudah diklaim sebelumnya" }, { status: 400 })
  }

  // Tambah Rp5.000 ke wallet
  await prisma.wallet.upsert({
    where: { userId: session.user.id },
    update: { balance: { increment: 5000 } },
    create: { userId: session.user.id, balance: 5000 },
  })

  // Tandai sudah klaim
  await prisma.user.update({
    where: { id: session.user.id },
    data: { bonusClaimed: true },
  })

  return NextResponse.json({ success: true, message: "Bonus Rp5.000 berhasil ditambahkan ke saldo!" })
}

// GET: cek status bonus
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bonusClaimed: true },
  })

  return NextResponse.json({ bonusClaimed: user?.bonusClaimed || false })
}
