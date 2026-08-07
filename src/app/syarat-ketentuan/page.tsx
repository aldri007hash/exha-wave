import Link from "next/link"

export default function SyaratKetentuan() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold mb-6">Syarat & Ketentuan</h1>
      <p className="mb-4">Selamat datang di Exha Wave. Dengan menggunakan layanan kami, Anda setuju dengan syarat dan ketentuan berikut:</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Layanan</h2>
      <p>Exha Wave menyediakan jasa social media marketing. Kami berhak menolak pesanan yang melanggar kebijakan platform terkait.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Pembayaran</h2>
      <p>Pembayaran dilakukan di muka. Refund hanya diberikan jika pesanan tidak dapat diproses dalam waktu yang dijanjikan.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">3. Privasi</h2>
      <p>Data pribadi Anda dilindungi sesuai kebijakan privasi kami.</p>
      <Link href="/" className="inline-block mt-8 text-primary hover:underline">← Kembali ke Beranda</Link>
    </div>
  )
}
