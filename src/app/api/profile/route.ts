import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { points: true, phone: true, image: true, name: true, email: true, lastProfileEdit: true },
  })
  return NextResponse.json(user || {})
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Batasan 7 hari hanya untuk USER biasa
  if (user.role === "USER" && user.lastProfileEdit) {
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (new Date().getTime() - user.lastProfileEdit.getTime() < sevenDays) {
      return NextResponse.json({ error: "Anda hanya bisa mengedit profil 1x dalam 7 hari" }, { status: 400 })
    }
  }

  const { name, email, phone, image } = await req.json()

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || user.name,
      email: email || user.email,
      phone: phone !== undefined ? phone : user.phone,
      image: image !== undefined ? image : user.image,
      lastProfileEdit: user.role === "USER" ? new Date() : user.lastProfileEdit,
    },
    select: { name: true, email: true, phone: true, image: true, lastProfileEdit: true },
  })

  return NextResponse.json({ success: true, user: updatedUser })
}
