import { prisma } from "@/lib/prisma"

export async function localChat(message: string): Promise<string> {
  const msg = message.toLowerCase().trim()

  // 1. Cek sapaan
  if (/^(halo|hai|hi|hey|assalam)/i.test(msg)) {
    return "Halo! 👋 Ada yang bisa saya bantu? Kamu bisa tanya tentang layanan, harga, cara order, atau status pesanan."
  }

  // 2. Cek pertanyaan tentang pembayaran
  if (/bayar|payment|transfer|qris|gopay|ovo|dana/i.test(msg)) {
    return "Kami menerima pembayaran via transfer bank (BCA), QRIS, GoPay, OVO, dan Dana. Setelah checkout, kamu akan dapat instruksi pembayaran lengkap. Status pesanan akan berubah setelah admin memverifikasi pembayaran kamu."
  }

  // 3. Cek pertanyaan tentang cara order
  if (/cara order|bagaimana order|order gimana/i.test(msg)) {
    return "Caranya gampang! 1) Pilih platform (TikTok, IG, dll), 2) Klik 'Detail & Pesan' di layanan yang kamu mau, 3) Isi link target dan jumlah, 4) Masukkan ke keranjang, 5) Checkout dan pilih pembayaran. Kalau bingung, klik tombol 'Hubungi Admin' ya!"
  }

  // 4. Cek pertanyaan tentang poin
  if (/poin|point|exha point/i.test(msg)) {
    return "Exha Points adalah reward buat kamu! 100 poin = Rp10 potongan. Kamu bisa dapat poin dari login harian (+10), referral (+50), dan spin wheel. Poin otomatis dipakai saat checkout untuk diskon."
  }

  // 5. Cari FAQ yang cocok
  const faqs = await prisma.faq.findMany()
  for (const faq of faqs) {
    const questionWords = faq.question.toLowerCase().split(/\s+/)
    const matchCount = questionWords.filter(w => msg.includes(w)).length
    if (matchCount >= 2 || (matchCount === 1 && questionWords.length === 1)) {
      return faq.answer
    }
  }

  // 6. Cari layanan
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: { platform: true },
  })
  for (const service of services) {
    const keywords = `${service.platform.name} ${service.name}`.toLowerCase()
    if (keywords.split(/\s+/).some(w => msg.includes(w))) {
      const pricePerUnit = Math.round(service.pricePerUnit / service.minOrder)
      return `Layanan ${service.platform.name} - ${service.name}: Rp${service.pricePerUnit.toLocaleString()} per ${service.minOrder} unit (harga satuan sekitar Rp${pricePerUnit.toLocaleString()}/unit). Minimal order ${service.minOrder} unit.`
    }
  }

  // 7. Cari informasi kontak
  if (/kontak|hubungi|admin|whatsapp|wa/i.test(msg)) {
    return "Kamu bisa hubungi kami via WhatsApp di 0857-9942-8700 atau email exhagroup@gmail.com. Atau klik tombol 'Hubungi Admin' di bawah untuk chat langsung dengan admin."
  }

  // 8. Fallback
  return "Maaf, saya belum mengerti pertanyaan kamu. Coba tanyakan tentang layanan, harga, cara order, atau klik tombol 'Hubungi Admin' di bawah ini untuk bantuan langsung dari tim kami."
}