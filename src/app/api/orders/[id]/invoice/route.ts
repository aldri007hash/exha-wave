import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import PDFDocument from "pdfkit"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          service: {
            include: { platform: true },
          },
        },
      },
    },
  })

  if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })

  // Hanya user pemilik order atau admin yang bisa mengakses
  if ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Buat PDF
  const doc = new PDFDocument({ margin: 50 })
  const buffers: Buffer[] = []
  doc.on("data", (chunk: Buffer) => buffers.push(chunk))
  doc.on("end", () => {})

  // Header
  doc.fontSize(20).font("Helvetica-Bold").text("EXHA WAVE", { align: "center" })
  doc.fontSize(10).font("Helvetica").text("Invoice Transaksi", { align: "center" })
  doc.moveDown(1)

  // Info User & Order
  doc.fontSize(10).font("Helvetica-Bold").text("Informasi Pelanggan")
  doc.font("Helvetica").text(`Nama: ${order.user.name}`)
  doc.text(`Email: ${order.user.email}`)
  doc.moveDown(0.5)

  doc.font("Helvetica-Bold").text("Detail Order")
  doc.font("Helvetica").text(`Order ID: #${order.id.slice(-6)}`)
  doc.text(`Tanggal: ${order.createdAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`)
  doc.text(`Status: ${order.status}`)
  doc.text(`Metode Pembayaran: ${order.paymentMethod || "-"}`)
  doc.moveDown(1)

  // Tabel Layanan
  doc.font("Helvetica-Bold").text("Rincian Layanan")
  doc.moveDown(0.3)

  // Header Tabel
  const tableTop = doc.y
  const col1X = 50
  const col2X = 200
  const col3X = 300
  const col4X = 400
  const col5X = 480

  doc.fontSize(9).font("Helvetica-Bold")
  doc.text("Layanan", col1X, tableTop)
  doc.text("Platform", col2X, tableTop)
  doc.text("Jumlah", col3X, tableTop)
  doc.text("Harga/Unit", col4X, tableTop)
  doc.text("Subtotal", col5X, tableTop)

  doc.moveDown(0.3)
  doc
    .moveTo(col1X, doc.y)
    .lineTo(550, doc.y)
    .stroke("#cccccc")
  doc.moveDown(0.3)

  // Isi Tabel
  doc.font("Helvetica")
  order.items.forEach(item => {
    const y = doc.y
    doc.text(item.service.name, col1X, y, { width: 140 })
    doc.text(item.service.platform.name, col2X, y, { width: 90 })
    doc.text(item.quantity.toString(), col3X, y, { width: 80 })
    doc.text(`Rp ${item.service.pricePerUnit.toLocaleString()}`, col4X, y, { width: 70 })
    doc.text(`Rp ${item.price.toLocaleString()}`, col5X, y)
    doc.moveDown(0.5)
  })

  // Garis Total
  doc.moveDown(0.3)
  doc.moveTo(col1X, doc.y).lineTo(550, doc.y).stroke("#cccccc")
  doc.moveDown(0.5)

  doc.font("Helvetica-Bold").fontSize(11)
  doc.text(`Total: Rp ${order.totalPrice.toLocaleString()}`, { align: "right" })

  // Footer
  doc.moveDown(2)
  doc.fontSize(8).font("Helvetica").text("Terima kasih telah menggunakan Exha Wave.", { align: "center" })
  doc.text("Exha Wave - Boost Your Social Presence", { align: "center" })

  doc.end()

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  })

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${order.id.slice(-6)}.pdf"`,
    },
  })
}