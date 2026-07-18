import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const pointsLeaderboard = await prisma.user.findMany({
    orderBy: { points: "desc" },
    take: 10,
    select: { id: true, name: true, points: true },
  })

  const spentLeaderboard = await prisma.user.findMany({
    orderBy: { totalSpent: "desc" },
    take: 10,
    select: { id: true, name: true, totalSpent: true },
  })

  return NextResponse.json({ pointsLeaderboard, spentLeaderboard })
}