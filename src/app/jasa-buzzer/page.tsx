import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Jasa Buzzer Indonesia Murah & Berkualitas | Exha Wave",
  description: "Exha Wave menyediakan jasa buzzer Indonesia murah dan berkualitas untuk semua platform sosial media. Tingkatkan engagement bisnis Anda dengan jasa buzzer terpercaya.",
  keywords: ["jasa buzzer", "jasa buzzer murah", "jasa buzzer indonesia", "jasa buzzer terpercaya", "jasa buzzer berkualitas"],
}

export default function JasaBuzzerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="font-heading text-4xl font-bold mb-6 text-center">Jasa Buzzer Indonesia Murah & Berkualitas</h1>
      <p className="text-lg mb-8 text-center text-gray-600 dark:text-gray-300">
        Exha Wave adalah penyedia <strong>jasa buzzer Indonesia</strong> terpercaya yang siap membantu meningkatkan visibilitas online bisnis Anda. 
        Kami menawarkan layanan <strong>jasa buzzer murah</strong> tanpa mengorbankan kualitas.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading text-2xl font-bold mb-4">Mengapa Memilih Jasa Buzzer Exha Wave?</h2>
          <ul className="space-y-3">
            <li>✅ <strong>Buzzer Indonesia Asli</strong> - Akun real, bukan bot</li>
            <li>✅ <strong>Harga Ekonomis</strong> - Mulai dari Rp15.000</li>
            <li>✅ <strong>Proses Cepat</strong> - Hasil mulai terlihat dalam hitungan menit</li>
            <li>✅ <strong>Garansi</strong> - Jika hasil tidak sesuai, kami ganti</li>
            <li>✅ <strong>24/7 Support</strong> - Tim kami siap membantu kapan saja</li>
          </ul>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading text-2xl font-bold mb-4">Layanan Jasa Buzzer Kami</h2>
          <ul className="space-y-3">
            <li>📱 <strong>TikTok</strong> - Like, View, Follower, Comment, Share, Save</li>
            <li>📸 <strong>Instagram</strong> - Like, View, Follower, Comment, Share</li>
            <li>📘 <strong>Facebook</strong> - Like, View, Follower, Comment, Share</li>
            <li>▶️ <strong>YouTube</strong> - View, Like, Subscriber, Comment</li>
            <li>🐦 <strong>X (Twitter)</strong> - Like, Retweet, Follower</li>
          </ul>
        </div>
      </div>
      
      <div className="text-center">
        <Link href="/#layanan" className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-primary/30 transition-all inline-block">
          Pesan Jasa Buzzer Sekarang
        </Link>
        <p className="mt-4 text-sm text-gray-500">Atau hubungi kami di WhatsApp: <a href="https://wa.me/6285799428700" className="text-primary hover:underline">+62 857-9942-8700</a></p>
      </div>
    </div>
  )
}
