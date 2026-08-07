"use client"
import { useState } from "react"
import useSWR from "swr"
import { Download, ChevronLeft, ChevronRight, X, Upload, ArrowUpDown } from "lucide-react"
import Skeleton from "@/components/ui/Skeleton"
import { formatCurrency } from "@/lib/utils"

interface OrderItem { id: string; service: { name: string }; targetLink: string; profileName?: string | null; quantity: number; price: number; startCount?: number | null; endCount?: number | null; notes?: string | null }
interface Order { id: string; user: { name: string; email: string }; status: string; totalPrice: number; paymentMethod: string | null; paymentMethodName: string; createdAt: string; paymentProof: string | null; items: OrderItem[]; adminNote?: string | null; completionFile?: string | null }

const statusOptions = ["ALL", "PENDING_PAYMENT", "PROCESSING", "PROGRESS", "PARTIAL", "COMPLETED", "CANCELLED"]
const sortOptions = [{ value: "newest", label: "Terbaru" }, { value: "oldest", label: "Terlama" }, { value: "highest", label: "Total Tertinggi" }, { value: "lowest", label: "Total Terendah" }]
const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState("newest")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [page, setPage] = useState(1)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [modalStatus, setModalStatus] = useState<string>("")
  const [completionReason, setCompletionReason] = useState("")
  const [completionFile, setCompletionFile] = useState<File | null>(null)
  const [targetOrderId, setTargetOrderId] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editStartCount, setEditStartCount] = useState<number | null>(null)
  const [editEndCount, setEditEndCount] = useState<number | null>(null)

  const params = new URLSearchParams()
  params.set("page", String(page)); params.set("limit", "20"); params.set("sort", sortBy)
  if (statusFilter !== "ALL") params.set("status", statusFilter)
  if (searchTerm.trim()) params.set("search", searchTerm.trim())
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)

  const { data, error, isLoading, mutate } = useSWR(`/api/admin/orders?${params.toString()}`, fetcher)
  const orders: Order[] = data?.orders || []
  const totalPages = data?.pagination?.totalPages || 1; const totalOrders = data?.pagination?.total || 0

  const handleSearch = () => setPage(1)
  const updateStatus = async (orderId: string, newStatus: string) => {
    if (["COMPLETED", "PARTIAL", "CANCELLED", "PROGRESS"].includes(newStatus)) { setTargetOrderId(orderId); setModalStatus(newStatus); setCompletionReason(""); setCompletionFile(null); setShowCompletionModal(true) }
    else { await doUpdateStatus(orderId, newStatus, "") }
  }
  const doUpdateStatus = async (orderId: string, status: string, reason: string, fileUrl?: string) => { await fetch("/api/admin/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status, reason, completionFile: fileUrl || null }) }); mutate() }
  const handleCompletionSubmit = async () => {
    if (!completionReason.trim()) return alert("Alasan wajib diisi")
    let fileUrl = ""
    if (completionFile) { setUploading(true); const formData = new FormData(); formData.append("file", completionFile); const res = await fetch("/api/admin/orders/upload-completion", { method: "POST", body: formData }); const data = await res.json(); if (data.url) fileUrl = data.url; setUploading(false) }
    await doUpdateStatus(targetOrderId, modalStatus, completionReason, fileUrl); setShowCompletionModal(false)
  }
  const handleSaveItemCounts = async (itemId: string) => { await fetch("/api/admin/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: orders.find(o => o.items.some(i => i.id === itemId))?.id, itemUpdates: [{ itemId, startCount: editStartCount, endCount: editEndCount }] }) }); setEditingItemId(null); mutate() }
  const handleExport = () => window.open("/api/admin/orders/export", "_blank")

  const statusColors: Record<string, string> = { PENDING_PAYMENT: "bg-yellow-500", PROCESSING: "bg-blue-500", PROGRESS: "bg-purple-500", PARTIAL: "bg-orange-500", COMPLETED: "bg-green-500", CANCELLED: "bg-red-500" }
  const modalTitle = modalStatus === "COMPLETED" ? "Selesaikan Pesanan" : modalStatus === "PARTIAL" ? "Pesanan Partial" : modalStatus === "PROGRESS" ? "Pesanan Dalam Progress" : modalStatus === "CANCELLED" ? "Batalkan Pesanan" : "Update Pesanan"
  const reasonBoxStyle = (status: string) => { switch (status) { case "COMPLETED": return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"; case "PARTIAL": return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700"; case "PROGRESS": return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"; case "CANCELLED": return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"; default: return "" } }

  return (
    <div>
      <div className="flex justify-between items-center mb-6"><h2 className="font-heading text-2xl font-bold">Manajemen Pesanan ({totalOrders})</h2><button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full"><Download size={16} /> Export CSV</button></div>
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]"><label className="block text-sm mb-1">Cari</label><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="Ketik..." className="border rounded px-3 py-2 w-full bg-transparent" /></div>
        <div><label className="block text-sm mb-1">Status</label><select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="border rounded px-3 py-2 bg-transparent">{statusOptions.map(s => <option key={s} value={s}>{s === "ALL" ? "Semua" : s}</option>)}</select></div>
        <div><label className="block text-sm mb-1">Urutkan</label><select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }} className="border rounded px-3 py-2 bg-transparent">{sortOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
        <div><label className="block text-sm mb-1">Tgl Mulai</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-3 py-2 bg-transparent" /></div>
        <div><label className="block text-sm mb-1">Tgl Akhir</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-3 py-2 bg-transparent" /></div>
        <button onClick={handleSearch} className="bg-primary text-white px-4 py-2 rounded-full">Cari</button>
        <button onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setSortBy("newest"); setStartDate(""); setEndDate(""); setPage(1) }} className="border px-4 py-2 rounded-full">Reset</button>
      </div>
      {isLoading ? <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div> :
       error ? <p className="text-center text-red-500 py-12">Gagal memuat data.</p> :
       orders.length === 0 ? <p className="text-center py-12 text-gray-500">Tidak ada pesanan.</p> :
       <><div className="space-y-4 overflow-x-auto">
          {orders.map(order => (
            <div key={order.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex justify-between items-center mb-2"><div><span className="font-semibold">Order #Exha{order.id.slice(-6).toUpperCase()}</span><p className="text-sm text-gray-500">{order.user.name} ({order.user.email})</p><span className="inline-block mt-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">Metode: {order.paymentMethodName || "Tidak diketahui"}</span></div><span className={`px-2 py-1 rounded-full text-xs text-white ${statusColors[order.status]}`}>{order.status}</span></div>
              {order.adminNote && <div className={`mt-2 border rounded-lg p-3 ${reasonBoxStyle(order.status)}`}><p className="text-sm font-medium">Catatan Admin:</p><p className="text-sm text-gray-700 dark:text-gray-300">{order.adminNote}</p>{order.completionFile && <a href={order.completionFile} target="_blank" className="inline-block mt-2 text-xs text-primary hover:underline">📎 Lihat File</a>}</div>}
              <div className="mt-2 space-y-3">{order.items.map(item => (<div key={item.id} className="text-sm border-t pt-2"><p className="font-medium">{item.service.name}</p><p className="text-xs text-gray-500">Jumlah: <strong>{item.quantity}</strong></p><p className="text-xs text-gray-500">Target: {item.targetLink}</p>{item.notes && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">📝 {item.notes}</p>}<p className="text-right font-semibold">{formatCurrency(item.price)}</p></div>))}</div>
              {order.paymentProof && <div className="mt-2 flex items-center gap-2"><span className="text-sm text-gray-500">Bukti:</span><img src={order.paymentProof} alt="Bukti" className="w-12 h-12 object-cover rounded cursor-pointer border" onClick={() => setPreviewUrl(order.paymentProof)} /></div>}
              <div className="flex justify-between items-center mt-2"><span className="font-semibold">Total: {formatCurrency(order.totalPrice)}</span><div className="flex items-center gap-2"><span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString("id-ID")}</span><select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} className="border rounded px-2 py-1 bg-transparent text-sm">{statusOptions.filter(s => s !== "ALL").map(s => <option key={s} value={s}>{s}</option>)}</select></div></div>
            </div>
          ))}
        </div>
        {totalPages > 1 && <div className="flex justify-center items-center gap-2 mt-6"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 border rounded-full disabled:opacity-50"><ChevronLeft size={18} /></button><span className="text-sm text-gray-500">{page} / {totalPages}</span><button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 border rounded-full disabled:opacity-50"><ChevronRight size={18} /></button></div>}
      </>}
      {showCompletionModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-background rounded-xl p-6 w-full max-w-md"><h3 className="font-heading font-semibold mb-4">{modalTitle}</h3><textarea value={completionReason} onChange={e => setCompletionReason(e.target.value)} placeholder="Alasan..." rows={3} className="border rounded px-3 py-2 w-full mb-4 bg-transparent" /><input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setCompletionFile(e.target.files?.[0] || null)} className="mb-4" />{uploading && <p className="text-sm text-blue-500 mb-2">Mengupload...</p>}<div className="flex gap-2 justify-end"><button onClick={() => setShowCompletionModal(false)} className="border px-4 py-2 rounded-full">Batal</button><button onClick={handleCompletionSubmit} disabled={uploading} className="bg-primary text-white px-4 py-2 rounded-full disabled:opacity-50">Simpan</button></div></div></div>)}
      {previewUrl && (<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setPreviewUrl(null)}><button className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-1" onClick={() => setPreviewUrl(null)}><X size={24} /></button>{previewUrl.endsWith(".pdf") ? <iframe src={previewUrl} className="w-[80vw] h-[80vh]" /> : <img src={previewUrl} alt="Preview" className="max-w-full max-h-[80vh] rounded-lg" />}</div>)}
    </div>
  )
}
