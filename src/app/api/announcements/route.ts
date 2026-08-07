import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const latest = await prisma.announcement.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ announcement: latest })
}
