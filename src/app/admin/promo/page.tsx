"use client"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useSWRConfig } from "swr"

const promoTypes = [
  { value: "DISKON_TANGGAL", label: "Diskon Tanggal (Topup)" },
  { value: "JAM_SIBUK", label: "Jam Sibuk (Diskon Layanan)" },
]

const toLocalDatetime = (date: Date) => {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export default function AdminPromoPage() {
  const [promos, setPromos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    bannerUrl: "",
    promoType: "DISKON_TANGGAL",
    discount: 0,
    minAmount: 0,
    jamMulai: "",
    jamSelesai: "",
    startDate: "",
    endDate: "",
    isActive: true,
  })
  const { mutate } = useSWRConfig()

  const triggerPublicRefresh = () => {
    window.dispatchEvent(new Event("promo-updated"))
    localStorage.setItem("promoUpdated", Date.now().toString())
  }

  const fetchPromos = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/promo")
      const data = await res.json()
      setPromos(data.promos || [])
    } catch (err) { console.error("Gagal memuat promo:", err) } finally { setLoading(false) }
  }

  useEffect(() => { fetchPromos() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form }
    if (form.promoType !== "DISKON_TANGGAL") payload.minAmount = 0
    if (form.promoType !== "JAM_SIBUK") {
      payload.jamMulai = null
      payload.jamSelesai = null
    }
    if (editing) {
      await fetch("/api/admin/promo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...payload }),
      })
    } else {
      await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    }
    setShowForm(false); setEditing(null); fetchPromos()
    mutate("/api/promo")
    triggerPublicRefresh()
  }

  const handleEdit = (promo: any) => {
    setEditing(promo)
    setForm({
      title: promo.title,
      description: promo.description || "",
      bannerUrl: promo.bannerUrl || "",
      promoType: promo.promoType || "DISKON_TANGGAL",
      discount: promo.discount,
      minAmount: promo.minAmount,
      jamMulai: promo.jamMulai?.toString() || "",
      jamSelesai: promo.jamSelesai?.toString() || "",
      startDate: toLocalDatetime(new Date(promo.startDate)),
      endDate: toLocalDatetime(new Date(promo.endDate)),
      isActive: promo.isActive,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus promo ini?")) return
    await fetch(`/api/admin/promo?id=${id}`, { method: "DELETE" })
    fetchPromos()
    mutate("/api/promo")
    triggerPublicRefresh()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold">Manajemen Promo</h2>
        <button
          onClick={() => {
            setEditing(null)
            const now = new Date()
            setForm({ title: "", description: "", bannerUrl: "", promoType: "DISKON_TANGGAL", discount: 0, minAmount: 0, jamMulai: "", jamSelesai: "", startDate: toLocalDatetime(now), endDate: "", isActive: true })
            setShowForm(true)
          }}
          className="bg-primary text-white px-4 py-2 rounded-full flex items-center gap-2"
        ><Plus size={18} /> Tambah Promo</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 w-full max-w-md">
            <h3 className="font-heading font-semibold mb-4">{editing ? "Edit" : "Tambah"} Promo</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Judul Promo" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" required />
              <textarea placeholder="Deskripsi" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" />
              <input placeholder="URL Banner (opsional)" value={form.bannerUrl} onChange={e => setForm({ ...form, bannerUrl: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" />
              <div>
                <label className="text-xs">Tipe Promo</label>
                <select value={form.promoType} onChange={e => setForm({ ...form, promoType: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent">
                  {promoTypes.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs">Diskon (%)</label><input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} className="border rounded px-3 py-2 w-full bg-transparent" /></div>
                {form.promoType === "DISKON_TANGGAL" && (
                  <div><label className="text-xs">Min. Topup (Rp)</label><input type="number" value={form.minAmount} onChange={e => setForm({ ...form, minAmount: Number(e.target.value) })} className="border rounded px-3 py-2 w-full bg-transparent" /></div>
                )}
              </div>
              {form.promoType === "JAM_SIBUK" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs">Jam Mulai (0-23)</label><input type="number" min="0" max="23" value={form.jamMulai} onChange={e => setForm({ ...form, jamMulai: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" /></div>
                  <div><label className="text-xs">Jam Selesai (0-23)</label><input type="number" min="0" max="23" value={form.jamSelesai} onChange={e => setForm({ ...form, jamSelesai: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" /></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs">Mulai (WIB)</label><input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" required /></div>
                <div><label className="text-xs">Berakhir (WIB)</label><input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="border rounded px-3 py-2 w-full bg-transparent" required /></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Aktif</label>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-full">Batal</button>
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-full">{editing ? "Update" : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <p className="text-center py-12">Memuat...</p> : promos.length === 0 ? <p className="text-center py-12 text-gray-500">Belum ada promo.</p> : (
        <div className="space-y-4">
          {promos.map(promo => (
            <div key={promo.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{promo.title}</h3>
                <p className="text-sm text-gray-500">{promo.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Tipe: <span className="font-medium">{promoTypes.find(pt => pt.value === promo.promoType)?.label || promo.promoType}</span> · Diskon {promo.discount}%
                  {promo.minAmount > 0 && ` · Min. Rp ${promo.minAmount.toLocaleString()}`}
                  {promo.jamMulai != null && ` · Jam ${promo.jamMulai}-${promo.jamSelesai}`}
                  <br />
                  {new Date(promo.startDate).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })} - {new Date(promo.endDate).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}
                </p>
                <span className={`text-xs ${promo.isActive ? "text-green-500" : "text-red-500"}`}>{promo.isActive ? "Aktif" : "Nonaktif"}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(promo)} className="text-primary"><Edit size={16} /></button>
                <button onClick={() => handleDelete(promo.id)} className="text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
