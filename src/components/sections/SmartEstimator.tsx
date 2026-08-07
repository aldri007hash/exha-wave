"use client"
import { useState } from "react"

export default function SmartEstimator({ platforms }: { platforms: any[] }) {
  const [currentPlatform, setCurrentPlatform] = useState<any>(null)
  const [result, setResult] = useState<any>(null)

  const calculateBudget = () => {
    if (!currentPlatform) return
    // Gunakan any untuk menghindari error tipe, karena data dari API
    const services = currentPlatform.services || []
    const available = services.filter((s: any) => s.isActive)
    if (available.length === 0) return
    const cheapest = available.reduce((min: any, s: any) =>
      s.pricePerUnit / s.minOrder < min.pricePerUnit / min.minOrder ? s : min
    )
    setResult({ service: cheapest, platform: currentPlatform })
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <h3 className="font-heading font-semibold mb-2">Estimator Cerdas</h3>
      <select
        value={currentPlatform?.id || ""}
        onChange={e => {
          const selected = platforms.find((p: any) => p.id === e.target.value)
          setCurrentPlatform(selected)
          setResult(null)
        }}
        className="border rounded px-3 py-2 w-full bg-transparent mb-3"
      >
        <option value="">Pilih Platform</option>
        {platforms.map((p: any) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <button onClick={calculateBudget} className="bg-primary text-white px-4 py-2 rounded-full w-full">
        Hitung Estimasi
      </button>
      {result && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
          <p>Platform: {result.platform.name}</p>
          <p>Layanan Termurah: {result.service.name}</p>
          <p>Harga per Unit: Rp {result.service.pricePerUnit.toLocaleString()}</p>
          <p>Min Order: {result.service.minOrder}</p>
        </div>
      )}
    </div>
  )
}
