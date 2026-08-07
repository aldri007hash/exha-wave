"use client"
import useSWR from "swr"
import { useSearchParams } from "next/navigation"
import ServiceCard from "@/components/ServiceCard"
import PlatformFilter from "@/components/PlatformFilter"
import PromoBanner from "@/components/PromoBanner"
import Skeleton from "@/components/ui/Skeleton"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useMemo } from "react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return isMobile
}

export default function ServicesSection() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""
  const isMobile = useIsMobile()
  const itemsPerPage = isMobile ? 6 : 12

  const [page, setPage] = useState(1)
  const [selectedPlatform, setSelectedPlatform] = useState<string>("")

  // Jika platform dipilih, gunakan pagination server-side
  // Jika "Semua", ambil semua data, pagination client-side
  const params = new URLSearchParams()
  params.set("page", selectedPlatform ? String(page) : "1")
  params.set("limit", selectedPlatform ? String(itemsPerPage) : "9999") // ambil semua untuk mode semua
  if (selectedPlatform) params.set("platform", selectedPlatform)
  if (q) params.set("search", q)

  const { data, isLoading } = useSWR(`/api/services?${params.toString()}`, fetcher)

  const platforms = data?.platforms || []
  const totalServer = data?.pagination?.total || 0

  // Client-side pagination untuk mode "Semua"
  const allServicesFlat = useMemo(() => {
    if (selectedPlatform) return [] // tidak digunakan saat platform dipilih
    const flat: any[] = []
    platforms.forEach((platform: any) => {
      platform.services.forEach((service: any) => {
        flat.push({ platform, service })
      })
    })
    return flat
  }, [platforms, selectedPlatform])

  const totalClient = allServicesFlat.length
  const totalPagesClient = Math.ceil(totalClient / itemsPerPage)
  const currentPageServices = useMemo(() => {
    if (selectedPlatform) return [] // server-side sudah dipotong
    const start = (page - 1) * itemsPerPage
    return allServicesFlat.slice(start, start + itemsPerPage)
  }, [allServicesFlat, page, itemsPerPage, selectedPlatform])

  // Kelompokkan kembali services per platform untuk render
  const groupedServices = useMemo(() => {
    if (selectedPlatform) {
      // Server-side, sudah dikelompokkan dalam platform[0]
      return platforms
    }
    // Client-side: kelompokkan services yang ada di halaman ini
    const map = new Map<string, any>()
    currentPageServices.forEach(({ platform, service }) => {
      if (!map.has(platform.id)) {
        map.set(platform.id, { ...platform, services: [] })
      }
      map.get(platform.id).services.push(service)
    })
    return Array.from(map.values())
  }, [selectedPlatform, platforms, currentPageServices])

  // Reset page saat ganti platform
  useEffect(() => {
    setPage(1)
  }, [selectedPlatform])

  const totalPages = selectedPlatform ? (data?.pagination?.totalPages || 1) : totalPagesClient
  const totalServices = selectedPlatform ? totalServer : totalClient

  return (
    <section id="layanan" className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center" data-aos="fade-up">
          Layanan Kami
        </h2>
        <p className="text-center text-gray-500 mb-8" data-aos="fade-up" data-aos-delay="100">
          Pilih platform target untuk melihat harga dan mulai order. Kualitas terjamin, hasil nyata.
        </p>

        <PromoBanner />

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
              {groupedServices.map((platform: any) =>
                platform.services.map((service: any) => (
                  <ServiceCard key={service.id} platform={platform} service={service} />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-2 border rounded-full disabled:opacity-50 hover:bg-primary/10"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (page <= 4) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = page - 3 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-full text-sm ${pageNum === page ? "bg-primary text-white" : "border hover:bg-primary/10"}`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-2 border rounded-full disabled:opacity-50 hover:bg-primary/10"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            <p className="text-center text-xs text-gray-500 mt-4">
              Menampilkan {selectedPlatform ? platforms[0]?.services.length || 0 : currentPageServices.length} dari {totalServices} layanan
            </p>
          </>
        )}
      </div>
    </section>
  )
}
