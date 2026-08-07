import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import jsPDF from "jspdf"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })

  const transaction = await prisma.topupTransaction.findUnique({ where: { id } })
  if (!transaction || transaction.userId !== session.user.id) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 })
  }

  try {
    const doc = new jsPDF()
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(16)
    doc.text("Bukti Topup Exha Wave", 105, 20, { align: "center" })
    
    doc.setFont("Helvetica", "normal")
    doc.setFontSize(11)
    doc.text(`ID Transaksi: ${transaction.id}`, 20, 40)
    doc.text(`Tanggal: ${new Date(transaction.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, 20, 48)
    doc.text(`Metode: ${transaction.paymentMethod}`, 20, 56)
    doc.text(`Status: ${transaction.status}`, 20, 64)
    
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(14)
    doc.text(`Nominal: Rp ${transaction.amount.toLocaleString("id-ID")}`, 105, 80, { align: "center" })
    
    doc.setFont("Helvetica", "normal")
    doc.setFontSize(10)
    doc.text("Terima kasih telah menggunakan Exha Wave.", 105, 95, { align: "center" })

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
    
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bukti-topup-${transaction.id}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Error generating PDF:", error.message || error)
    return NextResponse.json({ error: "Gagal membuat PDF: " + (error.message || "error") }, { status: 500 })
  }
}
