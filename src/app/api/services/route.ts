import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "12")
  const platformSlug = searchParams.get("platform") || ""
  const search = searchParams.get("search") || ""

  if (platformSlug) {
    const platform = await prisma.platform.findUnique({
      where: { slug: platformSlug },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        },
        _count: { select: { services: { where: { isActive: true } } } },
      },
    })

    if (!platform) {
      return NextResponse.json({ platforms: [], pagination: { page, limit, total: 0, totalPages: 0 } })
    }

    const total = platform._count.services
    return NextResponse.json({
      platforms: [platform],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  }

  const wherePlatform: any = {}
  if (search) {
    wherePlatform.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { services: { some: { name: { contains: search, mode: "insensitive" }, isActive: true } } },
    ]
  }

  const platforms = await prisma.platform.findMany({
    where: wherePlatform,
    include: {
      services: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  })

  const totalServices = platforms.reduce((sum, p) => sum + p.services.length, 0)
  return NextResponse.json({
    platforms,
    pagination: { page: 1, limit: totalServices, total: totalServices, totalPages: 1 },
  })
}
