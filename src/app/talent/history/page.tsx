"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"
import InfoBanner from "@/components/InfoBanner"

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetail, setShowDetail] = useState<any>(null)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user?.role !== "TALENT") { router.push("/login"); return }
    fetchJobs()
  }, [status])

  const fetchJobs = async () => {
    setLoading(true)
    const res = await fetch("/api/talent/jobs?status=COMPLETED")
    const data = await res.json()
    setJobs(data.jobs || [])
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ color: "#4A0E2E" }}>Riwayat Job</h1>
      <InfoBanner id="talent-history">
        📜 <strong>Riwayat</strong> menampilkan daftar job yang sudah selesai kamu kerjakan dan disetujui admin. Klik ikon mata untuk melihat detail job.
      </InfoBanner>
      {loading ? <p className="text-center py-12" style={{ color: "#6B1D40" }}>Memuat...</p> : jobs.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ backgroundColor: "#F5E6D3", border: "1px solid #D4B896" }}><p style={{ color: "#6B1D40" }}>Belum ada riwayat job selesai.</p></div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="rounded-xl p-4 flex justify-between items-start shadow" style={{ backgroundColor: "#F5E6D3", border: "1px solid #D4B896" }}>
              <div className="flex-1"><h3 className="font-semibold" style={{ color: "#4A0E2E" }}>{job.title}</h3><p className="text-xs" style={{ color: "#D4B896" }}>Dibuat oleh: {job.admin?.name}</p></div>
              <button onClick={() => setShowDetail(job)} className="p-1 ml-2 flex-shrink-0" style={{ color: "#800020" }}><Eye size={16} /></button>
            </div>
          ))}
        </div>
      )}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#FAF7F2", border: "2px solid #C9A96E" }}>
          <h3 className="font-semibold mb-4 text-xl" style={{ color: "#4A0E2E" }}>{showDetail.title}</h3>
          <div className="space-y-2 text-sm"><p><strong>Prioritas:</strong> {showDetail.priority}</p>{showDetail.description && <p><strong>Deskripsi:</strong> {showDetail.description}</p>}</div>
          <button onClick={() => setShowDetail(null)} className="mt-4 border px-4 py-2 rounded-full w-full">Tutup</button>
        </div></div>
      )}
    </div>
  )
}
