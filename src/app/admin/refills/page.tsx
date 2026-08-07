"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle } from "lucide-react"

export default function AdminRefillsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/refills")
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleAction = async (orderId: string, action: string) => {
    await fetch("/api/admin/refills", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action }),
    })
    fetchRequests()
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm("Hapus pengajuan ini?")) return
    await fetch("/api/admin/refills", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "reject" }),
    })
    fetchRequests()
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Pengajuan Garansi</h2>
      {loading ? <p>Memuat...</p> : requests.length === 0 ? <p className="text-gray-500">Belum ada pengajuan.</p> : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className={`bg-card border rounded-xl p-4 ${req.refillStatus === "PENDING" ? "border-red-400 bg-red-50 dark:bg-red-900/10" : "border-green-400 bg-green-50 dark:bg-green-900/10"}`}>
              <p className="font-semibold">Order #Exha{req.id.slice(-6).toUpperCase()}</p>
              <p className="text-sm text-gray-500">{req.user.name} ({req.user.email})</p>
              <div className="mt-2 space-y-1 text-sm">
                {req.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between"><span>{item.service.name} ({item.quantity})</span><span>Rp {item.price.toLocaleString()}</span></div>
                ))}
              </div>
              <p className="text-sm mt-2">Total: <strong>Rp {req.totalPrice.toLocaleString()}</strong></p>
              <p className="text-xs text-gray-500 mt-1">Dibeli: {new Date(req.createdAt).toLocaleDateString("id-ID")}</p>
              <p className="text-xs text-gray-500">Garansi sampai: {req.garansiEnd ? new Date(req.garansiEnd).toLocaleDateString("id-ID") : "-"}</p>
              <p className="text-sm mt-2">Alasan: <em>{req.refillReason}</em></p>
              <div className="flex gap-2 mt-3">
                {req.refillStatus === "PENDING" && (
                  <>
                    <button onClick={() => handleAction(req.id, "complete")} className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"><CheckCircle size={14} /> Selesai</button>
                    <button onClick={() => handleAction(req.id, "reject")} className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"><XCircle size={14} /> Tolak</button>
                  </>
                )}
                {req.refillStatus === "COMPLETED" && (
                  <button onClick={() => handleDelete(req.id)} className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">Hapus</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
