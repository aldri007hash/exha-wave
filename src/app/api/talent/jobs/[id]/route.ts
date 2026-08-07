import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "TALENT" && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      quantity: true,
      price: true,
      targetLink: true,
      gdriveLink: true,
      createdAt: true,
      completedAt: true,
      admin: { select: { name: true } },
      order: { select: { id: true } },
      claims: {
        where: { status: { notIn: ["CANCELLED", "REJECTED"] } },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 })

  const totalClaimed = job.claims.reduce((sum, c) => sum + c.quantity, 0)
  const remaining = (job.quantity || 0) - totalClaimed

  return NextResponse.json({ job: { ...job, remaining, totalClaimed } })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "TALENT" && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const body = await req.json()
  const { action, submitNote, quantity, name, note } = body

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      claims: {
        where: { status: { notIn: ["CANCELLED", "REJECTED"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 })

  const totalClaimed = job.claims.reduce((sum, c) => sum + c.quantity, 0)
  const remaining = (job.quantity || 0) - totalClaimed

  if (action === "submit") {
    const myClaim = job.claims.find(c => c.userId === session.user.id && c.status === "CLAIMED")
    if (!myClaim) return NextResponse.json({ error: "Anda tidak memiliki klaim aktif" }, { status: 403 })
    await prisma.jobClaim.update({ where: { id: myClaim.id }, data: { status: "SUBMITTED", note: submitNote || myClaim.note } })
    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } })
    for (const admin of admins) {
      await prisma.notification.create({ data: { userId: admin.id, title: "Klaim Disubmit", message: `${session.user.name} menyelesaikan ${myClaim.quantity} unit job "${job.title}".` } })
    }
    return NextResponse.json({ success: true })
  }

  if (action === "claim") {
    if (job.status !== "DRAFT" && job.status !== "IN_PROGRESS") return NextResponse.json({ error: "Job tidak bisa diklaim" }, { status: 400 })
    if (!quantity || quantity < 1) return NextResponse.json({ error: "Jumlah unit minimal 1" }, { status: 400 })
    if (quantity > remaining) return NextResponse.json({ error: `Jumlah melebihi sisa kuota (${remaining} unit tersisa)` }, { status: 400 })
    const claim = await prisma.jobClaim.create({
      data: { jobId: params.id, userId: session.user.id, name: name || session.user.name || "Talent", quantity, note: note || null, status: "CLAIMED" },
      include: { user: { select: { name: true } } },
    })
    if (job.status === "DRAFT") { await prisma.job.update({ where: { id: params.id }, data: { status: "IN_PROGRESS" } }) }
    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } })
    for (const admin of admins) { await prisma.notification.create({ data: { userId: admin.id, title: "Job Diklaim", message: `${session.user.name} mengklaim ${quantity} unit job "${job.title}".` } }) }
    return NextResponse.json({ claim, remaining: remaining - quantity }, { status: 201 })
  }

  if (action === "add_units") {
    const myClaim = job.claims.find(c => c.userId === session.user.id && c.status === "CLAIMED")
    if (!myClaim) return NextResponse.json({ error: "Anda tidak memiliki klaim aktif" }, { status: 403 })
    if (!quantity || quantity < 1) return NextResponse.json({ error: "Jumlah unit minimal 1" }, { status: 400 })
    if (quantity > remaining) return NextResponse.json({ error: `Jumlah melebihi sisa kuota (${remaining} unit tersisa)` }, { status: 400 })
    await prisma.jobClaim.update({ where: { id: myClaim.id }, data: { quantity: { increment: quantity } } })
    return NextResponse.json({ success: true, remaining: remaining - quantity })
  }

  if (action === "cancel_claim") {
    const myClaim = job.claims.find(c => c.userId === session.user.id && c.status === "CLAIMED")
    if (!myClaim) return NextResponse.json({ error: "Klaim tidak ditemukan" }, { status: 404 })

    const elapsed = (Date.now() - new Date(myClaim.createdAt).getTime()) / 1000
    if (elapsed < 300)
      return NextResponse.json({ error: "Anda hanya bisa membatalkan klaim setelah 5 menit" }, { status: 400 })

    await prisma.jobClaim.update({
      where: { id: myClaim.id },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json({ success: true, message: "Klaim dibatalkan", returnedQuantity: myClaim.quantity })
  }

  return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 })
}
