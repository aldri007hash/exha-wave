import { Suspense } from "react"
import HeroSection from "@/components/sections/HeroSection"
import SmartEstimator from "@/components/sections/SmartEstimator"
import ServicesSection from "@/components/sections/ServicesSection"
import CompetitorComparison from "@/components/sections/CompetitorComparison"
import AboutSection from "@/components/sections/AboutSection"
import FAQSection from "@/components/sections/FAQSection"
import TestimonialsSection from "@/components/sections/TestimonialsSection"
import ContactSection from "@/components/sections/ContactSection"
import Skeleton from "@/components/ui/Skeleton"
import ProofSection from "@/components/sections/ProofSection"
import OnboardingTour from "@/components/OnboardingTour"

export const dynamic = "force-dynamic"

function ServicesFallback() {
  return (
    <section id="layanan" className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center">Layanan Kami</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQFallback() {
  return (
    <section id="faq" className="py-16">
      <div className="max-w-3xl mx-auto px-4 space-y-4">
        <h2 className="font-heading text-3xl font-bold mb-6 text-center">FAQ</h2>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </section>
  )
}

function TestimonialsFallback() {
  return (
    <section id="testimoni" className="py-16 bg-card">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-6 text-center">Testimoni</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-background border border-border rounded-xl p-6 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SmartEstimator />
      <Suspense fallback={<div className="py-16 bg-background text-center">Memuat statistik...</div>}>
        <ProofSection />
      </Suspense>
      <Suspense fallback={<ServicesFallback />}>
        <ServicesSection />
      </Suspense>
      <Suspense fallback={<div className="py-16 text-center">Memuat perbandingan...</div>}>
        <CompetitorComparison />
      </Suspense>
      <Suspense fallback={<div className="py-16 bg-card text-center">Memuat...</div>}>
        <AboutSection />
      </Suspense>
      <Suspense fallback={<FAQFallback />}>
        <FAQSection />
      </Suspense>
      <Suspense fallback={<TestimonialsFallback />}>
        <TestimonialsSection />
      </Suspense>
      <ContactSection />
      <OnboardingTour />
    </>
  )
}