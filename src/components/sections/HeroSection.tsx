import dynamic from "next/dynamic"

const HeroContent = dynamic(() => import("./HeroContent"), {
  ssr: false,
  loading: () => (
    <div className="relative h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  ),
})

export default function HeroSection() {
  return <HeroContent />
}
