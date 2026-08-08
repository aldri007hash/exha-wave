"use client"
export default function CompetitorComparison() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-4 text-center">Mengapa Memilih Exha Wave?</h2>
        <p className="text-center text-gray-500 mb-8">Kami memberikan layanan terbaik dengan harga kompetitif.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading font-semibold text-lg mb-2">Harga Terjangkau</h3>
            <p className="text-sm text-gray-500">Mulai dari Rp 500 per layanan. Lebih murah dari kompetitor.</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading font-semibold text-lg mb-2">Proses Cepat</h3>
            <p className="text-sm text-gray-500">Pesanan diproses dalam hitungan menit setelah pembayaran.</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading font-semibold text-lg mb-2">Garansi 7 Hari</h3>
            <p className="text-sm text-gray-500">Layanan bergaransi dengan refill gratis jika terjadi drop.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
