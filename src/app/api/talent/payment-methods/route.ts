import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "TALENT") return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  const methods = await prisma.talentPaymentMethod.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } })
  return NextResponse.json({ methods })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "TALENT") return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  const { accountName, bankName, accountNumber, note } = await req.json()
  if (!accountName || !bankName || !accountNumber) return NextResponse.json({ error: "Data wajib diisi" }, { status: 400 })
  const method = await prisma.talentPaymentMethod.create({
    data: { userId: session.user.id, accountName, bankName, accountNumber, note: note || null },
  })
  return NextResponse.json({ method }, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "TALENT") return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  const { searchParams } = new URL(req.url); const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })
  await prisma.talentPaymentMethod.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ success: true })
}
