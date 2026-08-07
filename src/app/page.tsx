import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import HeroSection from "@/components/sections/HeroSection"
import ServicesSection from "@/components/sections/ServicesSection"
import CompetitorComparison from "@/components/sections/CompetitorComparison"
import AboutSection from "@/components/sections/AboutSection"
import FAQSection from "@/components/sections/FAQSection"
import TestimonialsSection from "@/components/sections/TestimonialsSection"
import ContactSection from "@/components/sections/ContactSection"
import SmartEstimator from "@/components/sections/SmartEstimator"
import ProofSection from "@/components/sections/ProofSection"


export default async function HomePage() {
  let platforms: any[] = []
  try {
    platforms = await prisma.platform.findMany({
      include: { services: true },
    })
  } catch (error) {
    console.error("Gagal mengambil data platforms:", error)
  }

  return (
    <>
      <HeroSection />
      <SmartEstimator platforms={platforms} />
      <Suspense fallback={<div className="py-16 bg-background text-center">Memuat statistik...</div>}>
        <ProofSection />
      </Suspense>
      <ServicesSection />
      <CompetitorComparison />
      <AboutSection />
      <FAQSection />
      <TestimonialsSection />
      <ContactSection />
    </>
  )
}
