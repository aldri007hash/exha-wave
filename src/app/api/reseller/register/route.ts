import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { name, email, businessName, notes } = await req.json()
    
    if (!name || !email) {
      return NextResponse.json({ error: "Nama dan email wajib diisi" }, { status: 400 })
    }

    // Cek apakah email sudah pernah mendaftar
    const existing = await prisma.resellerRequest.findFirst({
      where: { email, status: "PENDING" },
    })
    if (existing) {
      return NextResponse.json({ error: "Anda sudah mengajukan permintaan. Tunggu persetujuan admin." }, { status: 400 })
    }

    await prisma.resellerRequest.create({
      data: {
        name,
        email,
        businessName: businessName || null,
        notes: notes || null,
        status: "PENDING",
      },
    })

    return NextResponse.json({ success: true, message: "Permintaan berhasil dikirim" }, { status: 201 })
  } catch (err) {
    console.error("Reseller register error:", err)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
