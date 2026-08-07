"use client"
import useSWR from "swr"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TestimonialsSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const { data, isLoading, mutate } = useSWR("/api/testimonials", fetcher, { revalidateOnFocus: true, dedupingInterval: 2000, refreshInterval: 10000 })
  const reviews = data?.reviews || []

  useEffect(() => {
    const handler = () => { mutate() }
    window.addEventListener("testimoni-updated", handler)
    window.addEventListener("storage", (e) => { if (e.key === "testimoniUpdated") handler() })
    return () => { window.removeEventListener("testimoni-updated", handler); window.removeEventListener("storage", handler) }
  }, [mutate])

  const nextSlide = () => { if (reviews.length > 0) setCurrentSlide(prev => (prev + 1) % reviews.length) }
  const prevSlide = () => { if (reviews.length > 0) setCurrentSlide(prev => (prev - 1 + reviews.length) % reviews.length) }

  if (isLoading) return <section id="testimoni" className="py-16"><div className="max-w-4xl mx-auto px-4"><h2 className="font-heading text-3xl font-bold text-center mb-8">Testimoni Pelanggan</h2><div className="flex justify-center"><div className="h-40 w-full max-w-md animate-pulse bg-card rounded-xl" /></div></div></section>
  if (reviews.length === 0) return <section id="testimoni" className="py-16"><div className="max-w-4xl mx-auto px-4"><h2 className="font-heading text-3xl font-bold text-center mb-8">Testimoni Pelanggan</h2><p className="text-center text-gray-500">Belum ada testimoni.</p></div></section>

  return (
    <section id="testimoni" className="py-16">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold text-center mb-8">Testimoni Pelanggan</h2>
        <div className="relative">
          <div className="overflow-hidden"><div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>{reviews.map((review: any) => (<div key={review.id} className="w-full flex-shrink-0 px-4"><div className="bg-card border border-border rounded-xl p-6 max-w-md mx-auto"><div className="flex items-center gap-3 mb-3">{review.user?.image ? <img src={review.user.image} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{review.user?.name?.[0] || "?"}</div>}<div><p className="font-semibold">{review.user?.name || "Anonim"}</p></div></div><div className="flex mb-2">{[1,2,3,4,5].map(i => <span key={i} className={i <= review.rating ? "text-yellow-500" : "text-gray-300"}>★</span>)}</div><p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>{review.serviceName && <p className="text-xs text-gray-400 mt-1">Layanan: {review.serviceName}</p>}</div></div>))}</div></div>
          {reviews.length > 1 && (<div className="flex justify-center items-center gap-4 mt-4"><button onClick={prevSlide} className="p-2 border rounded-full hover:bg-primary/10"><ChevronLeft size={18} /></button><span className="text-sm text-gray-500">{currentSlide + 1} / {reviews.length}</span><button onClick={nextSlide} className="p-2 border rounded-full hover:bg-primary/10"><ChevronRight size={18} /></button></div>)}
        </div>
      </div>
    </section>
  )
}
