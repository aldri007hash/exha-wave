import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const users = await prisma.user.findMany({
    select: { name: true, email: true, phone: true, tier: true, points: true, status: true },
    orderBy: { createdAt: "desc" },
  })

  const csv = ["Nama,Email,Telepon,Tier,Poin,Status"]
  users.forEach(u => {
    csv.push(`${u.name},${u.email},${u.phone || "-"},${u.tier},${u.points},${u.status}`)
  })

  return new NextResponse(csv.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=users.csv",
    },
  })
}
