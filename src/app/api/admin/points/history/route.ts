import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Ambil notifikasi bonus poin untuk merangkum riwayat
  const notifications = await prisma.notification.findMany({
    where: { title: "Bonus Poin!" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  })

  // Kelompokkan manual
  const historyMap = new Map<string, any>()
  for (const notif of notifications) {
    // Ekstrak nama bonus dari pesan
    const match = notif.message.match(/bonus "(.*)"/)
    const bonusName = match ? match[1] : "Unknown"
    const poinMatch = notif.message.match(/mendapatkan (\d+) poin/)
    const poin = poinMatch ? parseInt(poinMatch[1]) : 0
    const key = `${bonusName}-${notif.createdAt.toDateString()}`
    if (!historyMap.has(key)) {
      historyMap.set(key, {
        name: bonusName,
        poin,
        userCount: 1,
        createdAt: notif.createdAt,
      })
    } else {
      historyMap.get(key).userCount++
    }
  }

  const history = Array.from(historyMap.values())
  return NextResponse.json({ history })
}