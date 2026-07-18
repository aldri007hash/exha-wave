import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      banReason: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(admins);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newAdmin = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      username: email.split("@")[0],
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  return NextResponse.json({ id: newAdmin.id, email: newAdmin.email }, { status: 201 });
}