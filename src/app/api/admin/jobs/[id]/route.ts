import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      talent: { select: { id: true, name: true, email: true } },
      admin: { select: { id: true, name: true } },
      order: { select: { id: true, status: true, totalPrice: true, user: { select: { name: true } } } },
      claims: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ job })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const body = await req.json()
  const { action, revisionNote, claimId, adminNote } = body

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: { claims: { where: { status: { in: ["CLAIMED", "SUBMITTED", "COMPLETED"] } } } },
  })
  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 })

  // ========== APPROVE PER KLAIM ==========
  if (action === "approve_claim") {
    if (!claimId) return NextResponse.json({ error: "Claim ID diperlukan" }, { status: 400 })
    const claim = await prisma.jobClaim.findUnique({ where: { id: claimId } })
    if (!claim || claim.jobId !== params.id) return NextResponse.json({ error: "Klaim tidak ditemukan" }, { status: 404 })
    if (claim.status !== "SUBMITTED") return NextResponse.json({ error: "Klaim belum disubmit" }, { status: 400 })

    await prisma.jobClaim.update({ where: { id: claimId }, data: { status: "COMPLETED" } })

    if (claim.userId) {
      await prisma.notification.create({
        data: { userId: claim.userId, title: "Klaim Disetujui", message: `Klaim Anda untuk ${claim.quantity} unit job "${job.title}" telah disetujui.` },
      })
    }
    return NextResponse.json({ success: true })
  }

  // ========== TOLAK PER KLAIM ==========
  if (action === "reject_claim") {
    if (!claimId) return NextResponse.json({ error: "Claim ID diperlukan" }, { status: 400 })
    if (!adminNote) return NextResponse.json({ error: "Catatan wajib diisi untuk penolakan" }, { status: 400 })

    const claim = await prisma.jobClaim.findUnique({ where: { id: claimId } })
    if (!claim || claim.jobId !== params.id) return NextResponse.json({ error: "Klaim tidak ditemukan" }, { status: 404 })
    if (claim.status !== "SUBMITTED") return NextResponse.json({ error: "Klaim belum disubmit" }, { status: 400 })

    await prisma.jobClaim.update({
      where: { id: claimId },
      data: { status: "REJECTED", adminNote, note: claim.note ? `${claim.note}\n[DITOLAK] ${adminNote}` : `[DITOLAK] ${adminNote}` },
    })

    if (claim.userId) {
      await prisma.notification.create({
        data: { userId: claim.userId, title: "Klaim Ditolak", message: `Klaim Anda untuk ${claim.quantity} unit job "${job.title}" ditolak. Catatan: ${adminNote}` },
      })
    }
    return NextResponse.json({ success: true })
  }

  // ========== BATALKAN KLAIM OLEH ADMIN (BARU) ==========
  if (action === "cancel_claim") {
    if (!claimId) return NextResponse.json({ error: "Claim ID diperlukan" }, { status: 400 })
    if (!adminNote) return NextResponse.json({ error: "Alasan wajib diisi untuk membatalkan klaim" }, { status: 400 })

    const claim = await prisma.jobClaim.findUnique({ where: { id: claimId } })
    if (!claim || claim.jobId !== params.id) return NextResponse.json({ error: "Klaim tidak ditemukan" }, { status: 404 })
    if (!["CLAIMED", "SUBMITTED"].includes(claim.status)) {
      return NextResponse.json({ error: "Klaim tidak bisa dibatalkan" }, { status: 400 })
    }

    await prisma.jobClaim.update({
      where: { id: claimId },
      data: { status: "CANCELLED", adminNote, note: claim.note ? `${claim.note}\n[DIBATALKAN ADMIN] ${adminNote}` : `[DIBATALKAN ADMIN] ${adminNote}` },
    })

    if (claim.userId) {
      await prisma.notification.create({
        data: { userId: claim.userId, title: "Klaim Dibatalkan Admin", message: `Klaim Anda untuk ${claim.quantity} unit job "${job.title}" dibatalkan oleh admin. Alasan: ${adminNote}` },
      })
    }
    return NextResponse.json({ success: true, message: "Klaim berhasil dibatalkan" })
  }

  // ========== APPROVE JOB (SEMUA KLAIM HARUS COMPLETED) ==========
  if (action === "approve") {
    const allCompleted = job.claims.every(c => c.status === "COMPLETED")
    if (!allCompleted) return NextResponse.json({ error: "Masih ada klaim yang belum selesai" }, { status: 400 })

    await prisma.job.update({ where: { id: params.id }, data: { status: "COMPLETED", completedAt: new Date() } })

    for (const claim of job.claims) {
      if (claim.userId) {
        await prisma.notification.create({
          data: { userId: claim.userId, title: "Job Selesai", message: `Job "${job.title}" telah selesai dan disetujui.` },
        })
      }
    }
    return NextResponse.json({ success: true })
  }

  // ========== REVISION ==========
  if (action === "revision") {
    if (job.status !== "SUBMITTED") return NextResponse.json({ error: "Job belum disubmit" }, { status: 400 })
    await prisma.job.update({ where: { id: params.id }, data: { status: "REVISION", revisionNote: revisionNote || null } })
    return NextResponse.json({ success: true })
  }

  // ========== CANCEL JOB ==========
  if (action === "cancel") {
    await prisma.job.update({ where: { id: params.id }, data: { status: "CANCELLED" } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await prisma.jobClaim.deleteMany({ where: { jobId: params.id } })
  await prisma.job.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
