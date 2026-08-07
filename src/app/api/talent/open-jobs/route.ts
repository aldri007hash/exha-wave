import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "TALENT" && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  // Ambil semua job yang statusnya DRAFT atau IN_PROGRESS (open pool)
  const allJobs = await prisma.job.findMany({
    where: { status: { in: ["DRAFT", "IN_PROGRESS"] } },
    include: {
      admin: { select: { name: true } },
      claims: {
        where: { status: { in: ["CLAIMED", "COMPLETED"] } },
        select: { quantity: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Filter job yang masih memiliki sisa unit
  const openJobs = allJobs.filter(job => {
    const totalClaimed = job.claims.reduce((sum, c) => sum + c.quantity, 0)
    const remaining = (job.quantity || 0) - totalClaimed
    return remaining > 0
  })

  // Kirim tanpa field claims (untuk keamanan)
  const result = openJobs.map(({ claims, ...rest }) => rest)

  return NextResponse.json({ jobs: result })
}
