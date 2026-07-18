"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"

const prizes = [10, 20, 30, 40, 50, 100]

export default function SpinPage() {
  const { data: session } = useSession()
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [message, setMessage] = useState("")

  if (!session?.user) redirect("/login")

  const handleSpin = async () => {
    setSpinning(true)
    setResult(null)
    setMessage("")

    // Simulasi spin (putar acak)
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)]

    setTimeout(async () => {
      setResult(randomPrize)
      setSpinning(false)

      // Kirim hasil ke server
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prize: randomPrize }),
      })
      const data = await res.json()
      setMessage(data.message || `Kamu dapat +${randomPrize} Exha Points!`)
    }, 2000)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <h1 className="font-heading text-3xl font-bold mb-6">🎡 Spin Wheel</h1>
      <div className="bg-card border border-border rounded-xl p-8">
        <div className={`w-48 h-48 mx-auto rounded-full border-8 border-primary flex items-center justify-center mb-6 ${spinning ? "animate-spin" : ""}`}>
          <span className="text-2xl font-bold">{spinning ? "🎰" : result ? `+${result}` : "SPIN"}</span>
        </div>
        {message && (
          <p className="text-lg font-semibold text-primary mb-4">{message}</p>
        )}
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="bg-primary text-white px-8 py-3 rounded-full font-semibold text-lg disabled:opacity-50"
        >
          {spinning ? "Memutar..." : "Putar"}
        </button>
      </div>
    </div>
  )
}