import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const body = await req.json();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  if (user.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Tidak dapat mengubah super admin" }, { status: 400 });
  }

  if (body.action === "ban") {
    if (!body.reason) {
      return NextResponse.json({ error: "Alasan diperlukan" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id },
      data: {
        status: "BANNED",
        banReason: body.reason,
      },
    });
    return NextResponse.json({ success: true, message: "Admin berhasil dinonaktifkan. Admin tersebut akan otomatis logout." });
  } else if (body.action === "reset-password") {
    if (!body.password) {
      return NextResponse.json({ error: "Password baru diperlukan" }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(body.password, 10);
    // Update password + set passwordChangedAt = now → force logout
    await prisma.user.update({
      where: { id },
      data: { 
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, message: "Password berhasil direset. Admin tersebut akan otomatis logout dan harus login dengan password baru." });
  }

  return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Tidak dapat menghapus super admin" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
