"use client"
import { useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"

interface Platform {
  id: string
  name: string
  services: Service[]
}
interface Service {
  id: string
  name: string
  minOrder: number
  pricePerUnit: number
}

export default function SmartEstimator() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [mode, setMode] = useState<"budget" | "unit">("unit")
  const [budget, setBudget] = useState(50000)
  const [selectedPlatform, setSelectedPlatform] = useState("")
  const [result, setResult] = useState<{ service: string; quantity: number }[]>([])
  const [selectedService, setSelectedService] = useState("")
  const [quantity, setQuantity] = useState(1000)
  const [total, setTotal] = useState(0)
  const [upsellMessage, setUpsellMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch("/api/admin/services")
      .then(res => res.json())
      .then(data => setPlatforms(data.platforms || []))
      .finally(() => setLoading(false))
  }, [])

  const currentPlatform = platforms.find(p => p.id === selectedPlatform)
  const currentService = currentPlatform?.services.find(s => s.id === selectedService)

  useEffect(() => {
    if (mode === "unit" && currentService) {
      const units = Math.max(currentService.minOrder, quantity)
      const price = Math.round((units / currentService.minOrder) * currentService.pricePerUnit)
      setTotal(price)

      // Deal Finder Logic
      const tiers = [
        { threshold: 50000, message: "Tambahan Rp{amount} lagi untuk mendapatkan Bonus Tier Poin +20!" },
        { threshold: 100000, message: "Tambahan Rp{amount} lagi untuk mendapatkan Bonus Tier Poin +50!" },
      ]
      for (const tier of tiers) {
        if (price < tier.threshold) {
          const diff = tier.threshold - price
          setUpsellMessage(tier.message.replace("{amount}", formatCurrency(diff)))
          break
        } else {
          setUpsellMessage("")
        }
      }
    }
  }, [selectedService, quantity, mode, currentService])

  const calculateBudget = () => {
    if (!currentPlatform) return
    const available = currentPlatform.services.filter(s => s.isActive)
    if (available.length === 0) return
    const cheapest = available.reduce((min, s) =>
      s.pricePerUnit / s.minOrder < min.pricePerUnit / min.minOrder ? s : min
    )
    const pricePerUnit = cheapest.pricePerUnit / cheapest.minOrder
    const qty = Math.floor(budget / pricePerUnit)
    setResult([{ service: cheapest.name, quantity: qty }])
  }

  return (
    <section id="kalkulator" className="py-16 bg-card">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold text-center mb-2" data-aos="fade-up">
          Smart Estimator
        </h2>
        <p className="text-center text-gray-500 mb-8" data-aos="fade-up" data-aos-delay="100">
          Hitung estimasi budget atau lihat berapa unit yang bisa kamu dapatkan.
        </p>

        <div className="flex justify-center gap-2 mb-6">
          <button onClick={() => setMode("unit")} className={`px-4 py-2 rounded-full text-sm ${mode === "unit" ? "bg-primary text-white" : "border"}`}>
            Unit → Harga
          </button>
          <button onClick={() => setMode("budget")} className={`px-4 py-2 rounded-full text-sm ${mode === "budget" ? "bg-primary text-white" : "border"}`}>
            Budget → Unit
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Platform</label>
          <select value={selectedPlatform} onChange={e => { setSelectedPlatform(e.target.value); setSelectedService("") }} className="border rounded px-3 py-2 w-full bg-transparent">
            <option value="">Pilih Platform</option>
            {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {loading && <p className="text-center text-sm text-gray-500 mb-4">Memuat data layanan...</p>}

        {mode === "budget" ? (
          <>
            <div className="mb-4">
              <label className="block text-sm mb-1">Budget (Rp)</label>
              <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className="border rounded px-3 py-2 w-full bg-transparent" />
            </div>
            <button onClick={calculateBudget} className="bg-primary text-white px-6 py-2 rounded-full">Hitung</button>
            {result.length > 0 && (
              <div className="mt-4 p-4 bg-primary/10 rounded-xl">
                <p className="font-semibold">Dengan {formatCurrency(budget)}, kamu bisa mendapatkan:</p>
                {result.map((r, i) => (
                  <p key={i} className="text-lg font-bold text-primary">{r.quantity.toLocaleString()} {r.service}</p>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Layanan</label>
                <select value={selectedService} onChange={e => setSelectedService(e.target.value)} className="border rounded px-3 py-2 w-full bg-transparent">
                  <option value="">Pilih Layanan</option>
                  {currentPlatform?.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Jumlah</label>
                <input type="number" min={currentService?.minOrder || 1000} step={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="border rounded px-3 py-2 w-full bg-transparent" />
              </div>
            </div>
            {total > 0 && (
              <div className="mt-4 p-4 bg-primary/10 rounded-xl text-center">
                <p className="text-sm text-gray-500">Estimasi Harga</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
                {upsellMessage && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 animate-pulse">💡 {upsellMessage}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}