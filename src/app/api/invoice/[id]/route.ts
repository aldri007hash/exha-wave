import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { jsPDF } from "jspdf"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          service: { include: { platform: true } },
        },
      },
    },
  })

  if (!order || (order.userId !== session.user.id && (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
  }

  const doc = new jsPDF()
  const formattedDate = new Date(order.createdAt).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  })

  // Header
  doc.setFontSize(18)
  doc.text("EXHA WAVE", 105, 20, { align: "center" })
  doc.setFontSize(10)
  doc.text("Invoice Pesanan", 105, 27, { align: "center" })
  doc.line(15, 32, 195, 32)

  let y = 40
  doc.setFontSize(10)
  doc.text(`Order ID: ${order.id}`, 15, y)
  doc.text(`Tanggal: ${formattedDate}`, 15, y + 6)
  doc.text(`Nama: ${order.user.name}`, 15, y + 12)
  doc.text(`Email: ${order.user.email}`, 15, y + 18)
  doc.text(`Status: ${order.status}`, 15, y + 24)
  doc.text(`Metode Pembayaran: ${order.paymentMethod || "-"}`, 15, y + 30)

  y += 40
  doc.setFillColor(240, 240, 240)
  doc.rect(15, y, 180, 8, "F")
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.text("Layanan", 17, y + 6)
  doc.text("Target", 100, y + 6)
  doc.text("Jumlah", 140, y + 6)
  doc.text("Harga", 180, y + 6)

  y += 10
  for (const item of order.items) {
    doc.text(`${item.service.platform.name} - ${item.service.name}`, 17, y)
    doc.text(item.targetLink || "-", 100, y)
    doc.text(item.quantity.toString(), 140, y)
    doc.text(`Rp ${item.price.toLocaleString("id-ID")}`, 180, y)
    y += 8
  }

  y += 10
  doc.setFontSize(11)
  doc.text(`Total: Rp ${order.totalPrice.toLocaleString("id-ID")}`, 180, y, { align: "right" })

  doc.setFontSize(8)
  doc.text("Terima kasih telah menggunakan Exha Wave.", 105, 280, { align: "center" })

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${order.id.slice(-6)}.pdf"`,
    },
  })
}