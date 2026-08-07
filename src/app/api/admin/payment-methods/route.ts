import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const methods = await prisma.paymentMethod.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(methods);
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  try {
    const method = await prisma.paymentMethod.create({
      data: {
        name: body.name,
        type: body.type,
        accountNumber: body.accountNumber,
        accountName: body.accountName,
        instructions: body.instructions,
        qrisImage: body.qrisImage,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(method, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  try {
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    }
    await prisma.paymentMethod.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        instructions: data.instructions,
        qrisImage: data.qrisImage,
        isActive: data.isActive,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengupdate metode pembayaran" }, { status: 500 });
  }
}
