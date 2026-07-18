import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Fungsi respons AI yang SUPER AGRESIF
async function localSearch(message: string): Promise<string> {
  const lowerMsg = message.toLowerCase().trim()
  if (!lowerMsg) return "Silakan ketik pertanyaan Anda ya! Saya Exha AI, siap membantu 24/7. 😊"

  // PERCAKAPAN SEHARI-HARI (Ekspansif)
  const dailyChat: Record<string, string> = {
    halo: "Halo! Ada yang bisa saya bantu hari ini? 😊",
    hai: "Hai! Selamat datang di Exha Wave. Ada yang bisa saya bantu?",
    hi: "Hi! Ada yang bisa saya bantu?",
    "apa kabar": "Saya baik, terima kasih! Saya Exha AI, asisten virtual Exha Wave. Ada yang bisa saya bantu?",
    "selamat pagi": "Selamat pagi! Semoga hari Anda menyenangkan. Ada yang bisa saya bantu?",
    "selamat siang": "Selamat siang! Ada yang bisa saya bantu hari ini?",
    "selamat sore": "Selamat sore! Ada yang bisa saya bantu?",
    "selamat malam": "Selamat malam! Ada yang bisa saya bantu?",
    "terima kasih": "Sama-sama! Senang bisa membantu. Ada lagi yang bisa saya bantu? 😊",
    makasih: "Sama-sama! Ada lagi yang bisa saya bantu?",
    thanks: "You're welcome! Ada lagi yang bisa saya bantu?",
    "siapa kamu": "Saya Exha AI, asisten virtual dari Exha Wave. Saya di sini untuk membantu Anda dengan pertanyaan seputar layanan kami!",
    "kamu siapa": "Saya Exha AI, asisten virtual Exha Wave. Siap membantu Anda 24/7!",
    "bisa bantu": "Tentu! Silakan tanyakan apa saja tentang layanan Exha Wave. Saya siap membantu!",
    help: "Tentu! Silakan tanyakan apa yang ingin Anda ketahui tentang Exha Wave.",
    tolong: "Ada yang bisa saya bantu? Silakan tanyakan!",
    test: "Ya, saya di sini! Ada yang bisa saya bantu?",
    ok: "Baik! Ada lagi yang bisa saya bantu?",
    oke: "Baik! Ada lagi yang bisa saya bantu?",
    iya: "Ada yang bisa saya bantu selanjutnya?",
    "mau tanya": "Silakan tanyakan! Saya siap membantu.",
    "mau nanya": "Silakan bertanya! Saya di sini untuk membantu.",
    p: "Halo! Ada yang bisa saya bantu? 😊", // untuk "p" singkat
    assalamualaikum: "Waalaikumsalam! Selamat datang di Exha Wave. Ada yang bisa saya bantu?",
  }

  for (const [key, response] of Object.entries(dailyChat)) {
    if (lowerMsg.includes(key)) return response
  }

  // FAQ (longgar, 1 kata kunci cukup)
  const faqs = await prisma.faq.findMany()
  for (const faq of faqs) {
    const qWords = faq.question.toLowerCase().split(/\s+/)
    if (qWords.some(w => lowerMsg.includes(w))) return faq.answer
  }

  // Layanan
  const platforms = await prisma.platform.findMany({
    include: { services: { where: { isActive: true } } },
  })
  for (const p of platforms) {
    for (const s of p.services) {
      if (lowerMsg.includes(s.name.toLowerCase()) || lowerMsg.includes(p.name.toLowerCase())) {
        return `Layanan ${p.name} - ${s.name}: Rp${s.pricePerUnit.toLocaleString()} per ${s.minOrder} unit.\nMinimal order: ${s.minOrder} unit.\nApakah Anda ingin memesan?`
      }
    }
  }

  // Template umum
  if (lowerMsg.includes("harga") || lowerMsg.includes("biaya")) return "Harga layanan kami bervariasi. Silakan cek halaman 'Layanan Kami' untuk info lengkap."
  if (lowerMsg.includes("bayar") || lowerMsg.includes("transfer")) return "Kami menerima pembayaran via Transfer Bank, QRIS, GoPay, OVO, Dana, dan Saldo Exha."
  if (lowerMsg.includes("order") || lowerMsg.includes("pesan")) return "Untuk memesan: Pilih layanan → Isi link target → Masukkan jumlah → Tambahkan ke keranjang → Checkout."
  if (lowerMsg.includes("poin") || lowerMsg.includes("point")) return "Exha Points bisa didapatkan dari login harian, referral, dan spin wheel. 100 poin = Rp10 potongan belanja."
  if (lowerMsg.includes("saldo") || lowerMsg.includes("topup")) return "Anda bisa topup Saldo Exha di halaman Topup (ikon dompet di header). Minimal Rp15.000."

  // Fallback – PASTI ADA JAWABAN
  return "Terima kasih atas pertanyaannya! Untuk informasi lebih lanjut, Anda bisa:\n• Cek halaman 'Layanan Kami' untuk harga\n• Cek 'FAQ' untuk pertanyaan umum\n• Klik tombol 'Hubungi Admin' untuk bantuan langsung\n\nKetik 'halo' untuk memulai lagi 😊"
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let room = await prisma.chatRoom.findFirst({
    where: { userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
  })
  if (!room) {
    room = await prisma.chatRoom.create({
      data: { userId: session.user.id },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
    })
  }
  return NextResponse.json({ room })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { content, contactAdmin } = await req.json()

  let room = await prisma.chatRoom.findFirst({ where: { userId: session.user.id } })
  if (!room) room = await prisma.chatRoom.create({ data: { userId: session.user.id } })

  // Simpan pesan user
  const userMsg = await prisma.chatMessage.create({
    data: {
      roomId: room.id,
      userId: session.user.id,
      role: "user",
      content: content || (contactAdmin ? "User ingin menghubungi admin." : ""),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  await prisma.chatRoom.update({ where: { id: room.id }, data: { updatedAt: new Date() } })

  // Jika user klik Hubungi Admin
  if (contactAdmin) {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: { userId: admin.id, title: "Permintaan Live Chat", message: `User ${session.user.name} meminta bantuan admin.` },
      })
    }
    const noteMsg = await prisma.chatMessage.create({
      data: { roomId: room.id, role: "ai", content: "Admin akan segera menghubungi Anda. Mohon tunggu sebentar.", createdAt: new Date(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    })
    return NextResponse.json({ message: noteMsg })
  }

  // AI SELALU MERESPON (tanpa syarat adminId)
  const aiReply = await localSearch(content || "")

  const aiMsg = await prisma.chatMessage.create({
    data: { roomId: room.id, role: "ai", content: aiReply, createdAt: new Date(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  })

  return NextResponse.json({ aiMessage: aiMsg })
}