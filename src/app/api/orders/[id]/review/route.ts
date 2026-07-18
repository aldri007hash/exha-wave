import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const review = await prisma.review.findUnique({
    where: { orderId: params.id },
  })

  return NextResponse.json({ review })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { rating, comment } = await req.json()
  if (!rating || !comment) {
    return NextResponse.json({ error: "Rating dan ulasan wajib diisi" }, { status: 400 })
  }

  // Pastikan order milik user
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { review: true },
  })
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
  }
  if (order.status !== "COMPLETED") {
    return NextResponse.json({ error: "Hanya bisa review order yang sudah selesai" }, { status: 400 })
  }
  if (order.review) {
    return NextResponse.json({ error: "Ulasan sudah diberikan" }, { status: 400 })
  }

  const review = await prisma.review.create({
    data: {
      orderId: params.id,
      userId: session.user.id,
      rating,
      comment,
    },
  })

  return NextResponse.json({ review })
}