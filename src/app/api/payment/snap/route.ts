import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import midtransClient from "midtrans-client"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: "Order ID required" }, { status: 400 })

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { service: true } } },
  })

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  if (order.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Buat Snap API instance
  let snap = new midtransClient.Snap({
    isProduction: false, // ganti ke true untuk production
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.MIDTRANS_CLIENT_KEY!,
  })

  const parameter = {
    transaction_details: {
      order_id: order.id,
      gross_amount: order.totalPrice,
    },
    customer_details: {
      first_name: order.user.name,
      email: order.user.email,
      phone: order.user.phone || "",
    },
    item_details: order.items.map(item => ({
      id: item.serviceId,
      price: item.price,
      quantity: 1,
      name: item.service.name,
    })),
  }

  try {
    const transaction = await snap.createTransaction(parameter)
    return NextResponse.json({ token: transaction.token, redirect_url: transaction.redirect_url })
  } catch (error: any) {
    console.error("Midtrans error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}