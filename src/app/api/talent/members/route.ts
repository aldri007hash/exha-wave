import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "TALENT")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const members = await prisma.user.findMany({
    where: { role: "TALENT", status: "ACTIVE" },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ members })
}
