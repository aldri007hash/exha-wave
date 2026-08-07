import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get("month") || "0")
  const year = parseInt(searchParams.get("year") || "0")

  // Filter berdasarkan bulan/tahun jika diisi
  let dateFilter: any = {}
  if (month > 0 && year > 0) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    dateFilter = {
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
    }
  }

  // Ambil semua talent
  const talents = await prisma.user.findMany({
    where: { role: "TALENT", status: "ACTIVE" },
    select: { id: true, name: true, email: true },
  })

  // Hitung job selesai per talent
  const leaderboard = await Promise.all(
    talents.map(async (talent) => {
      const completedJobs = await prisma.job.count({
        where: {
          assignedTo: talent.id,
          status: "COMPLETED",
          ...dateFilter,
        },
      })
      const totalJobs = await prisma.job.count({
        where: {
          assignedTo: talent.id,
          ...dateFilter,
        },
      })
      return {
        id: talent.id,
        name: talent.name,
        email: talent.email,
        completed: completedJobs,
        total: totalJobs,
      }
    })
  )

  // Urutkan dari yang paling banyak menyelesaikan
  leaderboard.sort((a, b) => b.completed - a.completed)

  return NextResponse.json({ leaderboard })
}
