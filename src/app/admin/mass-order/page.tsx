"use client"
import { useState } from "react"

interface PreviewItem {
  targetLink: string
  profileName: string
  quantity: number
}

export default function AdminMassOrderPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewItem[]>([])
  const [serviceId, setServiceId] = useState("")
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [userId, setUserId] = useState("") // admin memilih user

  const fetchServices = async () => {
    const res = await fetch("/api/admin/services")
    const data = await res.json()
    setServices(data.platforms?.flatMap((p: any) => p.services) || [])
  }

  useState(() => {
    fetchServices()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split("\n").filter(line => line.trim())
      if (lines.length < 2) {
        setError("File CSV harus memiliki header dan minimal 1 baris data")
        return
      }
      const headers = lines[0].toLowerCase().split(",").map(h => h.trim())
      const requiredHeaders = ["targetlink", "profilename", "quantity"]
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      if (missingHeaders.length > 0) {
        setError(`Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}`)
        return
      }

      const items: PreviewItem[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim())
        if (values.length !== 3) continue
        const quantity = parseInt(values[2])
        if (isNaN(quantity) || quantity <= 0) continue
        items.push({
          targetLink: values[0],
          profileName: values[1],
          quantity,
        })
      }
      setPreview(items)
      setError("")
    }
    reader.readAsText(selectedFile)
  }

  const handleSubmit = async () => {
    if (!serviceId || !userId || preview.length === 0) return alert("Lengkapi semua field")
    setLoading(true)
    const res = await fetch("/api/admin/mass-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, serviceId, items: preview }),
    })
    if (res.ok) {
      alert("Order berhasil dibuat!")
      setPreview([])
      setFile(null)
    } else {
      alert("Gagal membuat mass order")
    }
    setLoading(false)
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Mass Order (Admin)</h2>
      <div className="bg-card border border-border rounded-xl p-6 max-w-4xl">
        <p className="text-sm text-gray-500 mb-4">
          Upload CSV dengan format: targetLink, profileName, quantity
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2">User ID (atau email)</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="Masukkan email user"
              className="border rounded px-3 py-2 w-full bg-transparent"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Pilih Layanan</label>
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="border rounded px-3 py-2 w-full bg-transparent"
            >
              <option value="">Pilih Layanan</option>
              {services.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">File CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {preview.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">Preview ({preview.length} item)</p>
            <div className="max-h-60 overflow-y-auto border rounded p-2">
              {preview.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span>{item.targetLink}</span>
                  <span>{item.profileName}</span>
                  <span>{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={!file || !serviceId || !userId || loading}
          className="bg-primary text-white px-6 py-2 rounded-full disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Buat Order"}
        </button>
      </div>
    </div>
  )
}