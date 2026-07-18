"use client"
import { useState, useEffect } from "react"

export default function DripTrackPage() {
  const [orders, setOrders] = useState<any[]>([])

  const fetchOrders = async () => {
    const res = await fetch("/api/admin/dripfeed/track")
    const data = await res.json()
    setOrders(data.orders || [])
  }

  useEffect(() => { fetchOrders() }, [])

  const markBatchComplete = async (orderId: string, day: number) => {
    await fetch("/api/admin/dripfeed/track", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, day }),
    })
    fetchOrders()
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Tracking Drip‑Feed</h2>
      {orders.map(order => {
        const completed = order.dripFeedBatches?.filter((b: any) => b.completed).length || 0
        const totalDays = order.dripFeedDays || 1
        const progress = Math.round((completed / totalDays) * 100)

        return (
          <div key={order.id} className="bg-card border border-border rounded-xl p-4 mb-4">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{order.user.name}</p>
                <p className="text-sm">Order #{order.id.slice(-6)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">Progres: {completed}/{totalDays} hari</p>
                <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(order.dripFeedBatches as any[])?.map((batch: any) => (
                <button
                  key={batch.day}
                  disabled={batch.completed}
                  onClick={() => markBatchComplete(order.id, batch.day)}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    batch.completed
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-gray-100 border-gray-300 hover:bg-primary/10"
                  }`}
                >
                  Hari {batch.day} ({batch.quantity})
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}