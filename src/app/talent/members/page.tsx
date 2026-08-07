"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Users } from "lucide-react"
import InfoBanner from "@/components/InfoBanner"

export default function MembersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user?.role !== "TALENT") { router.push("/login"); return }
    fetchMembers()
  }, [status])

  const fetchMembers = async () => {
    const res = await fetch("/api/talent/members")
    const data = await res.json()
    setMembers(data.members || [])
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2" style={{ color: "#4A0E2E" }}><Users size={28} /> Anggota Tim</h1>
      <InfoBanner id="talent-members">
        👥 <strong>Anggota Tim</strong> menampilkan daftar semua talent yang terdaftar di Exha Wave. Kamu bisa melihat nama dan email rekan satu tim.
      </InfoBanner>
      {loading ? <p>Memuat...</p> : members.length === 0 ? <p>Belum ada anggota tim.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map(member => (
            <div key={member.id} className="rounded-xl p-4 shadow flex items-center gap-4" style={{ backgroundColor: "#F5E6D3", border: "1px solid #D4B896" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: "#800020", color: "#F5E6D3" }}>{member.name[0]}</div>
              <div><p className="font-semibold" style={{ color: "#4A0E2E" }}>{member.name}</p><p className="text-xs" style={{ color: "#6B1D40" }}>{member.email}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
