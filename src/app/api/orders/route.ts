import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { items, paymentMethod, usePoints } = await req.json()

  let calculatedTotal = 0
  const validatedItems: any[] = []

  for (const item of items) {
    const service = await prisma.service.findUnique({ where: { id: item.serviceId } })
    if (!service || !service.isActive) return NextResponse.json({ error: `Layanan tidak tersedia` }, { status: 400 })
    if (item.quantity < service.minOrder) return NextResponse.json({ error: `Minimal order ${service.minOrder}` }, { status: 400 })

    const price = Math.round((item.quantity / service.minOrder) * service.pricePerUnit)
    calculatedTotal += price

    validatedItems.push({
      serviceId: service.id,
      targetLink: item.targetLink,
      profileName: item.profileName,
      quantity: item.quantity,
      price,
    })
  }

  // Hapus keranjang lama
  const existingCart = await prisma.order.findFirst({
    where: { userId: session.user.id, status: "PENDING_PAYMENT" },
  })
  if (existingCart) {
    await prisma.orderItem.deleteMany({ where: { orderId: existingCart.id } })
    await prisma.order.delete({ where: { id: existingCart.id } })
  }

  // Proses Exha Points
  let discount = 0
  if (usePoints) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user && user.points > 0) {
      const pointsValue = Math.floor(user.points / 10)
      discount = Math.min(pointsValue, calculatedTotal)
      calculatedTotal = Math.max(0, calculatedTotal - discount)

      // Kurangi poin user
      await prisma.user.update({
        where: { id: session.user.id },
        data: { points: 0 },
      })

      // Catat histori penggunaan poin
      await prisma.pointHistory.create({
        data: {
          adminId: session.user.id, // user sebagai admin untuk histori
          userId: session.user.id,
          name: "Penggunaan Poin untuk Pembayaran",
          poin: -user.points,
          userCount: 1,
        },
      })
    }
  }

  // Jika pakai Saldo Exha
  if (paymentMethod === "wallet") {
    const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } })
    if (!wallet || wallet.balance < calculatedTotal) {
      return NextResponse.json({ error: "Saldo Exha tidak mencukupi" }, { status: 400 })
    }

    await prisma.wallet.update({
      where: { userId: session.user.id },
      data: { balance: { decrement: calculatedTotal } },
    })

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PROCESSING",
        totalPrice: calculatedTotal,
        paymentMethod: "wallet",
        items: { create: validatedItems },
      },
    })

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Pesanan Dibayar dengan Saldo",
        message: `Pesanan #${order.id.slice(-6)} telah dibayar menggunakan Saldo Exha. Total: Rp${calculatedTotal.toLocaleString()}`,
      },
    })

    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "Pesanan Baru",
          message: `Pesanan baru #${order.id.slice(-6)} dari ${session.user.name} (${session.user.email}).`,
        },
      })
    }

    return NextResponse.json({ order, instruction: { instructions: "Pembayaran berhasil menggunakan Saldo Exha." } })
  }

  // Buat order biasa
  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "PENDING_PAYMENT",
      totalPrice: calculatedTotal,
      paymentMethod,
      items: { create: validatedItems },
    },
  })

  const method = await prisma.paymentMethod.findUnique({ where: { id: paymentMethod } })
  const instruction = method ? { instructions: method.instructions } : { instructions: "Silakan transfer ke rekening yang tertera." }

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "Pesanan Baru",
      message: `Pesanan #${order.id.slice(-6)} berhasil dibuat. Total: Rp${calculatedTotal.toLocaleString()}. Silakan lakukan pembayaran.`,
    },
  })

  const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } })
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: "Pesanan Baru",
        message: `Pesanan baru #${order.id.slice(-6)} dari ${session.user.name} (${session.user.email}).`,
      },
    })
  }

  return NextResponse.json({ order, instruction })
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { service: true } }, review: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ orders })
}