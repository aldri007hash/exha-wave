import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "404 - Halaman Tidak Ditemukan | Exha Wave",
  robots: "noindex, follow",
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center max-w-lg">
        <h1 className="font-heading text-8xl font-bold text-primary mb-4">404</h1>
        <h2 className="font-heading text-2xl font-semibold mb-2 text-foreground">Halaman Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-6">
          Maaf, halaman yang Anda cari telah dipindahkan, dihapus, atau tidak pernah ada.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/" className="bg-primary text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all">
            Kembali ke Beranda
          </Link>
          <Link href="/#layanan" className="border border-border px-8 py-3 rounded-full font-semibold hover:bg-card transition-all">
            Lihat Layanan
          </Link>
        </div>
      </div>
    </div>
  )
}
