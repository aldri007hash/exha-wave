import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"

export default async function CompetitorComparison() {
  let competitors: any[] = []
  let dbError = false

  try {
    competitors = await prisma.competitor.findMany({
      orderBy: { createdAt: "asc" }
    })
  } catch (error) {
    console.error("Gagal mengambil data perbandingan kompetitor:", error)
    dbError = true
  }

  // Jika error DB, tidak tampilkan apa-apa (atau tampilkan fallback)
  if (dbError) {
    return null
  }

  if (competitors.length === 0) return null

  return (
    <section id="perbandingan" className="py-16 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold text-center mb-2" data-aos="fade-up">
          Kenapa Exha Wave?
        </h2>
        <p className="text-center text-gray-500 mb-8" data-aos="fade-up" data-aos-delay="100">
          Bandingkan harga kami dengan kompetitor. Harga lebih hemat, kualitas terjamin.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-card border-b">
                <th className="text-left py-3 px-4 font-semibold">Platform</th>
                <th className="text-left py-3 px-4 font-semibold">Layanan</th>
                <th className="text-left py-3 px-4 font-semibold">Kompetitor</th>
                <th className="text-left py-3 px-4 font-semibold">Harga Kompetitor</th>
                <th className="text-left py-3 px-4 font-semibold bg-primary/10 text-primary">Harga Exha</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map(comp => (
                <tr key={comp.id} className="border-b hover:bg-card/50 transition-colors">
                  <td className="py-3 px-4">{comp.platform}</td>
                  <td className="py-3 px-4">{comp.service}</td>
                  <td className="py-3 px-4">{comp.competitorName}</td>
                  <td className="py-3 px-4 text-red-500">{formatCurrency(comp.competitorPrice)}</td>
                  <td className="py-3 px-4 bg-primary/5 text-primary font-bold relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent animate-pulse" style={{ animationDuration: "3s" }} />
                    <span className="relative z-10">{formatCurrency(comp.ourPrice)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}