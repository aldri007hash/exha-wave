import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cart = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: "PENDING_PAYMENT",
      paymentMethod: null, // hanya keranjang asli
    },
    include: {
      items: {
        include: { service: { include: { platform: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ cart });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { serviceId, targetLink, profileName, quantity } = await req.json();
  if (!serviceId || !targetLink || !quantity) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) {
    return NextResponse.json({ error: "Layanan tidak tersedia" }, { status: 404 });
  }

  const unitPrice = service.pricePerUnit / service.minOrder;
  const totalPrice = quantity * unitPrice;

  let cart = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: "PENDING_PAYMENT",
      paymentMethod: null,
    },
  });

  if (!cart) {
    cart = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING_PAYMENT",
        totalPrice: 0,
      },
    });
  }

  await prisma.orderItem.create({
    data: {
      orderId: cart.id,
      serviceId,
      targetLink,
      profileName: profileName || "",
      quantity,
      price: totalPrice,
    },
  });

  const items = await prisma.orderItem.findMany({ where: { orderId: cart.id } });
  const newTotal = items.reduce((sum, item) => sum + item.price, 0);
  await prisma.order.update({ where: { id: cart.id }, data: { totalPrice: newTotal } });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "Item ID diperlukan" }, { status: 400 });

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: true },
  });
  if (!item || item.order.userId !== session.user.id) {
    return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
  }

  await prisma.orderItem.delete({ where: { id: itemId } });

  const items = await prisma.orderItem.findMany({ where: { orderId: item.orderId } });
  const newTotal = items.reduce((sum, i) => sum + i.price, 0);
  await prisma.order.update({ where: { id: item.orderId }, data: { totalPrice: newTotal } });

  return NextResponse.json({ success: true });
}