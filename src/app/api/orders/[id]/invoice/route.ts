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
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { service: { include: { platform: true } } } },
    },
  })

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const primaryColor = [0, 82, 212] // #0052D4

  // Header Background Gradient
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, 45, "F")

  // Logo & Brand
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text("EXHA WAVE", 15, 18)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("EXHA WAVE OFFICIAL", 15, 25)
  doc.text("WA: 0857-9942-8700 | exhagroup@gmail.com", 15, 32)
  doc.text("Kabupaten Sleman, Yogyakarta, Indonesia", 15, 39)

  // Invoice Title & Status
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("INVOICE", pageWidth - 55, 18)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`#Exha${order.id.slice(-6).toUpperCase()}`, pageWidth - 55, 25)
  doc.text(`Tanggal: ${new Date(order.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth - 55, 32)

  // Status Badge
  const statusColors: Record<string, [number, number, number]> = {
    COMPLETED: [40, 167, 69],
    PROCESSING: [0, 82, 212],
    PENDING_PAYMENT: [255, 193, 7],
    PROGRESS: [111, 66, 193],
    PARTIAL: [253, 126, 20],
    CANCELLED: [220, 53, 69],
  }
  const statusColor = statusColors[order.status] || [108, 117, 125]
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.text(order.status, pageWidth - 55, 39, { baseline: "middle" })

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Tagihan Kepada
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("TAGIHAN KEPADA", 15, 58)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`${order.user.name}`, 15, 66)
  doc.text(`Email: ${order.user.email}`, 15, 73)
  if (order.user.phone) doc.text(`Telp: ${order.user.phone}`, 15, 80)

  // Rincian Layanan
  let y = 92
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("RINCIAN LAYANAN", 15, y)
  y += 8
  doc.setDrawColor(220, 220, 220)
  doc.line(15, y, pageWidth - 15, y)
  y += 6

  // Table header
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Layanan", 15, y)
  doc.text("Target", 80, y)
  doc.text("Jumlah", 130, y)
  doc.text("Harga", 160, y)
  y += 5

  doc.setFont("helvetica", "normal")
  for (const item of order.items) {
    if (y > 250) { doc.addPage(); y = 20 }
    doc.text(`${item.service.platform.name} - ${item.service.name}`, 15, y, { maxWidth: 55 })
    doc.text(`${item.targetLink}`, 80, y, { maxWidth: 45 })
    doc.text(`${item.quantity}`, 130, y)
    doc.text(`Rp ${item.price.toLocaleString("id-ID")}`, 160, y)
    y += 6

    // Garansi - HANYA jika service.hasGaransi = true dan order.isGaransi = true
    if (item.service.hasGaransi && order.isGaransi && order.garansiEnd) {
      doc.setFontSize(8)
      doc.setTextColor(40, 167, 69)
      doc.text(`Garansi hingga ${new Date(order.garansiEnd).toLocaleDateString("id-ID")} | Estimasi 2-5 Jam`, 15, y)
      doc.setTextColor(0, 0, 0)
      y += 5
    }

    // Start & End Count
    if (item.startCount != null && item.endCount != null) {
      doc.setFontSize(8)
      doc.text(`Awal: ${item.startCount} | Akhir: ${item.endCount}`, 15, y)
      y += 5
    }
    y += 2
  }

  // Rincian Pembayaran
  y += 5
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("RINCIAN PEMBAYARAN", 15, y)
  y += 8
  doc.line(15, y, pageWidth - 15, y)
  y += 6

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Subtotal", 15, y)
  doc.text(`Rp ${order.totalPrice.toLocaleString("id-ID")}`, 160, y, { align: "right" })
  y += 7
  doc.text("Diskon", 15, y)
  doc.text("- Rp 0", 160, y, { align: "right" })
  y += 7
  doc.text(`Metode: ${order.paymentMethod || "Manual"}`, 15, y)
  y += 7
  doc.text(`Waktu Bayar: ${new Date(order.createdAt).toLocaleString("id-ID")}`, 15, y)
  y += 10

  // Total
  doc.setDrawColor(0, 0, 0)
  doc.line(15, y, pageWidth - 15, y)
  y += 8
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("TOTAL BAYAR", 15, y)
  doc.text(`Rp ${order.totalPrice.toLocaleString("id-ID")}`, 160, y, { align: "right" })

  // Footer
  y += 15
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text("Catatan: Invoice ini sah dan dibuat otomatis oleh sistem Exha Wave.", 15, y)
  y += 5
  doc.text("Untuk komplain/refill garansi hubungi CS pada Live Chat.", 15, y)
  y += 5
  doc.text("Alamat: Kabupaten Sleman, Yogyakarta, Indonesia | exhagroup@gmail.com | 0857-9942-8700", 15, y)

  // Generate PDF
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Invoice-Exha${order.id.slice(-6).toUpperCase()}.pdf"`,
    },
  })
}
