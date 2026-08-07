import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Prompt AI yang berisi pengetahuan lengkap tentang Exha Wave
const SYSTEM_PROMPT = `Kamu adalah Exha AI, asisten virtual dari Exha Wave, SMM Panel Indonesia. Berikut pengetahuan yang kamu miliki:

- Exha Wave menyediakan jasa social media marketing (SMM) untuk TikTok, Instagram, Facebook, YouTube, Twitter, LinkedIn, Threads, dan lainnya.
- Layanan meliputi: followers, likes, comments, views, shares, saves, repost, report, spam call, spam chat, website polling, google form, dll.
- Harga bervariasi, mulai dari Rp 7.000 per 10 unit hingga Rp 99.000 untuk paket bundling.
- Ada layanan bergaransi (7 hari) dan non-garansi.
- Badge: "Terpopuler", "Hemat", "Flash Sale", "Baru", "Stok Terbatas".
- Pembayaran bisa via QRIS, GoPay, OVO, DANA, transfer bank (BRI, dll), dan Saldo Exha.
- User bisa topup saldo minimal Rp15.000, maksimal Rp1.000.000.
- Exha Points didapat dari login harian, referral, dan spin wheel. 100 poin = Rp10 potongan.
- Ada sistem referral dengan kode unik.
- User bisa mengajukan refund untuk pesanan yang dibatalkan atau partial.
- Ada garansi H+3 setelah pesanan selesai jika layanan bergaransi.
- Website: exhawave.com, kontak WhatsApp: +62 857-9942-8700, email: exhagroup@gmail.com.
- Ada dokumentasi API untuk reseller.
- Fitur live chat, broadcast pengumuman, audio player.

Jika ada pertanyaan di luar pengetahuan kamu, arahkan user untuk menghubungi admin melalui live chat atau WhatsApp.`

// Fungsi pencarian lokal sederhana
async function localSearch(message: string): Promise<string> {
  const lower = message.toLowerCase().trim()
  if (!lower) return "Silakan ketik pertanyaan Anda ya! Saya Exha AI, siap membantu 24/7. 😊"

  // Sapaan
  if (lower.match(/^(halo|hai|hi|assalamualaikum|selamat pagi|selamat siang|selamat sore|selamat malam)/)) {
    return "Halo! Selamat datang di Exha Wave. Ada yang bisa saya bantu hari ini? 😊"
  }
  if (lower.match(/terima kasih|makasih|thanks/)) return "Sama-sama! Senang bisa membantu. Ada lagi yang bisa saya bantu?"
  if (lower.match(/siapa kamu|kamu siapa/)) return "Saya Exha AI, asisten virtual dari Exha Wave, SMM Panel Indonesia."
  
  // Layanan
  if (lower.match(/layanan|jasa|smm|panel|like|follow|view|comment|share|save|repost|report/)) {
    const platforms = await prisma.platform.findMany({ include: { services: { where: { isActive: true }, take: 5 } } })
    if (platforms.length > 0) {
      let response = "Berikut beberapa layanan kami:\n"
      platforms.slice(0, 3).forEach(p => {
        response += `\n*${p.name}*:\n`
        p.services.forEach(s => {
          response += `- ${s.name} (min ${s.minOrder}, Rp ${s.pricePerUnit.toLocaleString()}/${s.minOrder})\n`
        })
      })
      response += "\nLihat selengkapnya di halaman Layanan Kami!"
      return response
    }
  }

  // Harga
  if (lower.match(/harga|biaya|tarif|berapa/)) {
    return "Harga layanan bervariasi mulai Rp 7.000 hingga Rp 99.000 tergantung jenis dan jumlah. Cek halaman Layanan Kami untuk detailnya."
  }

  // Pembayaran
  if (lower.match(/bayar|pembayaran|transfer|topup|saldo|qris|gopay|ovo|dana/)) {
    return "Kami menerima pembayaran via QRIS, GoPay, OVO, DANA, transfer bank, dan Saldo Exha. Topup saldo minimal Rp15.000."
  }

  // Refund
  if (lower.match(/refund|uang kembali|cancel|batal/)) {
    return "Anda bisa mengajukan refund untuk pesanan yang dibatalkan (Cancelled) atau sebagian (Partial). Buka My Orders, klik 'Ajukan Refund'."
  }

  // Garansi
  if (lower.match(/garansi/)) {
    return "Layanan dengan badge 'Garansi' memiliki garansi 7 hari. Setelah pesanan selesai, Anda bisa ajukan garansi H+3."
  }

  // Poin
  if (lower.match(/poin|point|reward/)) {
    return "Exha Points bisa didapat dari login harian (+10 poin), referral, dan spin wheel. 100 poin = Rp10 potongan belanja."
  }

  // Reseller
  if (lower.match(/reseller|api|dokumentasi/)) {
    return "Kami menyediakan API untuk reseller. Lihat dokumentasi di /dokumentasi-api. Daftar di /daftar-reseller."
  }

  // Kontak
  if (lower.match(/kontak|admin|cs|whatsapp|email/)) {
    return "Hubungi kami via WhatsApp: +62 857-9942-8700 atau email: exhagroup@gmail.com"
  }

  return "Terima kasih! Saya belum mengerti pertanyaan Anda. Ketik 'halo' untuk memulai lagi, atau hubungi admin via live chat."
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let room = await prisma.chatRoom.findFirst({ where: { userId: session.user.id }, include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } } })
  if (!room) room = await prisma.chatRoom.create({ data: { userId: session.user.id }, include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } } })
  return NextResponse.json({ room, aiStatus: "online" })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Pesan kosong" }, { status: 400 })

  let room = await prisma.chatRoom.findFirst({ where: { userId: session.user.id } })
  if (!room) {
    const availableAdmin = await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" }, orderBy: { createdAt: "asc" } })
    room = await prisma.chatRoom.create({ data: { userId: session.user.id, adminId: availableAdmin?.id || undefined } })
  }

  // Simpan pesan user
  await prisma.chatMessage.create({ data: { roomId: room.id, userId: session.user.id, role: "user", content, createdAt: new Date(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } })
  await prisma.chatRoom.update({ where: { id: room.id }, data: { updatedAt: new Date() } })

  // Generate balasan AI
  let aiReply = ""
  try {
    // Coba pakai Gemini jika ada API key
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenerativeAI } = require("@google/generative-ai")
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-pro" })
      const chat = model.startChat({ history: [{ role: "user", parts: [{ text: SYSTEM_PROMPT }] }, { role: "model", parts: [{ text: "Baik, saya akan menjawab sebagai Exha AI." }] }] })
      const result = await chat.sendMessage(content)
      aiReply = result.response.text()
    } else {
      aiReply = await localSearch(content)
    }
  } catch {
    aiReply = await localSearch(content)
  }

  const aiMsg = await prisma.chatMessage.create({ data: { roomId: room.id, role: "ai", content: aiReply, createdAt: new Date(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } })

  // Notifikasi ke admin untuk pemantauan
  const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" } })
  for (const admin of admins) {
    await prisma.notification.create({ data: { userId: admin.id, title: "Pesan Chat Masuk", message: `User ${session.user.name} mengirim pesan baru.` } })
  }

  return NextResponse.json({ message: aiMsg, aiStatus: "online" })
}
