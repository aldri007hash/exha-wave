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
  const { id, ...data } = body
  await prisma.service.update({ where: { id }, data })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const type = searchParams.get("type") // "platform" atau "service"

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  try {
    if (type === "platform") {
      // Dapatkan semua service dalam platform ini
      const services = await prisma.service.findMany({ where: { platformId: id } })
      const serviceIds = services.map(s => s.id)

      // Hapus semua OrderItem yang terkait dengan service-service tersebut
      if (serviceIds.length > 0) {
        await prisma.orderItem.deleteMany({
          where: { serviceId: { in: serviceIds } }
        })
      }

      // Hapus semua service dalam platform
      await prisma.service.deleteMany({ where: { platformId: id } })

      // Hapus platform
      await prisma.platform.delete({ where: { id } })

      return NextResponse.json({ success: true })
    }

    // Hapus service (default)
    // Hapus dulu semua OrderItem yang terkait
    await prisma.orderItem.deleteMany({
      where: { serviceId: id }
    })

    // Hapus service
    await prisma.service.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting service/platform:", error)
    return NextResponse.json({ error: "Gagal menghapus. Data mungkin masih digunakan." }, { status: 500 })
  }
}