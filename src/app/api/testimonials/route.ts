import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const reviews = await prisma.review.findMany({
    where: { isApproved: true },
    include: { user: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ reviews })
}