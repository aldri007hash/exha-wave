import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q || ""
  if (!q) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="font-heading text-3xl font-bold mb-4">Pencarian</h1>
        <p className="text-gray-500">Masukkan kata kunci untuk mencari layanan atau FAQ.</p>
      </div>
    )
  }

  const [platforms, faqs] = await Promise.all([
    prisma.platform.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { services: { some: { name: { contains: q, mode: "insensitive" } } } },
        ],
      },
      include: {
        services: {
          where: { isActive: true },
        },
      },
    }),
    prisma.faq.findMany({
      where: {
        OR: [
          { question: { contains: q, mode: "insensitive" } },
          { answer: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { order: "asc" },
    }),
  ])

  // Highlight kata kunci di teks
  const highlight = (text: string) => {
    const regex = new RegExp(`(${q})`, "gi")
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">{part}</mark> : part
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold mb-6">
        Hasil Pencarian: <span className="text-primary">"{q}"</span>
      </h1>

      {/* Layanan */}
      {platforms.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-semibold mb-4">Layanan</h2>
          <div className="space-y-3">
            {platforms.map(platform => (
              <div key={platform.id} className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-primary">{highlight(platform.name)}</h3>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  {platform.services.map(service => (
                    <div key={service.id} className="flex justify-between">
                      <span>{highlight(service.name)}</span>
                      <span>Rp{service.pricePerUnit.toLocaleString()} / {service.minOrder}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <div>
          <h2 className="font-heading text-2xl font-semibold mb-4">FAQ</h2>
          <div className="space-y-3">
            {faqs.map(faq => (
              <details key={faq.id} className="bg-card border border-border rounded-xl p-4">
                <summary className="font-semibold cursor-pointer">{highlight(faq.question)}</summary>
                <p className="mt-2 text-gray-600">{highlight(faq.answer)}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {platforms.length === 0 && faqs.length === 0 && (
        <p className="text-center text-gray-500 py-12">Tidak ada hasil untuk "{q}".</p>
      )}
    </div>
  )
}