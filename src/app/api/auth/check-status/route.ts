import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ valid: true, status: "ACTIVE" })
    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { status: true, banReason: true, suspendUntil: true, passwordChangedAt: true, forceLogoutAt: true } })
    return NextResponse.json({ valid: true, status: dbUser?.status || "ACTIVE", banReason: dbUser?.banReason, suspendUntil: dbUser?.suspendUntil?.toISOString?.() || null, passwordChangedAt: dbUser?.passwordChangedAt?.toISOString?.() || null, forceLogoutAt: dbUser?.forceLogoutAt?.toISOString?.() || null })
  } catch { return NextResponse.json({ valid: true, status: "ACTIVE" }) }
}
