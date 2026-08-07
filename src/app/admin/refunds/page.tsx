"use client"
import { useState, useEffect } from "react"

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState("")

  const fetchRefunds = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/refund")
    const data = await res.json()
    setRefunds(data.refunds || [])
    setLoading(false)
  }

  useEffect(() => { fetchRefunds() }, [])

  const handleAction = async (refundId: string, action: string) => {
    const adminNote = action === "reject" ? prompt("Alasan penolakan:") : ""
    if (action === "reject" && !adminNote) return
    await fetch("/api/admin/refund", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refundId, action, adminNote }) })
    fetchRefunds()
  }

  if (loading) return <p className="p-4">Memuat data refund...</p>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manajemen Refund</h1>
      {refunds.length === 0 ? <p className="text-gray-500">Tidak ada pengajuan refund.</p> : (
        <div className="space-y-4">
          {refunds.map(refund => (
            <div key={refund.id} className="bg-card border border-border rounded-xl p-4">
              <p className="font-semibold">{refund.user.name} ({refund.user.email})</p>
              <p className="text-sm text-gray-500">Order: #Exha{refund.order.id.slice(-6).toUpperCase()} | Status Order: {refund.order.status}</p>
              <p className="text-sm text-gray-500">Jumlah: Rp {refund.amount.toLocaleString()}</p>
              {refund.reason && <p className="text-sm text-gray-400">Alasan: {refund.reason}</p>}
              <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${refund.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : refund.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{refund.status}</span>
              {refund.status === "PENDING" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleAction(refund.id, "approve")} className="bg-green-500 text-white px-4 py-1 rounded-full text-sm">Setujui</button>
                  <button onClick={() => handleAction(refund.id, "reject")} className="bg-red-500 text-white px-4 py-1 rounded-full text-sm">Tolak</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
