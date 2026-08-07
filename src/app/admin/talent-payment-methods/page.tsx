"use client"
import { useState, useEffect } from "react"

export default function TalentPaymentMethodsPage() {
  const [methods, setMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMethods() }, [])

  const fetchMethods = async () => {
    const res = await fetch("/api/admin/talent-payment-methods")
    const data = await res.json()
    setMethods(data.methods || [])
    setLoading(false)
  }

  if (loading) return <p className="p-4">Memuat...</p>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Metode Bayar Talent</h1>
      {methods.length === 0 ? <p className="text-gray-500">Belum ada data.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Nama Talent</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Bank/E-Wallet</th>
                <th className="text-left py-2">Nomor</th>
                <th className="text-left py-2">Atas Nama</th>
                <th className="text-left py-2">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m: any) => (
                <tr key={m.id} className="border-b">
                  <td className="py-2">{m.user?.name}</td>
                  <td className="py-2 text-xs text-gray-500">{m.user?.email}</td>
                  <td className="py-2">{m.bankName}</td>
                  <td className="py-2">{m.accountNumber}</td>
                  <td className="py-2">{m.accountName}</td>
                  <td className="py-2 text-xs">{m.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
