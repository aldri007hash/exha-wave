import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "TALENT")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  // Ambil semua klaim COMPLETED milik talent ini
  const claims = await prisma.jobClaim.findMany({
    where: { userId: session.user.id, status: "COMPLETED" },
    include: { job: { select: { price: true, title: true } } },
  })

  // Hitung total penghasilan
  const earnings = claims.map(c => ({
    jobTitle: c.job.title,
    quantity: c.quantity,
    pricePerUnit: c.job.price || 0,
    total: c.quantity * (c.job.price || 0),
    completedAt: c.updatedAt,
  }))

  const totalEarnings = earnings.reduce((sum, e) => sum + e.total, 0)
  const totalUnits = claims.reduce((sum, c) => sum + c.quantity, 0)

  return NextResponse.json({
    totalEarnings,
    totalUnits,
    completedJobs: claims.length,
    details: earnings,
  })
}
