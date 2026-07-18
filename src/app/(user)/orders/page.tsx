"use client"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import confetti from "canvas-confetti"
import { formatCurrency } from "@/lib/utils"

interface OrderItem {
  id: string
  service: { name: string }
  targetLink: string
  quantity: number
  price: number
  delivered: number
}

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
}

interface Order {
  id: string
  status: string
  totalPrice: number
  createdAt: string
  paymentProof: string | null
  items: OrderItem[]
  review?: Review | null
  dripFeedRequest: boolean
  dripFeedBatches?: { day: number; items: OrderItem[]; completed: boolean }[]
}

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-500",
  PROCESSING: "bg-blue-500",
  PROGRESS: "bg-purple-500",
  PARTIAL: "bg-orange-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const fetchOrders = useCallback(async () => {
    if (!session?.user) return
    try {
      const res = await fetch("/api/orders")
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Gagal fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  useEffect(() => {
    const hasCompletedWithoutReview = orders.some(
      (order) => order.status === "COMPLETED" && !order.review
    )
    if (hasCompletedWithoutReview) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    }
  }, [orders])

  if (!session?.user) redirect("/login")

  const handleUpload = async (orderId: string) => {
    if (!uploadFile) return
    setUploadError("")
    setUploadSuccess(false)
    setUploadingOrderId(orderId)

    const formData = new FormData()
    formData.append("file", uploadFile)
    formData.append("orderId", orderId)

    const res = await fetch("/api/orders/upload-proof", { method: "POST", body: formData })
    if (res.ok) {
      setUploadSuccess(true)
      setUploadFile(null)
      fetchOrders()
    } else {
      const data = await res.json()
      setUploadError(data.error || "Gagal upload")
    }
    setUploadingOrderId(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-heading text-3xl font-bold">My Orders</h1>
        <div className="text-xs text-gray-400">
          Auto-refresh tiap 30 detik · Terakhir: {lastUpdated.toLocaleTimeString("id-ID")}
          <button onClick={fetchOrders} className="ml-2 text-primary hover:underline">
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Memuat pesanan...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Belum ada pesanan.</p>
          <Link href="/#layanan" className="text-primary">Mulai Order</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Order #{order.id.slice(-6)}</span>
                <span className={`px-2 py-1 rounded-full text-xs text-white ${statusColors[order.status] || "bg-gray-500"}`}>
                  {order.status}
                </span>
              </div>
              <div className="space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.service.name} ({item.quantity})</span>
                    <span>{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>

              {/* Tampilkan review jika sudah ada */}
              {order.review && (
                <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} className={i <= order.review!.rating ? "text-yellow-500 text-sm" : "text-gray-300 text-sm"}>★</span>
                    ))}
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(order.review.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{order.review.comment}</p>
                </div>
              )}

              {/* Upload bukti pembayaran */}
              {(order.status === "PENDING_PAYMENT" || order.status === "PROCESSING") && !order.paymentProof && (
                <div className="mt-3 p-3 border border-dashed rounded-lg">
                  <p className="text-sm font-medium mb-2">Upload Bukti Pembayaran</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={e => setUploadFile(e.target.files?.[0] || null)}
                      className="text-sm"
                    />
                    <button
                      onClick={() => handleUpload(order.id)}
                      disabled={!uploadFile || uploadingOrderId === order.id}
                      className="bg-primary text-white px-3 py-1 rounded-full text-sm disabled:opacity-50"
                    >
                      {uploadingOrderId === order.id ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                  {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                  {uploadSuccess && <p className="text-green-500 text-xs mt-1">Bukti berhasil diupload!</p>}
                </div>
              )}
              {order.paymentProof && (
                <div className="mt-2 text-sm text-green-500">✓ Bukti pembayaran telah diupload</div>
              )}

              {/* Progress bar untuk status PROGRESS */}
              {order.status === "PROGRESS" && !order.dripFeedRequest && (
                <div className="mt-3">
                  {order.items.map((item) => {
                    const progress = item.quantity > 0 ? (item.delivered / item.quantity) * 100 : 0
                    return (
                      <div key={item.id} className="mb-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{item.service.name}</span>
                          <span>{item.delivered}/{item.quantity} ({Math.round(progress)}%)</span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Drip-Feed Progress */}
              {order.dripFeedRequest && order.dripFeedBatches && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Drip‑Feed Progress</p>
                  <div className="flex gap-1">
                    {order.dripFeedBatches.map((batch, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 h-2 rounded-full ${batch.completed ? "bg-green-500" : "bg-gray-300"}`}
                        title={`Hari ${batch.day}: ${batch.items.reduce((s, i) => s + i.quantity, 0)} unit`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    {order.dripFeedBatches.map((batch, idx) => (
                      <span key={idx}>H{batch.day}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mt-2">
                <span className="font-semibold">Total: {formatCurrency(order.totalPrice)}</span>
                <span className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <Link href={`/api/invoice/${order.id}`} className="text-sm text-primary hover:underline" target="_blank">
                  📄 Download Invoice
                </Link>
                {order.status === "COMPLETED" && !order.review && (
                  <Link href={`/orders/${order.id}/review`} className="text-primary text-sm hover:underline">
                    ⭐ Beri Ulasan
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}