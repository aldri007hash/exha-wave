import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, key: true, isActive: true, createdAt: true },
  })

  return NextResponse.json({ keys })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: "Nama diperlukan" }, { status: 400 })

  const key = "exha_" + crypto.randomBytes(24).toString("hex")

  const apiKey = await prisma.apiKey.create({
    data: { name, key, userId: session.user.id },
  })

  return NextResponse.json({ apiKey }, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })

  await prisma.apiKey.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
