"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

const steps = [
  {
    target: "#layanan",
    title: "Cara Order",
    content: "Pilih platform, klik 'Detail & Pesan', isi link target, lalu tambahkan ke keranjang.",
  },
  {
    target: "[href='/orders']",
    title: "Cek Status",
    content: "Pantau status pesananmu di halaman My Orders. Refresh otomatis setiap 30 detik.",
  },
  {
    target: "[href='/dashboard']",
    title: "Kode Referral",
    content: "Dapatkan poin dengan membagikan kode referralmu! Setiap teman yang daftar, kamu dapat +50 poin.",
  },
]

export default function OnboardingTour() {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Tampilkan hanya jika user baru login pertama kali
    const hasSeenTour = localStorage.getItem("onboarding-done")
    if (session?.user && !hasSeenTour) {
      setShow(true)
    }
  }, [session])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      localStorage.setItem("onboarding-done", "true")
      setShow(false)
    }
  }

  const handleSkip = () => {
    localStorage.setItem("onboarding-done", "true")
    setShow(false)
  }

  if (!session?.user || !show) return null

  const step = steps[currentStep]

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
        <div className="text-4xl mb-4">
          {currentStep === 0 ? "🛒" : currentStep === 1 ? "📦" : "🎁"}
        </div>
        <h3 className="font-heading text-xl font-bold mb-2">{step.title}</h3>
        <p className="text-sm text-gray-500 mb-6">{step.content}</p>
        <div className="flex items-center justify-between">
          <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-gray-600">
            Lewati
          </button>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === currentStep ? "bg-primary" : "bg-gray-300"}`}
              />
            ))}
          </div>
          <button onClick={handleNext} className="bg-primary text-white px-4 py-2 rounded-full text-sm">
            {currentStep === steps.length - 1 ? "Selesai" : "Lanjut"}
          </button>
        </div>
      </div>
    </div>
  )
}