"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Briefcase, Clock, CheckCircle, DollarSign } from "lucide-react"
import InfoBanner from "@/components/InfoBanner"
import TalentParticles from "@/components/TalentParticles"

export default function TalentDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({ active: 0, completed: 0, earnings: 0, totalUnits: 0 })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") { router.push("/login"); return }
    if (session?.user?.role !== "TALENT") { router.push("/login"); return }
    fetchStats()
  }, [status])

  const fetchStats = async () => {
    const [jobsRes, earningsRes] = await Promise.all([
      fetch("/api/talent/jobs"),
      fetch("/api/talent/earnings"),
    ])
    const jobsData = await jobsRes.json()
    const earningsData = await earningsRes.json()
    const jobs = jobsData.jobs || []
    setStats({
      active: jobs.filter((j: any) => ["IN_PROGRESS", "SUBMITTED", "REVISION"].includes(j.status)).length,
      completed: jobs.filter((j: any) => j.status === "COMPLETED").length,
      earnings: earningsData.totalEarnings || 0,
      totalUnits: earningsData.totalUnits || 0,
    })
  }

  return (
    <div className="max-w-4xl mx-auto relative">
      <TalentParticles />
      <div className="relative z-10">
        <h1 className="text-3xl font-bold mb-6" style={{ color: "#4A0E2E" }}>Dashboard Talent</h1>
        <InfoBanner id="talent-dashboard">
          📊 <strong>Dashboard</strong> adalah halaman ringkasan. Di sini kamu bisa melihat jumlah job aktif, job selesai, total unit, dan penghasilanmu.
        </InfoBanner>
        <p className="text-sm mb-6" style={{ color: "#6B1D40" }}>
          Selamat datang, {session?.user?.name}! Berikut ringkasan aktivitas dan penghasilan Anda.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl p-4 shadow" style={{ backgroundColor: "#F5E6D3", border: "1px solid #D4B896" }}>
            <div className="flex items-center gap-2"><Briefcase size={22} style={{ color: "#800020" }} /><div><p className="text-xs" style={{ color: "#6B1D40" }}>Job Aktif</p><p className="text-2xl font-bold" style={{ color: "#4A0E2E" }}>{stats.active}</p></div></div>
          </div>
          <div className="rounded-xl p-4 shadow" style={{ backgroundColor: "#F5E6D3", border: "1px solid #D4B896" }}>
            <div className="flex items-center gap-2"><CheckCircle size={22} style={{ color: "#C9A96E" }} /><div><p className="text-xs" style={{ color: "#6B1D40" }}>Job Selesai</p><p className="text-2xl font-bold" style={{ color: "#4A0E2E" }}>{stats.completed}</p></div></div>
          </div>
          <div className="rounded-xl p-4 shadow" style={{ backgroundColor: "#F5E6D3", border: "1px solid #D4B896" }}>
            <div className="flex items-center gap-2"><DollarSign size={22} style={{ color: "#800020" }} /><div><p className="text-xs" style={{ color: "#6B1D40" }}>Total Unit</p><p className="text-2xl font-bold" style={{ color: "#4A0E2E" }}>{stats.totalUnits}</p></div></div>
          </div>
          <div className="rounded-xl p-4 shadow" style={{ backgroundColor: "#800020", border: "1px solid #6B1D40" }}><div><p className="text-xs" style={{ color: "#F5E6D3" }}>Penghasilan</p><p className="text-xl font-bold" style={{ color: "#C9A96E" }}>Rp {stats.earnings.toLocaleString()}</p></div></div>
        </div>
        <div className="rounded-xl p-6 shadow" style={{ backgroundColor: "#F5E6D3", border: "1px solid #D4B896" }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#4A0E2E" }}>Akses Cepat</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <a href="/talent/jobs" className="p-3 rounded-lg text-center text-sm font-medium hover:opacity-80 transition" style={{ backgroundColor: "#800020", color: "#F5E6D3" }}>Tugas Saya</a>
            <a href="/talent/available" className="p-3 rounded-lg text-center text-sm font-medium hover:opacity-80 transition" style={{ backgroundColor: "#C9A96E", color: "#4A0E2E" }}>Job Tersedia</a>
            <a href="/talent/history" className="p-3 rounded-lg text-center text-sm font-medium hover:opacity-80 transition" style={{ backgroundColor: "#6B1D40", color: "#F5E6D3" }}>Riwayat</a>
            <a href="/talent/members" className="p-3 rounded-lg text-center text-sm font-medium hover:opacity-80 transition" style={{ backgroundColor: "#D4B896", color: "#4A0E2E" }}>Anggota Tim</a>
          </div>
        </div>
      </div>
    </div>
  )
}
