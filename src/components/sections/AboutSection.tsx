"use client"
import useSWR from "swr"
import Skeleton from "@/components/ui/Skeleton"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AboutSection() {
  const { data, isLoading } = useSWR("/api/about", fetcher)
  const rawContent = data?.content || "<p>Tentang Exha Wave...</p>"

  return (
    <section id="tentang" className="py-16 bg-card">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-4 text-center" data-aos="fade-up">
          Tentang Kami
        </h2>
        <p className="text-center text-gray-500 mb-6" data-aos="fade-up" data-aos-delay="100">
          Lebih dari sekadar panel SMM. Kami adalah mitra pertumbuhan digital Anda.
        </p>
        {isLoading ? (
          <div className="space-y-3" data-aos="fade-up" data-aos-delay="200">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div
            className="prose dark:prose-invert max-w-none"
            data-aos="fade-up"
            data-aos-delay="200"
            dangerouslySetInnerHTML={{ __html: rawContent }}
          />
        )}
      </div>
    </section>
  )
}
