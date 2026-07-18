"use client"
import useSWR from "swr"
import Skeleton from "@/components/ui/Skeleton"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TestimonialsSection() {
  const { data, isLoading } = useSWR("/api/testimonials", fetcher)
  const reviews = data?.reviews || []

  return (
    <section id="testimoni" className="py-16 bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center" data-aos="fade-up">
          Testimoni
        </h2>
        <p className="text-center text-gray-500 mb-8" data-aos="fade-up" data-aos-delay="100">
          Cerita sukses dari pelanggan yang telah merasakan dampak Exha Wave.
        </p>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white/20 dark:bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-gray-500">Belum ada testimoni.</p>
        ) : (
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            breakpoints={{
              768: {
                slidesPerView: 2,
                spaceBetween: 24,
              },
            }}
            className="pb-12"
          >
            {reviews.map((review: any) => (
              <SwiperSlide key={review.id}>
                <div className="bg-white/20 dark:bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-primary/30 transition-all duration-300 h-full">
                  <div className="flex items-center gap-2 mb-2">
                    {review.user.image ? (
                      <img src={review.user.image} className="w-8 h-8 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {review.user.name[0]}
                      </div>
                    )}
                    <span className="font-semibold text-sm">{review.user.name}</span>
                  </div>
                  <div className="flex mb-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < review.rating ? "text-yellow-500" : "text-gray-400"}>★</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  )
}