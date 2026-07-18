"use client"
import { useState } from "react"
import useSWR from "swr"
import { Download, ChevronLeft, ChevronRight, X } from "lucide-react"
import Skeleton from "@/components/ui/Skeleton"
import { formatCurrency } from "@/lib/utils"

interface OrderItem {
  id: string
  service: { name: string }
  targetLink: string
  quantity: number
  price: number
}

interface Order {
  id: string
  user: { name: string; email: string }
  status: string
  totalPrice: number
  createdAt: string
  paymentProof: string | null
  items: OrderItem[]
}

const statusOptions = [
  "ALL", "PENDING_PAYMENT", "PROCESSING", "PROGRESS", "PARTIAL", "COMPLETED", "CANCELLED",
]

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [page, setPage] = useState(1)

  const [showReasonModal, setShowReasonModal] = useState(false)
  const [reasonText, setReasonText] = useState("")
  const [targetOrderId, setTargetOrderId] = useState("")
  const [targetStatus, setTargetStatus] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("limit", "20")
  if (statusFilter !== "ALL") params.set("status", statusFilter)
  if (searchTerm.trim()) params.set("search", searchTerm.trim())
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)

  const { data, error, isLoading, mutate } = useSWR(`/api/admin/orders?${params.toString()}`, fetcher)
  const orders: Order[] = data?.orders || []
  const totalPages = data?.pagination?.totalPages || 1
  const totalOrders = data?.pagination?.total || 0

  const handleSearch = () => { setPage(1) }

  const updateStatus = async (orderId: string, status: string) => {
    if (status === "CANCELLED" || status === "PARTIAL") {
      setTargetOrderId(orderId); setTargetStatus(status); setReasonText(""); setShowReasonModal(true)
    } else { await doUpdateStatus(orderId, status, "") }
  }

  const doUpdateStatus = async (orderId: string, status: string, reason: string) => {
    await fetch("/api/admin/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status, reason }) })
    mutate()
  }

  const handleReasonSubmit = () => { doUpdateStatus(targetOrderId, targetStatus, reasonText); setShowReasonModal(false) }
  const handleExport = () => window.open("/api/admin/orders/export", "_blank")

  const statusColors: Record<string, string> = {
    PENDING_PAYMENT: "bg-yellow-500", PROCESSING: "bg-blue-500", PROGRESS: "bg-purple-500",
    PARTIAL: "bg-orange-500", COMPLETED: "bg-green-500", CANCELLED: "bg-red-500",
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold">Manajemen Pesanan ({totalOrders})</h2>
        <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm mb-1">Cari (email/order ID/layanan)</label>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="Ketik..." className="border rounded px-3 py-2 w-full bg-transparent" />
        </div>
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="border rounded px-3 py-2 bg-transparent">
            {statusOptions.map(s => <option key={s} value={s}>{s === "ALL" ? "Semua Status" : s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Tanggal Mulai</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-3 py-2 bg-transparent" />
        </div>
        <div>
          <label className="block text-sm mb-1">Tanggal Akhir</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-3 py-2 bg-transparent" />
        </div>
        <button onClick={handleSearch} className="bg-primary text-white px-4 py-2 rounded-full">Cari</button>
        <button onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setStartDate(""); setEndDate(""); setPage(1) }} className="border px-4 py-2 rounded-full">Reset</button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-center text-red-500 py-12">Gagal memuat data. Coba lagi.</p>
      ) : orders.length === 0 ? (
        <p className="text-center py-12 text-gray-500">Tidak ada pesanan ditemukan.</p>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold">Order #{order.id.slice(-6)}</span>
                    <p className="text-sm text-gray-500">{order.user.name} ({order.user.email})</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs text-white ${statusColors[order.status] || "bg-gray-500"}`}>{order.status}</span>
                </div>
                <div className="mt-2 space-y-1">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.service.name} ({item.quantity}) - {item.targetLink}</span>
                      <span>{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
                {order.paymentProof && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-500">Bukti:</span>
                    <img src={order.paymentProof} alt="Bukti pembayaran" className="w-12 h-12 object-cover rounded cursor-pointer border" onClick={() => setPreviewUrl(order.paymentProof)} />
                    <a href={order.paymentProof} target="_blank" className="text-xs text-primary hover:underline" download>Download</a>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold">Total: {formatCurrency(order.totalPrice)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString("id-ID")}</span>
                    <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} className="border rounded px-2 py-1 bg-transparent text-sm">
                      {statusOptions.filter(s => s !== "ALL").map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-2 border rounded-full disabled:opacity-50"><ChevronLeft size={18} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-full text-sm ${p === page ? "bg-primary text-white" : "border hover:bg-primary/10"}`}>{p}</button>
              ))}
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="p-2 border rounded-full disabled:opacity-50"><ChevronRight size={18} /></button>
            </div>
          )}
        </>
      )}

      {showReasonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 w-96">
            <h3 className="font-heading font-semibold mb-4">Alasan Status "{targetStatus}"</h3>
            <textarea value={reasonText} onChange={e => setReasonText(e.target.value)} placeholder="Tulis alasan..." rows={3} className="border rounded px-3 py-2 w-full mb-4 bg-transparent" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowReasonModal(false)} className="border px-4 py-2 rounded-full">Batal</button>
              <button onClick={handleReasonSubmit} className="bg-primary text-white px-4 py-2 rounded-full">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-3xl max-h-[90vh]">
            <button className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-1" onClick={() => setPreviewUrl(null)}><X size={24} /></button>
            {previewUrl.endsWith(".pdf") ? <iframe src={previewUrl} className="w-[80vw] h-[80vh]" /> : <img src={previewUrl} alt="Bukti pembayaran" className="max-w-full max-h-[80vh] rounded-lg" />}
          </div>
        </div>
      )}
    </div>
  )
}