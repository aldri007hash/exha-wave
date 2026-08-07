import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "5")

  const [platforms, total] = await Promise.all([
    prisma.platform.findMany({
      include: { services: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.platform.count(),
  ])

  return NextResponse.json({
    platforms,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  if (body.type === "platform") {
    const platform = await prisma.platform.create({
      data: { name: body.name, slug: body.name.toLowerCase().replace(/\s/g, "-") },
    })
    return NextResponse.json({ platform })
  }
  if (body.type === "service") {
    const service = await prisma.service.create({
      data: {
        platformId: body.platformId,
        name: body.name,
        slug: body.name.toLowerCase().replace(/\s/g, "-"),
        minOrder: body.minOrder,
        pricePerUnit: body.pricePerUnit,
        bundlePrice: body.bundlePrice || null,
        type: body.serviceType || "SINGLE",
        bundleItems: body.bundleItems || null,
        hasGaransi: body.hasGaransi || false,
        badge: body.badge || null,
        isActive: body.isActive,
      },
    })
    return NextResponse.json({ service })
  }
  return NextResponse.json({ error: "Invalid type" }, { status: 400 })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, platformId, serviceType, ...rest } = body

  const data: any = { ...rest }
  if (serviceType) data.type = serviceType
  delete data.id

  if (data.bundleItems !== undefined) {
    if (typeof data.bundleItems === "string") {
      try { data.bundleItems = JSON.parse(data.bundleItems) } catch {}
    }
  }

  await prisma.service.update({ where: { id }, data })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const type = searchParams.get("type")

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  try {
    if (type === "platform") {
      // Cek apakah platform ada
      const platform = await prisma.platform.findUnique({ where: { id } })
      if (!platform) {
        return NextResponse.json({ success: true, message: "Platform sudah tidak ada" })
      }
      const services = await prisma.service.findMany({ where: { platformId: id } })
      const serviceIds = services.map(s => s.id)
      if (serviceIds.length > 0) {
        await prisma.orderItem.deleteMany({ where: { serviceId: { in: serviceIds } } })
      }
      await prisma.service.deleteMany({ where: { platformId: id } })
      await prisma.platform.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    // Cek apakah layanan ada
    const service = await prisma.service.findUnique({ where: { id } })
    if (!service) {
      return NextResponse.json({ success: true, message: "Layanan sudah tidak ada" })
    }

    await prisma.orderItem.deleteMany({ where: { serviceId: id } })
    await prisma.service.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting service/platform:", error)
    return NextResponse.json({ error: "Gagal menghapus. Silakan coba lagi." }, { status: 500 })
  }
}
