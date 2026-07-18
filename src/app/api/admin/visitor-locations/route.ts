import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const locations = await prisma.visitorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      ip: true,
      latitude: true,
      longitude: true,
      browser: true,
      device: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ locations })
}