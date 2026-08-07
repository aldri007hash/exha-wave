import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { rating, comment } = await req.json()
  if (!rating) {
    return NextResponse.json({ error: "Rating wajib diisi" }, { status: 400 })
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { review: true, items: { include: { service: true } } },
    })
    if (!order || order.userId !== session.user.id) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
    }
    if (order.status !== "COMPLETED") {
      return NextResponse.json({ error: "Hanya bisa review order yang sudah selesai" }, { status: 400 })
    }
    if (order.review) {
      return NextResponse.json({ error: "Anda sudah memberikan ulasan untuk pesanan ini" }, { status: 400 })
    }

    const serviceName = order.items.map(item => item.service.name).join(", ")

    await prisma.review.create({
      data: {
        orderId: params.id,
        userId: session.user.id,
        rating,
        comment: comment || null,
        serviceName: serviceName,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error creating review:", error.message)
    return NextResponse.json({ error: "Gagal membuat ulasan" }, { status: 500 })
  }
}
