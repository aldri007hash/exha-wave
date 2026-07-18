"use client"
import { useState, useEffect } from "react"

export default function AdminDripFeedPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    const res = await fetch("/api/admin/dripfeed")
    const data = await res.json()
    setOrders(data.orders || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleApprove = async (orderId: string) => {
    await fetch("/api/admin/dripfeed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "approve" }),
    })
    fetchOrders()
  }

  const handleReject = async (orderId: string) => {
    await fetch("/api/admin/dripfeed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "reject" }),
    })
    fetchOrders()
  }

  const handleMarkBatch = async (orderId: string, day: number) => {
    await fetch("/api/admin/dripfeed", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, day, completed: true }),
    })
    fetchOrders()
  }

  if (loading) return <p className="text-center py-12">Memuat data...</p>

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Drip Feed Management</h2>
      {orders.length === 0 && <p className="text-gray-500">Tidak ada permintaan drip‑feed.</p>}
      <div className="space-y-6">
        {orders.map(order => {
          const batches = order.dripFeedBatches || []
          return (
            <div key={order.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex justify-between">
                <div>
                  <span className="font-semibold">Order #{order.id.slice(-6)}</span>
                  <p className="text-sm text-gray-500">{order.user.name} ({order.user.email})</p>
                  <p className="text-sm">Status: {order.status}</p>
                </div>
                <div className="flex gap-2">
                  {order.dripFeedRequest && order.status === "PROCESSING" && (
                    <>
                      <button onClick={() => handleApprove(order.id)} className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">Setujui</button>
                      <button onClick={() => handleReject(order.id)} className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">Tolak</button>
                    </>
                  )}
                </div>
              </div>
              {batches.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Batch Pengiriman</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {batches.map((batch: any) => (
                      <div key={batch.day} className="border rounded p-2 text-center">
                        <p className="text-xs font-semibold">Hari {batch.day}</p>
                        <p className="text-xs">{batch.items.reduce((s: number, i: any) => s + i.quantity, 0)} unit</p>
                        {batch.completed ? (
                          <span className="text-green-500 text-xs">✓ Selesai</span>
                        ) : (
                          <button
                            onClick={() => handleMarkBatch(order.id, batch.day)}
                            className="text-primary text-xs underline"
                          >
                            Tandai Selesai
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}