"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Eye, LogIn } from "lucide-react"
import InfoBanner from "@/components/InfoBanner"

export default function AvailableJobsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetail, setShowDetail] = useState<any>(null)
  const [claimForm, setClaimForm] = useState({ name: "", quantity: 1, note: "" })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user?.role !== "TALENT") { router.push("/login"); return }
    fetchJobs()
  }, [status])

  const fetchJobs = async () => {
    setLoading(true)
    const res = await fetch("/api/talent/open-jobs")
    const data = await res.json()
    setJobs(data.jobs || [])
    setLoading(false)
  }

  const openDetail = async (job: any) => {
    const res = await fetch(`/api/talent/jobs/${job.id}`)
    const data = await res.json()
    setShowDetail(data.job)
    setClaimForm({ name: session?.user?.name || "", quantity: 1, note: "" })
  }

  const handleClaim = async () => {
    if (!showDetail) return
    if (!confirm(`Klaim ${claimForm.quantity} unit job ini?`)) return
    const res = await fetch(`/api/talent/jobs/${showDetail.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "claim", ...claimForm }) })
    const data = await res.json()
    if (data.error) alert(data.error)
    else { alert("Berhasil mengklaim!"); setShowDetail(null); fetchJobs() }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ color: "#4A0E2E" }}>Job Tersedia</h1>
      <InfoBanner id="talent-available">
        🔍 <strong>Job Tersedia</strong> menampilkan job yang belum diambil atau masih ada sisa unit. Klik ikon mata untuk melihat detail, termasuk link target dan link GDrive.
      </InfoBanner>
      {loading ? <p>Memuat...</p> : jobs.length === 0 ? <div className="text-center py-12 rounded-xl" style={{ backgroundColor: "#F5E6D3" }}><p style={{ color: "#6B1D40" }}>Belum ada job tersedia.</p></div> : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="rounded-xl p-4 flex justify-between items-start shadow" style={{ backgroundColor: "#F5E6D3", border: "1px solid #D4B896" }}>
              <div className="flex-1"><h3 className="font-semibold" style={{ color: "#4A0E2E" }}>{job.title}</h3>{job.quantity && <p className="text-sm" style={{ color: "#6B1D40" }}>Total: {job.quantity} unit</p>}{job.price && <p className="text-sm" style={{ color: "#6B1D40" }}>Harga: Rp {job.price.toLocaleString()} / unit</p>}<p className="text-xs" style={{ color: "#D4B896" }}>Dibuat oleh: {job.admin?.name}</p></div>
              <button onClick={() => openDetail(job)} className="p-1" style={{ color: "#800020" }}><Eye size={16} /></button>
            </div>
          ))}
        </div>
      )}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#FAF7F2", border: "2px solid #C9A96E" }}>
          <h3 className="font-semibold mb-4 text-xl" style={{ color: "#4A0E2E" }}>{showDetail.title}</h3>
          <div className="space-y-2 text-sm mb-4">
            <p><strong>Total Unit:</strong> {showDetail.quantity}</p><p><strong>Harga per Unit:</strong> Rp {showDetail.price?.toLocaleString() || "-"}</p>
            <p><strong>Sisa Kuota:</strong> {showDetail.remaining} unit</p><p><strong>Sudah Diklaim:</strong> {showDetail.totalClaimed} unit</p>
            {showDetail.description && <p><strong>Deskripsi:</strong> {showDetail.description}</p>}
            {showDetail.targetLink && <p><strong>Link Target:</strong> <a href={showDetail.targetLink} target="_blank" style={{ color: "#800020", textDecoration: "underline" }}>{showDetail.targetLink}</a></p>}
            {showDetail.deadline && <p><strong>Deadline:</strong> {new Date(showDetail.deadline).toLocaleString("id-ID")}</p>}
            {showDetail.gdriveLink && <p><strong>GDrive:</strong> <a href={showDetail.gdriveLink} target="_blank" style={{ color: "#800020" }}>Buka</a></p>}
            {showDetail.claims?.length > 0 && <div className="mt-3"><p className="font-medium">Yang Sudah Klaim:</p><ul className="text-xs space-y-1">{showDetail.claims.filter((c: any) => c.status !== "CANCELLED").map((c: any) => (<li key={c.id}>{c.name || c.user?.name} — {c.quantity} unit</li>))}</ul></div>}
          </div>
          {showDetail.remaining > 0 && (
            <div className="border-t pt-4 mt-4" style={{ borderColor: "#D4B896" }}>
              <p className="font-medium mb-2">Ambil Job Ini</p>
              <p className="text-xs mb-3" style={{ color: "#6B1D40" }}>Isi form di bawah. <strong>Nama/Username</strong> akan ditampilkan ke admin. <strong>Jumlah Unit</strong> minimal 1, maksimal sesuai sisa kuota. <strong>Catatan</strong> opsional.</p>
              <div className="space-y-2">
                <input placeholder="Nama/Username Anda" value={claimForm.name} onChange={e => setClaimForm({ ...claimForm, name: e.target.value })} className="border rounded px-3 py-2 w-full text-sm" style={{ borderColor: "#D4B896" }} />
                <input type="number" min={1} max={showDetail.remaining} value={claimForm.quantity} onChange={e => setClaimForm({ ...claimForm, quantity: parseInt(e.target.value) || 1 })} className="border rounded px-3 py-2 w-full text-sm" style={{ borderColor: "#D4B896" }} />
                <textarea placeholder="Catatan (opsional)" value={claimForm.note} onChange={e => setClaimForm({ ...claimForm, note: e.target.value })} className="border rounded px-3 py-2 w-full text-sm" style={{ borderColor: "#D4B896" }} />
                <button onClick={handleClaim} className="px-4 py-2 rounded-full text-white" style={{ backgroundColor: "#800020" }}>Klaim Sekarang</button>
              </div>
            </div>
          )}
          <button onClick={() => setShowDetail(null)} className="mt-4 border px-4 py-2 rounded-full w-full">Tutup</button>
        </div></div>
      )}
    </div>
  )
}
