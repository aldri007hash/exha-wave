import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const topups = await prisma.topupTransaction.findMany({
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ topups })
}