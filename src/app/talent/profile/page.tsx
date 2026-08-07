"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { User, Mail, Shield, Save } from "lucide-react"
import InfoBanner from "@/components/InfoBanner"

export default function TalentProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user?.role !== "TALENT") { router.push("/login"); return }
    fetchProfile()
  }, [status])

  const fetchProfile = async () => {
    const res = await fetch("/api/profile")
    const data = await res.json()
    setProfile(data)
    setName(data.name || "")
    setPhone(data.phone || "")
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ color: "#4A0E2E" }}>Profil Saya</h1>
      <InfoBanner id="talent-profile">
        👤 <strong>Profil Saya</strong> menampilkan informasi akun kamu. Kamu bisa mengubah nama dan nomor telepon. Email tidak dapat diubah. Klik <strong>Simpan Profil</strong> setelah selesai mengedit.
      </InfoBanner>
      {loading ? <p className="p-4 text-center" style={{ color: "#6B1D40" }}>Memuat profil...</p> : (
        <div className="rounded-xl p-6 shadow space-y-4" style={{ backgroundColor: "#F5E6D3", border: "1px solid #D4B896" }}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: "#800020", color: "#F5E6D3" }}>{profile?.name?.[0] || "T"}</div>
            <div><p className="font-semibold text-lg" style={{ color: "#4A0E2E" }}>{profile?.name}</p><p className="text-sm" style={{ color: "#6B1D40" }}>{profile?.email}</p><span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">TALENT</span></div>
          </div>
          <div className="border-t pt-4" style={{ borderColor: "#D4B896" }}><label className="block text-sm mb-1 font-medium" style={{ color: "#4A0E2E" }}><User size={14} className="inline mr-1" /> Nama</label><input value={name} onChange={e => setName(e.target.value)} className="border rounded px-3 py-2 w-full" style={{ backgroundColor: "#FAF7F2", borderColor: "#D4B896", color: "#4A0E2E" }} /></div>
          <div><label className="block text-sm mb-1 font-medium" style={{ color: "#4A0E2E" }}><Mail size={14} className="inline mr-1" /> Email</label><input value={profile?.email || ""} disabled className="border rounded px-3 py-2 w-full opacity-60" style={{ backgroundColor: "#FAF7F2", borderColor: "#D4B896" }} /></div>
          <div><label className="block text-sm mb-1 font-medium" style={{ color: "#4A0E2E" }}>Telepon</label><input value={phone} onChange={e => setPhone(e.target.value)} className="border rounded px-3 py-2 w-full" style={{ backgroundColor: "#FAF7F2", borderColor: "#D4B896", color: "#4A0E2E" }} /></div>
          {message && <p className="text-sm text-green-600">{message}</p>}
          <button onClick={async () => { setSaving(true); await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone }) }); setMessage("Profil berhasil disimpan"); setSaving(false) }} disabled={saving} className="px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium" style={{ backgroundColor: "#800020", color: "#F5E6D3" }}><Save size={16} /> {saving ? "Menyimpan..." : "Simpan Profil"}</button>
        </div>
      )}
    </div>
  )
}
