import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { transporter } from "@/lib/nodemailer"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const requests = await prisma.resellerRequest.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({ requests })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, action, reason } = await req.json()
  if (!id || !action) return NextResponse.json({ error: "ID dan action diperlukan" }, { status: 400 })
  const request = await prisma.resellerRequest.findUnique({ where: { id } })
  if (!request) return NextResponse.json({ error: "Request tidak ditemukan" }, { status: 404 })

  if (action === "approve") {
    const apiKey = await prisma.apiKey.create({ data: { name: `Reseller: ${request.name}`, key: "exha_" + crypto.randomBytes(24).toString("hex"), userId: session.user.id } })
    await prisma.resellerRequest.update({ where: { id }, data: { status: "APPROVED", apiKeyId: apiKey.id } })
    if (request.email) {
      try { await transporter.sendMail({ from: `"Exha Wave" <${process.env.EMAIL_USER}>`, to: request.email, subject: "Permintaan Reseller Disetujui - Exha Wave", html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden"><div style="background-color:#0066FF;padding:20px;text-align:center"><h1 style="color:white;margin:0">Selamat! Reseller Disetujui</h1></div><div style="padding:20px"><p>Halo, <strong>${request.name}</strong>!</p><p>Permintaan Anda telah <strong>disetujui</strong>. Berikut API Key Anda:</p><div style="background-color:#f5f5f5;padding:12px;border-radius:4px;font-family:monospace;word-break:break-all">${apiKey.key}</div><p style="margin-top:12px">Gunakan API Key ini dengan header <code>x-api-key</code> pada setiap request.</p><p>Dokumentasi: <a href="${process.env.NEXTAUTH_URL}/dokumentasi-api">${process.env.NEXTAUTH_URL}/dokumentasi-api</a></p><a href="${process.env.NEXTAUTH_URL}/reseller-dashboard" style="display:inline-block;background-color:#0066FF;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;margin-top:12px">Buka Dashboard Reseller</a></div></div>` }) } catch (err) { console.error("Gagal kirim email reseller:", err) }
    }
    return NextResponse.json({ success: true, apiKey: apiKey.key })
  }
  if (action === "reject") {
    await prisma.resellerRequest.update({ where: { id }, data: { status: "REJECTED", notes: reason } })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: "Action tidak valid" }, { status: 400 })
}
