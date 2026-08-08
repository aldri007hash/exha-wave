"use client"
import { useState } from "react"
import Link from "next/link"

export default function SmartEstimator({ platforms }: { platforms: any[] }) {
  const [selected, setSelected] = useState("")
  const platform = platforms.find((p: any) => p.id === selected)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-heading font-semibold mb-2">Estimator Cerdas</h3>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="border rounded px-3 py-2 w-full bg-transparent mb-3"
        >
          <option value="">Pilih Platform</option>
          {platforms.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {platform && (
          <div className="text-sm text-gray-500 mb-3">
            {platform.services?.length || 0} layanan tersedia untuk {platform.name}
          </div>
        )}
        <Link href="/#layanan" className="bg-primary text-white px-4 py-2 rounded-full w-full block text-center">
          Hitung Estimasi
        </Link>
      </div>
    </div>
  )
}
