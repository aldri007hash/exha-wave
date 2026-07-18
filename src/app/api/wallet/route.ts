import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } })
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: session.user.id, balance: 0 } })
  }

  return NextResponse.json({ balance: wallet.balance })
}