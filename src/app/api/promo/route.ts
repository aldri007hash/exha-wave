import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const now = new Date()
  
  // PERBAIKAN: Toleransi 1 jam untuk startDate (promo yang mulai 1 jam ke depan sudah muncul)
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
  
  const promos = await prisma.promo.findMany({
    where: {
      isActive: true,
      startDate: { lte: oneHourFromNow }, // Promo yang mulai dalam 1 jam ke depan sudah muncul
      endDate: { gte: now },              // HARUS >= sekarang (belum expired)
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  })
  return NextResponse.json({ promos })
}
