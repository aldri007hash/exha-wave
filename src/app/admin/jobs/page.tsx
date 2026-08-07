"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Eye, CheckCircle, RotateCcw, UserCheck, XCircle as XCircleIcon, X, Ban } from "lucide-react"

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [talents, setTalents] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: "", description: "", priority: "MEDIUM", deadline: "",
    assignedTo: "", orderId: "", gdriveLink: "", quantity: "", price: "", targetLink: ""
  })
  const [saving, setSaving] = useState(false)
  const [showDetail, setShowDetail] = useState<any>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectClaimId, setRejectClaimId] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelClaimId, setCancelClaimId] = useState<string | null>(null)
  const [cancelNote, setCancelNote] = useState("")

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set("status", statusFilter)
    const res = await fetch(`/api/admin/jobs?${params}`)
    const data = await res.json()
    setJobs(data.jobs || [])
    setTalents(data.talents || [])
    setOrders(data.orders || [])
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [statusFilter])

  const openDetail = async (job: any) => {
    const res = await fetch(`/api/admin/jobs/${job.id}`)
    const data = await res.json()
    setShowDetail(data.job)
  }

  const handleOrderChange = (orderId: string) => {
    if (!orderId) { setForm({ ...form, orderId: "", title: "", targetLink: "", quantity: "" }); return }
    const order = orders.find((o: any) => o.id === orderId)
    if (!order) return
    const firstItem = order.items?.[0]
    const platformName = firstItem?.service?.platform?.name || ""
    const serviceName = firstItem?.service?.name || ""
    const autoTitle = platformName && serviceName ? `${platformName} - ${serviceName}` : form.title
    const totalUnits = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0
    const linkTarget = firstItem?.targetLink || ""
    setForm({ ...form, orderId, title: autoTitle, targetLink: linkTarget, quantity: totalUnits.toString() })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await fetch("/api/admin/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, quantity: form.quantity ? parseInt(form.quantity) : null, price: form.price ? parseInt(form.price) : null }) })
    setForm({ title: "", description: "", priority: "MEDIUM", deadline: "", assignedTo: "", orderId: "", gdriveLink: "", quantity: "", price: "", targetLink: "" })
    setShowForm(false)
    fetchData()
    setSaving(false)
  }

  const handleApproveClaim = async (claimId: string) => {
    await fetch(`/api/admin/jobs/${showDetail.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve_claim", claimId }) })
    openDetail(showDetail); fetchData()
  }

  const handleRejectClaim = async () => {
    if (!rejectClaimId || !rejectNote.trim()) return
    await fetch(`/api/admin/jobs/${showDetail.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject_claim", claimId: rejectClaimId, adminNote: rejectNote }) })
    setShowRejectModal(false); setRejectClaimId(null); setRejectNote("")
    openDetail(showDetail); fetchData()
  }

  const handleCancelClaim = async () => {
    if (!cancelClaimId || !cancelNote.trim()) return
    await fetch(`/api/admin/jobs/${showDetail.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel_claim", claimId: cancelClaimId, adminNote: cancelNote }) })
    setShowCancelModal(false); setCancelClaimId(null); setCancelNote("")
    openDetail(showDetail); fetchData()
  }

  const handleApprove = async (id: string) => { await fetch(`/api/admin/jobs/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve" }) }); fetchData() }
  const handleRevision = async (id: string) => { const note = prompt("Catatan revisi:"); if (!note) return; await fetch(`/api/admin/jobs/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revision", revisionNote: note }) }); fetchData() }
  const handleCancel = async (id: string) => { if (!confirm("Hapus job ini?")) return; await fetch(`/api/admin/jobs/${id}`, { method: "DELETE" }); fetchData() }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">Manajemen Job / Tugas</h1><button onClick={() => setShowForm(true)} className="bg-primary text-white px-4 py-2 rounded-full"><Plus size={18} /> Tambah Job</button></div>
      <div className="flex gap-2 mb-4"><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-3 py-2 bg-transparent text-sm"><option value="">Semua</option><option value="DRAFT">Draft</option><option value="IN_PROGRESS">In Progress</option><option value="SUBMITTED">Submitted</option><option value="COMPLETED">Selesai</option></select></div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-background rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"><h3 className="font-semibold mb-4">Tambah Job Baru</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><label className="text-xs text-gray-500">Pilih Order ID (Status Progress)</label><select value={form.orderId} onChange={e => handleOrderChange(e.target.value)} className="border rounded px-3 py-2 w-full bg-transparent"><option value="">Pilih Order ID</option>{orders.map((o: any) => (<option key={o.id} value={o.id}>Exha{o.id.slice(-6).toUpperCase()} - {o.user?.name} ({o.items?.reduce((s: number, i: any) => s + i.quantity, 0)} unit)</option>))}</select></div>
            <input placeholder="Judul Job *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="border rounded px-3 py-2 w-full bg-transparent" required />
            <textarea placeholder="Deskripsi / Brief" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border rounded px-3 py-2 w-full bg-transparent" rows={3} />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="border rounded px-3 py-2 bg-transparent"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select>
              <input type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="border rounded px-3 py-2 bg-transparent" />
            </div>
            <div><label className="text-xs text-gray-500">Link Target {form.orderId ? '(otomatis)' : ''}</label><input type="text" placeholder="Link Target" value={form.targetLink} onChange={e => setForm({...form, targetLink: e.target.value})} className="border rounded px-3 py-2 w-full bg-transparent" readOnly={!!form.orderId} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500">Jumlah Unit {form.orderId ? '(otomatis)' : ''}</label><input type="number" placeholder="Jumlah Unit" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="border rounded px-3 py-2 w-full bg-transparent" readOnly={!!form.orderId} /></div>
              <div><label className="text-xs text-gray-500">Harga per Unit (Rp)</label><input type="number" placeholder="Harga per Unit" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="border rounded px-3 py-2 w-full bg-transparent" /></div>
            </div>
            <select value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} className="border rounded px-3 py-2 w-full bg-transparent"><option value="">Open Pool</option>{talents.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <input placeholder="Link Google Drive" value={form.gdriveLink} onChange={e => setForm({...form, gdriveLink: e.target.value})} className="border rounded px-3 py-2 w-full bg-transparent" />
            <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-full">Batal</button><button type="submit" disabled={saving} className="bg-primary text-white px-4 py-2 rounded-full">{saving?"Menyimpan...":"Simpan"}</button></div>
          </form></div></div>
      )}

      {/* POPUP DETAIL */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-background rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div className="flex justify-between mb-4"><h3 className="font-semibold text-xl">{showDetail.title}</h3><button onClick={() => setShowDetail(null)}><X size={20} /></button></div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4"><p><strong>Total Unit:</strong> {showDetail.quantity}</p><p><strong>Harga/Unit:</strong> Rp {showDetail.price?.toLocaleString() || "-"}</p><p><strong>Deadline:</strong> {showDetail.deadline?new Date(showDetail.deadline).toLocaleString("id-ID"):"-"}</p></div>
          <div className="border-t pt-4"><h4 className="font-semibold mb-2">Daftar Klaim</h4>
            {showDetail.claims?.length>0 ? showDetail.claims.map((c:any)=>(
              <div key={c.id} className="flex justify-between bg-card border rounded-lg p-3 mb-2">
                <div>
                  <p className="font-medium">{c.name||c.user?.name}</p>
                  <p className="text-xs">{c.quantity} unit · {c.status}{c.note&&` · ${c.note}`}{c.adminNote&&<span className="text-red-500"> · Admin: {c.adminNote}</span>}</p>
                </div>
                <div className="flex gap-2">
                  {c.status==="SUBMITTED" && (
                    <>
                      <button onClick={()=>handleApproveClaim(c.id)} className="text-green-500" title="Setujui"><CheckCircle size={18}/></button>
                      <button onClick={()=>{setRejectClaimId(c.id);setRejectNote("");setShowRejectModal(true)}} className="text-red-500" title="Tolak"><XCircleIcon size={18}/></button>
                    </>
                  )}
                  {(c.status==="CLAIMED" || c.status==="SUBMITTED") && (
                    <button onClick={()=>{setCancelClaimId(c.id);setCancelNote("");setShowCancelModal(true)}} className="text-gray-400 hover:text-gray-600" title="Batalkan Klaim"><Ban size={18}/></button>
                  )}
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">Belum ada klaim.</p>}
          </div>
          <div className="flex gap-2 mt-4">{showDetail.status==="SUBMITTED"&&<><button onClick={()=>handleApprove(showDetail.id)} className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">Approve Semua</button><button onClick={()=>handleRevision(showDetail.id)} className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">Revisi</button></>}<button onClick={()=>{handleCancel(showDetail.id);setShowDetail(null)}} className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">Hapus</button></div></div></div>
      )}

      {/* MODAL TOLAK */}
      {showRejectModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"><div className="bg-background rounded-xl p-6 w-full max-w-md"><h3 className="font-semibold mb-4">Tolak Klaim</h3><textarea placeholder="Alasan penolakan..." value={rejectNote} onChange={e=>setRejectNote(e.target.value)} className="border rounded px-3 py-2 w-full mb-4 bg-transparent" rows={3}/><div className="flex gap-2 justify-end"><button onClick={()=>setShowRejectModal(false)} className="border px-4 py-2 rounded-full">Batal</button><button onClick={handleRejectClaim} className="bg-red-500 text-white px-4 py-2 rounded-full">Tolak</button></div></div></div>)}

      {/* MODAL BATALKAN KLAIM */}
      {showCancelModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"><div className="bg-background rounded-xl p-6 w-full max-w-md"><h3 className="font-semibold mb-4">Batalkan Klaim Talent</h3><p className="text-sm text-gray-500 mb-2">Klaim akan dibatalkan dan unit dikembalikan ke kuota.</p><textarea placeholder="Alasan pembatalan (wajib)..." value={cancelNote} onChange={e=>setCancelNote(e.target.value)} className="border rounded px-3 py-2 w-full mb-4 bg-transparent" rows={3}/><div className="flex gap-2 justify-end"><button onClick={()=>setShowCancelModal(false)} className="border px-4 py-2 rounded-full">Batal</button><button onClick={handleCancelClaim} className="bg-gray-500 text-white px-4 py-2 rounded-full">Batalkan Klaim</button></div></div></div>)}

      {/* DAFTAR JOB */}
      {loading?<p className="text-center py-12">Memuat...</p>:jobs.length===0?<p className="text-center py-12 text-gray-500">Belum ada job.</p>:(
        <div className="space-y-4">{jobs.map(job=>(<div key={job.id} className="bg-card border rounded-xl p-4"><div className="flex justify-between"><div><h3 className="font-semibold">{job.title}</h3><div className="flex gap-2 mt-1"><span className={`px-2 py-0.5 rounded-full text-xs ${job.status==="DRAFT"?"bg-gray-100":job.status==="IN_PROGRESS"?"bg-blue-100":job.status==="SUBMITTED"?"bg-yellow-100":"bg-green-100"}`}>{job.status}</span>{job.quantity&&<span className="text-xs text-gray-500">Jumlah: {job.quantity}</span>}{job.price&&<span className="text-xs text-gray-500">Rp {job.price}/unit</span>}</div></div><div className="flex gap-2"><button onClick={()=>openDetail(job)} className="p-1 text-primary"><Eye size={16}/></button><button onClick={()=>handleCancel(job.id)} className="p-1 text-red-500"><Trash2 size={16}/></button></div></div></div>))}</div>
      )}
    </div>
  )
}
