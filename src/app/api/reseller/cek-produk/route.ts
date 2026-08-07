import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const apiKey = req.headers.get("x-api-key")
  if (!apiKey) {
    return NextResponse.json({ error: "API Key diperlukan" }, { status: 401 })
  }

  // Validasi API Key
  const keyRecord = await prisma.apiKey.findUnique({ where: { key: apiKey } })
  if (!keyRecord || !keyRecord.isActive) {
    return NextResponse.json({ error: "API Key tidak valid atau dinonaktifkan" }, { status: 401 })
  }

  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: { platform: { select: { name: true, slug: true } } },
    orderBy: { name: "asc" },
  })

  const result = services.map(s => ({
    id: s.id,
    name: s.name,
    platform: s.platform.name,
    platformSlug: s.platform.slug,
    minOrder: s.minOrder,
    pricePerUnit: s.pricePerUnit,
    type: s.type,
    bundlePrice: s.bundlePrice,
    hasGaransi: s.hasGaransi,
  }))

  return NextResponse.json({ success: true, data: result })
}
