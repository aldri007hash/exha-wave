"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, CreditCard } from "lucide-react"
import InfoBanner from "@/components/InfoBanner"

export default function TalentPaymentMethodsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [methods, setMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [accountName, setAccountName] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || session?.user?.role !== "TALENT") { router.push("/login"); return }
    fetchMethods()
  }, [status])

  const fetchMethods = async () => {
    const res = await fetch("/api/talent/payment-methods")
    const data = await res.json()
    setMethods(data.methods || [])
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ color: "#4A0E2E" }}>Metode Pembayaran</h1>
      <InfoBanner id="talent-payment-methods">
        💳 <strong>Metode Pembayaran</strong> digunakan untuk menyimpan informasi rekening bank atau e-wallet kamu. Admin akan melihat data ini untuk mengirim pembayaran gaji. Tambahkan minimal satu metode pembayaran.
      </InfoBanner>
      <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: "#800020", color: "#F5E6D3" }}><Plus size={16} /> Tambah</button>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="rounded-xl p-6 w-full max-w-md" style={{ backgroundColor: "#FAF7F2", border: "2px solid #C9A96E" }}>
          <h3 className="font-semibold mb-4" style={{ color: "#4A0E2E" }}>Tambah Metode Pembayaran</h3>
          <form onSubmit={async (e) => { e.preventDefault(); if (!accountName || !bankName || !accountNumber) return; setSaving(true); await fetch("/api/talent/payment-methods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountName, bankName, accountNumber, note }) }); setAccountName(""); setBankName(""); setAccountNumber(""); setNote(""); setShowForm(false); fetchMethods(); setSaving(false) }} className="space-y-3">
            <div><label className="text-sm" style={{ color: "#4A0E2E" }}>Nama Penerima * <span className="text-xs text-gray-400">(Nama pemilik rekening)</span></label><input value={accountName} onChange={e => setAccountName(e.target.value)} className="border rounded px-3 py-2 w-full" style={{ borderColor: "#D4B896" }} required /></div>
            <div><label className="text-sm" style={{ color: "#4A0E2E" }}>Nama Bank/E-Wallet * <span className="text-xs text-gray-400">(Contoh: BRI, DANA, OVO)</span></label><input value={bankName} onChange={e => setBankName(e.target.value)} className="border rounded px-3 py-2 w-full" style={{ borderColor: "#D4B896" }} required /></div>
            <div><label className="text-sm" style={{ color: "#4A0E2E" }}>Nomor Rekening/HP *</label><input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="border rounded px-3 py-2 w-full" style={{ borderColor: "#D4B896" }} required /></div>
            <div><label className="text-sm" style={{ color: "#4A0E2E" }}>Catatan (opsional)</label><textarea value={note} onChange={e => setNote(e.target.value)} className="border rounded px-3 py-2 w-full" style={{ borderColor: "#D4B896" }} rows={2} /></div>
            <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-full" style={{ borderColor: "#D4B896", color: "#4A0E2E" }}>Batal</button><button type="submit" disabled={saving} className="px-4 py-2 rounded-full text-white" style={{ backgroundColor: "#800020" }}>{saving ? "Menyimpan..." : "Simpan"}</button></div>
          </form>
        </div></div>
      )}
      {loading ? <p>Memuat...</p> : methods.length === 0 ? <p className="text-center py-8" style={{ color: "#6B1D40" }}>Belum ada metode pembayaran.</p> : (
        <div className="space-y-3">
          {methods.map((m: any) => (
            <div key={m.id} className="flex justify-between items-center rounded-xl p-4 shadow" style={{ backgroundColor: "#F5E6D3", border: "1px solid #D4B896" }}>
              <div><p className="font-semibold" style={{ color: "#4A0E2E" }}>{m.bankName} - {m.accountNumber}</p><p className="text-sm" style={{ color: "#6B1D40" }}>A/N: {m.accountName}</p>{m.note && <p className="text-xs" style={{ color: "#D4B896" }}>{m.note}</p>}</div>
              <button onClick={() => { if (!confirm("Hapus metode ini?")) return; fetch(`/api/talent/payment-methods?id=${m.id}`, { method: "DELETE" }); fetchMethods() }} className="text-red-500"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
