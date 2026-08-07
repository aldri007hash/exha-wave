"use client"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

// Fungsi untuk mengubah teks menjadi link yang bisa diklik
function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">
          {part}
        </a>
      )
    }
    return part
  })
}

interface OrderItem {
  id: string
  service: { name: string; hasGaransi: boolean }
  targetLink: string
  quantity: number
  price: number
  delivered: number
  startCount?: number | null
  endCount?: number | null
  notes?: string | null
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
  updatedAt: string
  paymentProof: string | null
  items: OrderItem[]
  review?: Review | null
  dripFeedRequest: boolean
  adminNote?: string | null
  completionFile?: string | null
  isGaransi: boolean
  garansiStart?: string
  garansiEnd?: string
  refillStatus: string
  refillReason?: string
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
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [refillReason, setRefillReason] = useState("")
  const [showRefillModal, setShowRefillModal] = useState(false)
  const [refillOrderId, setRefillOrderId] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundOrderId, setRefundOrderId] = useState("")
  const [refundSubmitting, setRefundSubmitting] = useState(false)

  useEffect(() => { if (status === "unauthenticated") redirect("/login") }, [status])

  const fetchOrders = useCallback(async () => {
    if (!session?.user) return
    try {
      const res = await fetch("/api/orders")
      if (res.ok) { const data = await res.json(); setOrders(data.orders || []); setLastUpdated(new Date()) }
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [session])

  useEffect(() => { if (status === "authenticated") fetchOrders() }, [fetchOrders, status])
  useEffect(() => { if (status !== "authenticated") return; const i = setInterval(fetchOrders, 30000); return () => clearInterval(i) }, [fetchOrders, status])

  const handleUpload = async (orderId: string) => {
    if (!uploadFile) return
    setUploadError(""); setUploadSuccess(false); setUploadingOrderId(orderId)
    const fd = new FormData(); fd.append("file", uploadFile); fd.append("orderId", orderId)
    const res = await fetch("/api/orders/upload-proof", { method: "POST", body: fd })
    if (res.ok) { setUploadSuccess(true); setUploadFile(null); fetchOrders() }
    else { const d = await res.json(); setUploadError(d.error || "Gagal") }
    setUploadingOrderId(null)
  }

  const handleRefillSubmit = async () => {
    if (!refillReason.trim()) return alert("Alasan wajib diisi")
    await fetch(`/api/orders/${refillOrderId}/refill`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: refillReason }) })
    setShowRefillModal(false); setRefillReason(""); setRefillOrderId("")
    fetchOrders()
  }

  const handleRefundSubmit = async () => {
    if (!refundReason.trim()) return alert("Alasan wajib diisi")
    setRefundSubmitting(true)
    try {
      const res = await fetch("/api/refund", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: refundOrderId, reason: refundReason }) })
      if (res.ok) { alert("Refund berhasil diajukan."); setShowRefundModal(false); setRefundReason(""); setRefundOrderId(""); fetchOrders() }
      else { const data = await res.json(); alert(data.error || "Gagal mengajukan refund") }
    } catch { alert("Terjadi kesalahan") }
    setRefundSubmitting(false)
  }

  const showInvoiceButton = (status: string) => ["PROGRESS", "PARTIAL", "COMPLETED", "CANCELLED"].includes(status)

  const reasonBoxStyle = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
      case "PARTIAL": return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700"
      case "PROGRESS": return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"
      case "CANCELLED": return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
      default: return ""
    }
  }

  if (status === "loading") return <div className="text-center py-12">Memeriksa sesi...</div>
  if (status === "unauthenticated") return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-heading text-3xl font-bold">My Orders</h1>
        <div className="text-xs text-gray-400">Auto-refresh tiap 30 detik · {lastUpdated.toLocaleTimeString("id-ID")} <button onClick={fetchOrders} className="ml-2 text-primary hover:underline">↻ Refresh</button></div>
      </div>
      {loading ? <div className="text-center py-12">Memuat pesanan...</div> : orders.length === 0 ? <div className="text-center py-12"><p className="text-gray-500 mb-4">Belum ada pesanan.</p><Link href="/#layanan" className="text-primary">Mulai Order</Link></div> : (
        <div className="space-y-4">
          {orders.map(order => {
            const now = new Date()
            const completedDate = order.garansiStart ? new Date(order.garansiStart) : new Date(order.updatedAt)
            const hPlus3 = completedDate.getTime() + 3 * 24 * 60 * 60 * 1000
            const hPlus7 = completedDate.getTime() + 7 * 24 * 60 * 60 * 1000
            const hasGaransiService = order.items.some(item => item.service.hasGaransi)
            const canRefill = order.status === "COMPLETED" && hasGaransiService && now.getTime() >= hPlus3 && now.getTime() <= hPlus7 && order.refillStatus === "NONE"
            const showAdminNote = order.adminNote && ["PROGRESS", "PARTIAL", "COMPLETED", "CANCELLED"].includes(order.status)
            const canRefund = ["CANCELLED", "PARTIAL"].includes(order.status)

            return (
              <div key={order.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Order #Exha{order.id.slice(-6).toUpperCase()}</span>
                  <span className={`px-2 py-1 rounded-full text-xs text-white ${statusColors[order.status]}`}>{order.status}</span>
                </div>
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="text-sm">
                      <div className="flex justify-between">
                        <span>{item.service.name} ({item.quantity}){item.notes && <span className="text-xs text-gray-400 ml-2">📝 {item.notes}</span>}</span>
                        <span>{formatCurrency(item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {showAdminNote && (
                  <div className={`mt-3 border rounded-lg p-3 ${reasonBoxStyle(order.status)}`}>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Catatan Admin:</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 break-words">{linkify(order.adminNote!)}</p>
                    {order.completionFile && (
                      <a href={order.completionFile} target="_blank" className="inline-block mt-2 text-xs text-primary hover:underline">
                        📎 Lihat File
                      </a>
                    )}
                  </div>
                )}
                {order.review && (
                  <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-1">
                      {[1,2,3,4,5].map(i => <span key={i} className={i <= order.review!.rating ? "text-yellow-500 text-sm" : "text-gray-300 text-sm"}>★</span>)}
                      <span className="text-xs text-gray-500 ml-2">{new Date(order.review.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{order.review.comment}</p>
                  </div>
                )}
                {(order.status === "PENDING_PAYMENT" || order.status === "PROCESSING") && !order.paymentProof && (
                  <div className="mt-3 p-3 border border-dashed rounded-lg">
                    <p className="text-sm font-medium mb-2">Upload Bukti Pembayaran</p>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="text-sm" />
                      <button onClick={() => handleUpload(order.id)} disabled={!uploadFile || uploadingOrderId === order.id} className="bg-primary text-white px-3 py-1 rounded-full text-sm disabled:opacity-50">{uploadingOrderId === order.id ? "Uploading..." : "Upload"}</button>
                    </div>
                    {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                    {uploadSuccess && <p className="text-green-500 text-xs mt-1">Bukti berhasil diupload!</p>}
                  </div>
                )}
                {order.paymentProof && <div className="mt-2 text-sm text-green-500">✓ Bukti pembayaran telah diupload</div>}
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold">Total: {formatCurrency(order.totalPrice)}</span>
                  <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                  {showInvoiceButton(order.status) && (
                    <a href={`/api/orders/${order.id}/invoice?t=${Date.now()}`} className="text-sm text-primary hover:underline" target="_blank">📄 Download Invoice</a>
                  )}
                  {canRefill && (
                    <button onClick={() => { setRefillOrderId(order.id); setRefillReason(""); setShowRefillModal(true) }} className="text-sm text-orange-500 hover:underline">🔧 Ajukan Garansi</button>
                  )}
                  {canRefund && (
                    <button onClick={() => { setRefundOrderId(order.id); setRefundReason(""); setShowRefundModal(true) }} className="text-sm text-red-500 hover:underline">💰 Ajukan Refund</button>
                  )}
                  {order.status === "COMPLETED" && !order.review && (
                    <Link href={`/orders/${order.id}/review`} className="text-primary text-sm hover:underline">⭐ Beri Ulasan</Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {showRefillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl p-6 w-full max-w-md">
            <h3 className="font-heading font-semibold mb-4">Ajukan Garansi</h3>
            <textarea value={refillReason} onChange={e => setRefillReason(e.target.value)} rows={3} className="border rounded px-3 py-2 w-full mb-4 bg-transparent" placeholder="Alasan..." />
            <div className="flex gap-2 justify-end"><button onClick={() => setShowRefillModal(false)} className="border px-4 py-2 rounded-full">Batal</button><button onClick={handleRefillSubmit} className="bg-primary text-white px-4 py-2 rounded-full">Kirim</button></div>
          </div>
        </div>
      )}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl p-6 w-full max-w-md">
            <h3 className="font-heading font-semibold mb-4">Ajukan Refund</h3>
            <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} rows={3} className="border rounded px-3 py-2 w-full mb-4 bg-transparent" placeholder="Alasan..." />
            <div className="flex gap-2 justify-end"><button onClick={() => setShowRefundModal(false)} className="border px-4 py-2 rounded-full">Batal</button><button onClick={handleRefundSubmit} disabled={refundSubmitting} className="bg-red-500 text-white px-4 py-2 rounded-full disabled:opacity-50">{refundSubmitting ? "Mengirim..." : "Ajukan Refund"}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
