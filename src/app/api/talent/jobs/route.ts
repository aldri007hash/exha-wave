import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "TALENT" && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || ""

  // Cari job yang memiliki klaim dari talent ini
  const claims = await prisma.jobClaim.findMany({
    where: { userId: session.user.id },
    select: { jobId: true, status: true },
  })

  const jobIds = claims.map(c => c.jobId)

  const where: any = { id: { in: jobIds } }
  if (status) where.status = status

  const jobs = await prisma.job.findMany({
    where,
    include: {
      admin: { select: { name: true } },
      order: { select: { id: true } },
      claims: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ jobs })
}
