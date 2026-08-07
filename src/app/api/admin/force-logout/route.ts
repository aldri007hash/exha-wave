import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Hanya Superadmin" }, { status: 403 })
  }

  const { adminId } = await req.json()
  if (!adminId) {
    return NextResponse.json({ error: "Admin ID diperlukan" }, { status: 400 })
  }

  // Set forceLogoutAt ke sekarang, ForceLogoutPolling akan mendeteksi ini
  await prisma.user.update({
    where: { id: adminId },
    data: { forceLogoutAt: new Date() },
  })

  // Catat log
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: `Force logout admin ${adminId}`,
      ip: "system",
      userAgent: "admin",
    },
  })

  return NextResponse.json({ success: true, message: "Admin akan logout dalam 30 detik" })
}
