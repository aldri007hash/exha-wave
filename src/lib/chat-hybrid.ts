import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

export async function hybridChat(message: string): Promise<string> {
  // 1. Cek FAQ (jawaban template)
  const faqs = await prisma.faq.findMany()
  const msgLower = message.toLowerCase()
  const matchedFaq = faqs.find(f =>
    msgLower.includes(f.question.toLowerCase().slice(0, 10))
  )
  if (matchedFaq) return matchedFaq.answer

  // 2. Coba Gemini jika tersedia
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      const services = await prisma.service.findMany({
        where: { isActive: true },
        include: { platform: true },
      })
      const knowledge = `Kamu adalah Exha AI dari Exha Wave, SMM Panel Indonesia. Layanan aktif: ${services.map(s => `${s.platform.name} - ${s.name} Rp${s.pricePerUnit}/${s.minOrder} unit`).join("; ")}. Jawab pertanyaan ini dalam bahasa Indonesia: ${message}`
      const result = await model.generateContent(knowledge)
      return result.response.text()
    } catch (e) {
      console.error("Gemini error:", e)
    }
  }

  // 3. Cari layanan yang paling cocok
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: { platform: true },
  })
  const words = msgLower.split(/\s+/)
  const bestService = services.find(s =>
    words.some(w => s.name.toLowerCase().includes(w) || s.platform.name.toLowerCase().includes(w))
  )
  if (bestService) {
    return `Layanan ${bestService.platform.name} - ${bestService.name} tersedia dengan harga Rp${bestService.pricePerUnit} per ${bestService.minOrder} unit. Minimal order ${bestService.minOrder} unit.`
  }

  // 4. Jawaban template default
  return `Halo! Saya Exha AI. Saya bisa membantu Anda dengan:
- Informasi layanan (TikTok, Instagram, YouTube, dll)
- Harga dan minimal order
- Cara pembayaran
- Status pesanan
Silakan ketik pertanyaan Anda atau klik "Hubungi Admin" untuk bantuan langsung.`
}