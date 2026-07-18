import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "9")
  const platform = searchParams.get("platform") || ""
  const search = searchParams.get("search") || ""

  const where: any = {}
  if (platform) {
    where.slug = platform
  }
  if (search) {
    // Cari di nama platform atau nama service
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { services: { some: { name: { contains: search, mode: "insensitive" } } } },
    ]
  }

  const [platforms, total] = await Promise.all([
    prisma.platform.findMany({
      where,
      include: {
        services: {
          where: { isActive: true },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.platform.count({ where }),
  ])

  return NextResponse.json({
    platforms,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}