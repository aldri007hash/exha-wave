// src/app/api/profile/check-edit/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ canEdit: false })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ canEdit: false })
  if (user.role === "ADMIN") return NextResponse.json({ canEdit: true })

  if (!user.lastProfileEdit) return NextResponse.json({ canEdit: true })

  const sevenDays = 7 * 24 * 60 * 60 * 1000
  const canEdit = new Date().getTime() - user.lastProfileEdit.getTime() >= sevenDays
  return NextResponse.json({ canEdit })
}