"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Edit3, Upload } from "lucide-react"

export default function AdminPaymentsPage() {
  const [methods, setMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    type: "bank_transfer",
    accountNumber: "",
    accountName: "",
    instructions: "",
    qrisImage: "",
  })

  const fetchMethods = async () => {
    const res = await fetch("/api/admin/payments")
    const data = await res.json()
    setMethods(data.methods || [])
    setLoading(false)
  }

  useEffect(() => { fetchMethods() }, [])

  const handleSubmit = async () => {
    if (!form.name) return
    if (editingId) {
      await fetch("/api/admin/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form }),
      })
    } else {
      await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    }
    setShowForm(false)
    setEditingId(null)
    setForm({ name: "", type: "bank_transfer", accountNumber: "", accountName: "", instructions: "", qrisImage: "" })
    fetchMethods()
  }

  const handleEdit = (m: any) => {
    setForm(m)
    setEditingId(m.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus metode ini?")) return
    await fetch(`/api/admin/payments?id=${id}`, { method: "DELETE" })
    fetchMethods()
  }

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "exha_wave_payment")
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloudName) return alert("Cloudinary belum dikonfigurasi")
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData })
    const data = await res.json()
    if (data.secure_url) {
      setForm({ ...form, qrisImage: data.secure_url })
    }
  }

  if (loading) return <p className="text-center py-12">Memuat...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold">Metode Pembayaran</h2>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", type: "bank_transfer", accountNumber: "", accountName: "", instructions: "", qrisImage: "" }) }} className="bg-primary text-white px-4 py-2 rounded-full flex items-center gap-2">
          <Plus size={16} /> Tambah
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3">{editingId ? "Edit" : "Tambah"} Metode</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Nama (contoh: BCA)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="border rounded px-3 py-2 bg-transparent">
              <option value="bank_transfer">Transfer Bank</option>
              <option value="qris">QRIS</option>
              <option value="ewallet">E-Wallet</option>
            </select>
            {form.type !== "qris" && (
              <>
                <input placeholder="Nomor Rekening" value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
                <input placeholder="Nama Pemilik" value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
              </>
            )}
            {form.type === "qris" && (
              <div className="col-span-2">
                <label className="text-sm mb-1 block">Gambar QRIS</label>
                <input type="file" accept="image/*" onChange={handleQrisUpload} />
                {form.qrisImage && <img src={form.qrisImage} alt="QRIS" className="w-32 mt-2" />}
              </div>
            )}
            <textarea
              placeholder="Instruksi Pembayaran"
              value={form.instructions}
              onChange={e => setForm({ ...form, instructions: e.target.value })}
              rows={3}
              className="col-span-2 border rounded px-3 py-2 bg-transparent"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSubmit} className="bg-primary text-white px-4 py-2 rounded-full">Simpan</button>
            <button onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-full">Batal</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Nama</th>
              <th className="text-left py-2">Tipe</th>
              <th className="text-left py-2">Nomor/Akun</th>
              <th className="text-left py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {methods.map((m: any) => (
              <tr key={m.id} className="border-b">
                <td className="py-2">{m.name}</td>
                <td className="py-2">{m.type}</td>
                <td className="py-2">{m.accountNumber || "QRIS"}</td>
                <td className="py-2 flex gap-2">
                  <button onClick={() => handleEdit(m)}><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(m.id)} className="text-red-500"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}