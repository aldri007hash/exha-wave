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
  const limit = parseInt(searchParams.get("limit") || "10")

  const [promos, total] = await Promise.all([
    prisma.promo.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.promo.count(),
  ])

  return NextResponse.json({
    promos,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, description, bannerUrl, promoType, discount, minAmount, jamMulai, jamSelesai, startDate, endDate, isActive } = await req.json()
  if (!title || discount === undefined || !startDate || !endDate) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
  }

  const jamMulaiInt = jamMulai === "" ? null : Number(jamMulai)
  const jamSelesaiInt = jamSelesai === "" ? null : Number(jamSelesai)

  const promo = await prisma.promo.create({
    data: {
      title,
      description,
      bannerUrl,
      promoType: promoType || "DISKON_TANGGAL",
      discount,
      minAmount: minAmount || 0,
      jamMulai: jamMulaiInt,
      jamSelesai: jamSelesaiInt,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive,
    },
  })

  return NextResponse.json({ promo }, { status: 201 })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, ...data } = await req.json()
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })

  if (data.startDate) data.startDate = new Date(data.startDate)
  if (data.endDate) data.endDate = new Date(data.endDate)
  if (data.jamMulai !== undefined) data.jamMulai = data.jamMulai === "" ? null : Number(data.jamMulai)
  if (data.jamSelesai !== undefined) data.jamSelesai = data.jamSelesai === "" ? null : Number(data.jamSelesai)

  await prisma.promo.update({ where: { id }, data })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })

  await prisma.promo.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
