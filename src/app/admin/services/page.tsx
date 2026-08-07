"use client"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Trash2, Plus, X } from "lucide-react"

const badgeOptions = [
  { value: "", label: "Tidak ada" },
  { value: "popular", label: "Terpopuler" },
  { value: "hemat", label: "Hemat" },
  { value: "flashsale", label: "Flash Sale" },
  { value: "baru", label: "Baru" },
  { value: "terbatas", label: "Stok Terbatas" },
]

export default function AdminServicesPage() {
  const [platforms, setPlatforms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [showPlatformForm, setShowPlatformForm] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [newPlatform, setNewPlatform] = useState("")
  const [form, setForm] = useState({
    platformId: "", name: "", minOrder: 10, pricePerUnit: 20000, bundlePrice: 0, serviceType: "SINGLE",
    bundleItems: [] as { serviceId: string; name: string; quantity: number; pricePerUnit: number; minOrder: number }[],
    hasGaransi: false, badge: "", isActive: true,
  })

  const handleToggleActive = async (id: string, current: boolean) => {
    await fetch("/api/admin/services", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: !current }) })
    fetchPlatforms()
  }

  const fetchPlatforms = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/services?page=${page}&limit=5`)
    const data = await res.json()
    setPlatforms(data.platforms || [])
    setTotalPages(data.pagination?.totalPages || 1)
    setLoading(false)
  }

  useEffect(() => { fetchPlatforms() }, [page])

  const handleAddPlatform = async () => {
    if (!newPlatform.trim()) return
    await fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "platform", name: newPlatform }) })
    setNewPlatform(""); setShowPlatformForm(false); fetchPlatforms()
  }

  const handleDeletePlatform = async (id: string) => {
    if (!confirm("Hapus platform ini?")) return
    await fetch(`/api/admin/services?id=${id}&type=platform`, { method: "DELETE" })
    fetchPlatforms()
  }

  const handleAddOrEditService = async () => {
    if (!form.platformId || !form.name) return
    const payload: any = {
      platformId: form.platformId, name: form.name, minOrder: form.minOrder,
      pricePerUnit: form.pricePerUnit, bundlePrice: form.serviceType === "BUNDLE" ? form.bundlePrice : null,
      serviceType: form.serviceType, bundleItems: form.serviceType === "BUNDLE" ? form.bundleItems : null,
      hasGaransi: form.hasGaransi, badge: form.badge || null, isActive: form.isActive,
    }
    if (editingService) {
      await fetch("/api/admin/services", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingService.id, ...payload }) })
    } else {
      await fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "service", ...payload }) })
    }
    setShowServiceForm(false); setEditingService(null)
    setForm({ platformId: "", name: "", minOrder: 10, pricePerUnit: 20000, bundlePrice: 0, serviceType: "SINGLE", bundleItems: [], hasGaransi: false, badge: "", isActive: true })
    fetchPlatforms()
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm("Hapus layanan ini?")) return
    await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" })
    fetchPlatforms()
  }

  const servicesForSelectedPlatform = form.platformId
    ? (platforms.find(p => p.id === form.platformId)?.services || []).filter((s: any) => s.type !== "BUNDLE")
    : []

  const addBundleItem = () => {
    setForm({ ...form, bundleItems: [...form.bundleItems, { serviceId: "", name: "", quantity: 1000, pricePerUnit: 0, minOrder: 1000 }] })
  }
  const removeBundleItem = (index: number) => {
    setForm({ ...form, bundleItems: form.bundleItems.filter((_, i) => i !== index) })
  }
  const updateBundleItem = (index: number, field: string, value: any) => {
    const newItems = [...form.bundleItems]
    if (field === "serviceId") {
      const selectedService = servicesForSelectedPlatform.find((s: any) => s.id === value)
      newItems[index] = {
        ...newItems[index],
        serviceId: value,
        name: selectedService?.name || "",
        pricePerUnit: selectedService?.pricePerUnit || 0,
        minOrder: selectedService?.minOrder || 10,
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    setForm({ ...form, bundleItems: newItems })
  }

  const getItemPrice = (item: { pricePerUnit: number; quantity: number; minOrder: number }) => {
    if (!item.minOrder || item.minOrder <= 0) return 0
    return Math.round((item.pricePerUnit / item.minOrder) * item.quantity)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold">Manajemen Jasa Layanan</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowPlatformForm(true)} className="border border-border px-4 py-2 rounded-full">+ Platform</button>
          <button onClick={() => { setShowServiceForm(true); setEditingService(null) }} className="bg-primary text-white px-4 py-2 rounded-full">+ Layanan</button>
        </div>
      </div>

      {showPlatformForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 w-96">
            <h3 className="font-heading font-semibold mb-4">Tambah Platform Baru</h3>
            <input placeholder="Nama platform" value={newPlatform} onChange={e => setNewPlatform(e.target.value)} className="border rounded px-3 py-2 w-full mb-4 bg-transparent" />
            <div className="flex gap-2 justify-end"><button onClick={() => setShowPlatformForm(false)} className="border px-4 py-2 rounded-full">Batal</button><button onClick={handleAddPlatform} className="bg-primary text-white px-4 py-2 rounded-full">Simpan</button></div>
          </div>
        </div>
      )}

      {showServiceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 w-[550px] max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading font-semibold mb-4">{editingService ? "Edit" : "Tambah"} Layanan</h3>
            <div className="grid grid-cols-2 gap-4">
              <select value={form.platformId} onChange={e => setForm({ ...form, platformId: e.target.value, bundleItems: [] })} className="border rounded px-3 py-2 bg-transparent"><option value="">Pilih Platform</option>{platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <input placeholder="Nama Layanan" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
              <input type="number" placeholder="Min Order" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: Number(e.target.value) })} className="border rounded px-3 py-2 bg-transparent" />
              <input type="number" placeholder="Harga per Min Order (Rp)" value={form.pricePerUnit} onChange={e => setForm({ ...form, pricePerUnit: Number(e.target.value) })} className="border rounded px-3 py-2 bg-transparent" />
              <select value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })} className="border rounded px-3 py-2 bg-transparent"><option value="SINGLE">Layanan Biasa</option><option value="BUNDLE">Bundling</option></select>
              {form.serviceType === "BUNDLE" && <div><label className="block text-sm mb-1 font-medium">Harga Paket (Rp)</label><input type="number" placeholder="Harga Paket" value={form.bundlePrice || 0} onChange={e => setForm({ ...form, bundlePrice: Number(e.target.value) })} className="border rounded px-3 py-2 bg-transparent w-full" /></div>}
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Aktif</label>
              <div><label className="block text-sm mb-1 font-medium">Garansi</label><select value={form.hasGaransi ? "ya" : "tidak"} onChange={e => setForm({ ...form, hasGaransi: e.target.value === "ya" })} className="border rounded px-3 py-2 bg-transparent w-full"><option value="tidak">Non-Garansi</option><option value="ya">Bergaransi</option></select></div>
              <div><label className="block text-sm mb-1 font-medium">Badge (Ribbon)</label><select value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} className="border rounded px-3 py-2 bg-transparent w-full">{badgeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
            </div>
            {form.serviceType === "BUNDLE" && (
              <div className="mt-4 border-t pt-4">
                <h4 className="font-semibold mb-2">Isi Paket Bundling</h4>
                {form.platformId ? (
                  <>
                    {form.bundleItems.map((item, i) => {
                      const selectedService = servicesForSelectedPlatform.find((s: any) => s.id === item.serviceId)
                      const serviceMinOrder = selectedService?.minOrder || 10
                      const itemPrice = getItemPrice(item)
                      return (
                        <div key={i} className="flex gap-2 mb-2 items-center text-sm">
                          <select value={item.serviceId} onChange={e => updateBundleItem(i, "serviceId", e.target.value)} className="border rounded px-2 py-1 bg-transparent flex-1"><option value="">Pilih Layanan</option>{servicesForSelectedPlatform.map((s: any) => <option key={s.id} value={s.id}>{s.name} - Rp{s.pricePerUnit.toLocaleString()}/{s.minOrder}</option>)}</select>
                          <input type="number" placeholder="Jumlah" value={item.quantity} onChange={e => updateBundleItem(i, "quantity", Number(e.target.value))} className="border rounded px-2 py-1 w-20 bg-transparent" />
                          <span className="text-xs text-gray-500">Rp {itemPrice.toLocaleString()}</span>
                          <button onClick={() => removeBundleItem(i)} className="text-red-500"><X size={16} /></button>
                        </div>
                      )
                    })}
                    <button onClick={addBundleItem} className="text-primary text-sm flex items-center gap-1 mt-2"><Plus size={14} /> Tambah Layanan</button>
                  </>
                ) : <p className="text-sm text-gray-500">Silakan pilih platform terlebih dahulu.</p>}
              </div>
            )}
            <div className="flex gap-2 mt-4 justify-end"><button onClick={() => setShowServiceForm(false)} className="border px-4 py-2 rounded-full">Batal</button><button onClick={handleAddOrEditService} className="bg-primary text-white px-4 py-2 rounded-full">{editingService ? "Update" : "Tambah"}</button></div>
          </div>
        </div>
      )}

      {loading ? <p className="text-center py-12">Memuat...</p> : (
        <>
          {platforms.map(platform => (
            <div key={platform.id} className="bg-card border border-border rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2"><h3 className="font-heading font-semibold">{platform.name}</h3><button onClick={() => handleDeletePlatform(platform.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button></div>
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2">Layanan</th><th className="text-left py-2">Tipe</th><th className="text-left py-2">Min Order</th><th className="text-left py-2">Harga</th><th className="text-left py-2">Garansi</th><th className="text-left py-2">Badge</th><th className="text-left py-2">Status</th><th className="text-left py-2">Aksi</th></tr></thead><tbody>{platform.services?.map((s: any) => (<tr key={s.id} className="border-b"><td className="py-2">{s.name}</td><td className="py-2"><span className={`text-xs px-1.5 py-0.5 rounded-full ${s.type === "BUNDLE" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>{s.type === "BUNDLE" ? "Bundling" : "Single"}</span></td><td className="py-2">{s.minOrder}</td><td className="py-2">{s.type === "BUNDLE" && s.bundlePrice ? `Rp ${s.bundlePrice.toLocaleString()} (paket)` : `Rp ${s.pricePerUnit.toLocaleString()} / ${s.minOrder}`}</td><td className="py-2">{s.hasGaransi ? "✅" : "❌"}</td><td className="py-2">{s.badge || "-"}</td><td className="py-2"><button onClick={() => handleToggleActive(s.id, s.isActive)} className={`px-2 py-0.5 rounded-full text-xs ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.isActive ? "Aktif" : "Nonaktif"}</button></td><td className="py-2 flex gap-2"><button onClick={() => { setEditingService(s); setForm({ platformId: s.platformId, name: s.name, minOrder: s.minOrder, pricePerUnit: s.pricePerUnit, bundlePrice: s.bundlePrice || 0, serviceType: s.type || "SINGLE", bundleItems: s.bundleItems || [], hasGaransi: s.hasGaransi || false, badge: s.badge || "", isActive: s.isActive }); setShowServiceForm(true) }} className="text-primary">Edit</button><button onClick={() => handleDeleteService(s.id)} className="text-red-500">Hapus</button></td></tr>))}</tbody></table></div>
            </div>
          ))}
          {totalPages > 1 && (<div className="flex justify-center items-center gap-2 mt-6"><button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-2 border rounded-full disabled:opacity-50"><ChevronLeft size={18} /></button>{Array.from({ length: totalPages }, (_, i) => i + 1).map(p => <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-full text-sm ${p === page ? "bg-primary text-white" : "border hover:bg-primary/10"}`}>{p}</button>)}<button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="p-2 border rounded-full disabled:opacity-50"><ChevronRight size={18} /></button></div>)}
        </>
      )}
    </div>
  )
}
