"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Eye, Send, Plus, XCircle } from "lucide-react"
import InfoBanner from "@/components/InfoBanner"
import confetti from "canvas-confetti"

export default function MyJobsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [showDetail, setShowDetail] = useState<any>(null)
  const [submitNote, setSubmitNote] = useState("")
  const [addQuantity, setAddQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [showAddUnits, setShowAddUnits] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user?.role !== "TALENT") { router.push("/login"); return }
    fetchJobs()
  }, [status, statusFilter])

  const fetchJobs = async () => {
    setLoading(true)
    const params = statusFilter ? `?status=${statusFilter}` : ""
    const res = await fetch(`/api/talent/jobs${params}`)
    const data = await res.json()
    const jobsWithClaims = await Promise.all(
      (data.jobs || []).map(async (job: any) => {
        const detailRes = await fetch(`/api/talent/jobs/${job.id}`)
        const detailData = await detailRes.json()
        return detailData.job || job
      })
    )
    setJobs(jobsWithClaims)
    setLoading(false)
  }

  const fireConfetti = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#800020", "#C9A96E", "#D4B896", "#4A0E2E"] })
    setTimeout(() => confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 }, colors: ["#C9A96E", "#F5E6D3"] }), 200)
  }

  const handleSubmit = async () => {
    if (!showDetail) return
    setSubmitting(true)
    const res = await fetch(`/api/talent/jobs/${showDetail.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit", submitNote }) })
    if (res.ok) { fireConfetti() }
    setSubmitting(false); setShowDetail(null); setSubmitNote(""); fetchJobs()
  }

  const handleAddUnits = async () => {
    if (!showDetail) return
    setSubmitting(true)
    await fetch(`/api/talent/jobs/${showDetail.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_units", quantity: addQuantity }) })
    setSubmitting(false); setShowAddUnits(false); setAddQuantity(1); fetchJobs()
  }

  const handleCancelClaim = async (jobId: string) => {
    if (!confirm("Batalkan klaim Anda pada job ini?")) return
    await fetch(`/api/talent/jobs/${jobId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel_claim" }) })
    fetchJobs(); setShowDetail(null)
  }

  const statusColors: Record<string, string> = { CLAIMED: "bg-blue-100 text-blue-700", SUBMITTED: "bg-yellow-100 text-yellow-700", REJECTED: "bg-red-100 text-red-700", COMPLETED: "bg-green-100 text-green-700", CANCELLED: "bg-gray-100 text-gray-700", DRAFT: "bg-gray-100 text-gray-700", IN_PROGRESS: "bg-blue-100 text-blue-700", REVISION: "bg-orange-100 text-orange-700" }
  const statusLabel: Record<string, string> = { CLAIMED: "Diklaim", SUBMITTED: "Submitted", REJECTED: "Ditolak", COMPLETED: "Selesai", CANCELLED: "Dibatalkan", DRAFT: "Draft", IN_PROGRESS: "In Progress", REVISION: "Revisi" }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ color: "#4A0E2E" }}>Tugas Saya</h1>
      <InfoBanner id="talent-my-jobs">
        📋 <strong>Tugas Saya</strong> menampilkan semua job yang sudah kamu klaim. Klik ikon mata untuk melihat detail, termasuk link target, submit hasil, tambah unit, atau batalkan klaim.
      </InfoBanner>
      <div className="flex gap-2 mb-4">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-3 py-2 text-sm" style={{ backgroundColor: "#FAF7F2", borderColor: "#D4B896", color: "#4A0E2E" }}>
          <option value="">Semua Status</option><option value="IN_PROGRESS">In Progress</option><option value="SUBMITTED">Submitted</option><option value="REVISION">Revisi</option><option value="COMPLETED">Selesai</option>
        </select>
      </div>
      {loading ? <p>Memuat...</p> : jobs.length === 0 ? <div className="text-center py-12 rounded-xl" style={{ backgroundColor: "#F5E6D3" }}><p style={{ color: "#6B1D40" }}>Belum ada tugas.</p></div> : (
        <div className="space-y-4">
          {jobs.map(job => {
            const myClaim = job.claims?.find((c: any) => c.userId === (session?.user as any)?.id)
            return (
              <div key={job.id} className="rounded-xl p-4 flex justify-between items-start shadow" style={{ backgroundColor: "#F5E6D3", border: "1px solid #D4B896" }}>
                <div className="flex-1"><h3 className="font-semibold" style={{ color: "#4A0E2E" }}>{job.title}</h3><p className="text-sm" style={{ color: "#6B1D40" }}>Unit Anda: <strong>{myClaim?.quantity || 0}</strong> dari {job.quantity}</p><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[myClaim?.status || "CLAIMED"]}`}>{statusLabel[myClaim?.status || "CLAIMED"]}</span></div>
                <button onClick={() => { setShowDetail(job); setSubmitNote(""); setAddQuantity(1); setShowAddUnits(false) }} className="p-1" style={{ color: "#800020" }}><Eye size={16} /></button>
              </div>
            )
          })}
        </div>
      )}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#FAF7F2", border: "2px solid #C9A96E" }}>
          <h3 className="font-semibold mb-4 text-xl" style={{ color: "#4A0E2E" }}>{showDetail.title}</h3>
          <div className="space-y-2 text-sm mb-4">
            <p><strong>Total Unit Job:</strong> {showDetail.quantity}</p>
            <p><strong>Unit Anda:</strong> {showDetail.claims?.find((c: any) => c.userId === (session?.user as any)?.id)?.quantity || 0}</p>
            <p><strong>Status Klaim Anda:</strong> <span className={statusColors[showDetail.claims?.find((c: any) => c.userId === (session?.user as any)?.id)?.status || "CLAIMED"]}>{statusLabel[showDetail.claims?.find((c: any) => c.userId === (session?.user as any)?.id)?.status || "CLAIMED"]}</span></p>
            {showDetail.description && <p><strong>Deskripsi:</strong> {showDetail.description}</p>}
            {showDetail.targetLink && <p><strong>Link Target:</strong> <a href={showDetail.targetLink} target="_blank" style={{ color: "#800020", textDecoration: "underline" }}>{showDetail.targetLink}</a></p>}
            {showDetail.deadline && <p><strong>Deadline:</strong> {new Date(showDetail.deadline).toLocaleString("id-ID")}</p>}
            {showDetail.gdriveLink && <p><strong>GDrive:</strong> <a href={showDetail.gdriveLink} target="_blank" style={{ color: "#800020" }}>Buka</a></p>}
            {showDetail.claims?.length > 0 && <div className="mt-3"><p className="font-medium">Semua Klaim:</p><ul className="text-xs space-y-1">{showDetail.claims.filter((c: any) => c.status !== "CANCELLED").map((c: any) => (<li key={c.id}>{c.name || c.user?.name} — {c.quantity} unit — {statusLabel[c.status]}{c.adminNote && <span className="text-red-500"> [Catatan: {c.adminNote}]</span>}</li>))}</ul></div>}
          </div>
          {(showDetail.claims?.find((c: any) => c.userId === (session?.user as any)?.id)?.status === "CLAIMED" && !showAddUnits) && (
            <div className="border-t pt-4 mt-4" style={{ borderColor: "#D4B896" }}>
              <p className="text-sm font-medium mb-2">Selesaikan Tugas</p>
              <textarea placeholder="Catatan..." value={submitNote} onChange={e => setSubmitNote(e.target.value)} className="border rounded px-3 py-2 w-full mb-3 text-sm" style={{ backgroundColor: "#FAF7F2", borderColor: "#D4B896" }} rows={2} />
              <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 rounded-full text-white mr-2" style={{ backgroundColor: "#800020" }}><Send size={16} /> Selesai & Submit</button>
              {showDetail.remaining > 0 && <button onClick={() => setShowAddUnits(true)} className="px-4 py-2 rounded-full" style={{ border: "1px solid #800020", color: "#800020" }}><Plus size={16} /> Tambah Unit</button>}
              <button onClick={() => handleCancelClaim(showDetail.id)} className="px-4 py-2 rounded-full ml-2" style={{ border: "1px solid #EF4444", color: "#EF4444" }}><XCircle size={16} /> Batalkan Klaim</button>
            </div>
          )}
          {showAddUnits && (
            <div className="border-t pt-4 mt-4" style={{ borderColor: "#D4B896" }}>
              <p className="text-sm font-medium mb-2">Tambah Unit</p>
              <p className="text-xs mb-2" style={{ color: "#6B1D40" }}>Sisa kuota: {showDetail.remaining} unit. Masukkan jumlah unit tambahan (min 1).</p>
              <input type="number" min={1} max={showDetail.remaining} value={addQuantity} onChange={e => setAddQuantity(parseInt(e.target.value) || 1)} className="border rounded px-3 py-2 w-full mb-3 text-sm" style={{ backgroundColor: "#FAF7F2", borderColor: "#D4B896" }} />
              <button onClick={handleAddUnits} disabled={submitting} className="px-4 py-2 rounded-full text-white mr-2" style={{ backgroundColor: "#800020" }}>Simpan</button>
              <button onClick={() => setShowAddUnits(false)} className="px-4 py-2 rounded-full" style={{ border: "1px solid #D4B896", color: "#4A0E2E" }}>Batal</button>
            </div>
          )}
          <button onClick={() => setShowDetail(null)} className="mt-4 border px-4 py-2 rounded-full w-full">Tutup</button>
        </div></div>
      )}
    </div>
  )
}
