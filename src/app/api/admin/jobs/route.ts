import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || ""
  const where: any = {}
  if (status) where.status = status

  const [jobs, talents, orders] = await Promise.all([
    prisma.job.findMany({ where, include: { talent: { select: { id: true, name: true } }, admin: { select: { name: true } }, order: { select: { id: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: "TALENT", status: "ACTIVE" }, select: { id: true, name: true } }),
    prisma.order.findMany({
      where: { status: { in: ["PROGRESS"] } },
      select: {
        id: true,
        user: { select: { name: true } },
        items: { select: { quantity: true, targetLink: true, service: { select: { name: true, platform: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])
  return NextResponse.json({ jobs, talents, orders })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const body = await req.json()
  const { title, description, priority, deadline, assignedTo, orderId, gdriveLink, quantity, price, targetLink } = body
  if (!title) return NextResponse.json({ error: "Judul job wajib diisi" }, { status: 400 })

  const job = await prisma.job.create({
    data: {
      title, description: description || null, priority: priority || "MEDIUM",
      deadline: deadline ? new Date(deadline) : null, assignedTo: assignedTo || null,
      createdBy: session.user.id, orderId: orderId || null, gdriveLink: gdriveLink || null,
      targetLink: targetLink || null, quantity: quantity || null, price: price || null,
      status: assignedTo ? "IN_PROGRESS" : "DRAFT",
    },
  })
  if (assignedTo) {
    await prisma.notification.create({ data: { userId: assignedTo, title: "Job Baru", message: `Anda mendapatkan job: "${title}".` } })
  }
  return NextResponse.json({ job }, { status: 201 })
}
