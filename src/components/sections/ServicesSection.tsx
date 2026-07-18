"use client"
import useSWR from "swr"
import { useSearchParams } from "next/navigation"
import ServiceCard from "@/components/ServiceCard"
import PlatformFilter from "@/components/PlatformFilter"
import Skeleton from "@/components/ui/Skeleton"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ServicesSection() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""

  const [page, setPage] = useState(1)
  const [selectedPlatform, setSelectedPlatform] = useState<string>("")

  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("limit", "9")
  if (selectedPlatform) params.set("platform", selectedPlatform)
  if (q) params.set("search", q)

  const { data, isLoading } = useSWR(`/api/services?${params.toString()}`, fetcher)

  const platforms = data?.platforms || []
  const totalPages = data?.pagination?.totalPages || 1

  return (
    <section id="layanan" className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center" data-aos="fade-up">
          Layanan Kami
        </h2>
        <p className="text-center text-gray-500 mb-8" data-aos="fade-up" data-aos-delay="100">
          Pilih platform target untuk melihat harga dan mulai order. Kualitas terjamin, hasil nyata.
        </p>

        <div className="sticky top-[72px] z-40 bg-background py-3 -mx-4 px-4">
          <PlatformFilter
            platforms={platforms}
            selected={selectedPlatform}
            onSelect={(slug) => { setSelectedPlatform(slug); setPage(1) }}
          />
          {q && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Hasil pencarian untuk: <strong>{q}</strong>
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : platforms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Tidak ada layanan ditemukan {q && `untuk "${q}"`}.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {platforms.map((platform: any) =>
                platform.services.map((service: any) => (
                  <ServiceCard key={service.id} platform={platform} service={service} />
                ))
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-2 border rounded-full disabled:opacity-50"><ChevronLeft size={18} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-full text-sm ${p === page ? "bg-primary text-white" : "border hover:bg-primary/10"}`}>{p}</button>
                ))}
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="p-2 border rounded-full disabled:opacity-50"><ChevronRight size={18} /></button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}