import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan - Exha Wave",
  description: "Syarat dan ketentuan penggunaan layanan Exha Wave, SMM Panel Indonesia.",
}

export default function SyaratKetentuanPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose dark:prose-invert">
      <h1>Syarat dan Ketentuan</h1>
      <p>Terakhir diperbarui: 1 Agustus 2026</p>
      
      <h2>1. Penerimaan Syarat</h2>
      <p>Dengan mengakses dan menggunakan website Exha Wave, Anda menyetujui syarat dan ketentuan ini.</p>
      
      <h2>2. Layanan</h2>
      <p>Exha Wave menyediakan jasa social media marketing. Kami berhak menolak pesanan yang melanggar kebijakan platform terkait.</p>
      
      <h2>3. Pembayaran</h2>
      <p>Pembayaran dilakukan di muka. Refund tersedia untuk pesanan yang tidak dapat diselesaikan.</p>
      
      <h2>4. Garansi</h2>
      <p>Garansi 7 hari untuk layanan bergaransi. Penurunan jumlah dalam masa garansi akan di-refill.</p>
      
      <h2>5. Privasi</h2>
      <p>Data pribadi Anda dilindungi sesuai kebijakan privasi kami.</p>
      
      <h2>6. Perubahan</h2>
      <p>Kami berhak mengubah syarat ini sewaktu-waktu. Perubahan akan diumumkan di halaman ini.</p>
      
      <h2>7. Kontak</h2>
      <p>Pertanyaan: <a href="mailto:exhagroup@gmail.com">exhagroup@gmail.com</a></p>
    </div>
  )
}
