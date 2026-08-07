"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Copy, CheckCircle, XCircle } from "lucide-react"

export default function AdminApiKeysPage() {
  const [activeTab, setActiveTab] = useState<"keys" | "requests">("keys")
  const [keys, setKeys] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")

  const fetchKeys = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/api-keys")
      const data = await res.json()
      setKeys(data.keys || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/reseller-requests")
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchKeys(); fetchRequests() }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    await fetch("/api/admin/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })
    setName(""); setShowForm(false); fetchKeys()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus API key ini? Pengguna tidak akan bisa mengakses API lagi.")) return
    await fetch(`/api/admin/api-keys?id=${id}`, { method: "DELETE" })
    fetchKeys()
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    alert("API Key disalin!")
  }

  const handleApprove = async (requestId: string) => {
    const reason = prompt("Catatan untuk reseller (opsional):")
    await fetch("/api/admin/reseller-requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: requestId, action: "approve", reason }),
    })
    fetchRequests(); fetchKeys()
  }

  const handleReject = async (requestId: string) => {
    const reason = prompt("Alasan penolakan:")
    if (!reason) return
    await fetch("/api/admin/reseller-requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: requestId, action: "reject", reason }),
    })
    fetchRequests()
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Manajemen API Key</h2>

      {/* Tab */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab("keys")} className={`px-4 py-2 rounded-full font-medium ${activeTab === "keys" ? "bg-primary text-white" : "border border-border"}`}>
          API Keys
        </button>
        <button onClick={() => setActiveTab("requests")} className={`px-4 py-2 rounded-full font-medium ${activeTab === "requests" ? "bg-primary text-white" : "border border-border"}`}>
          Permintaan Reseller ({requests.filter(r => r.status === "PENDING").length})
        </button>
      </div>

      {activeTab === "keys" ? (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowForm(true)} className="bg-primary text-white px-4 py-2 rounded-full flex items-center gap-2">
              <Plus size={18} /> Tambah API Key
            </button>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background rounded-xl p-6 w-full max-w-md">
                <h3 className="font-heading font-semibold mb-4">Buat API Key Baru</h3>
                <input placeholder="Nama (misal: Reseller A)" value={name} onChange={e => setName(e.target.value)} className="border rounded px-3 py-2 w-full mb-4 bg-transparent" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-full">Batal</button>
                  <button onClick={handleCreate} className="bg-primary text-white px-4 py-2 rounded-full">Simpan</button>
                </div>
              </div>
            </div>
          )}

          {loading ? <p className="text-center py-12">Memuat...</p> : keys.length === 0 ? <p className="text-center py-12 text-gray-500">Belum ada API Key.</p> : (
            <div className="space-y-4">
              {keys.map(apiKey => (
                <div key={apiKey.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{apiKey.name}</p>
                      <p className="text-xs text-muted-foreground font-mono break-all mt-1">{apiKey.key}</p>
                      <span className={`text-xs mt-1 inline-block ${apiKey.isActive ? "text-green-500" : "text-red-500"}`}>
                        {apiKey.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => copyKey(apiKey.key)} className="text-primary p-2 hover:bg-primary/10 rounded-full flex-shrink-0" title="Salin API Key">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => handleDelete(apiKey.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full flex-shrink-0" title="Hapus API Key">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div>
          {requests.length === 0 ? <p className="text-center py-12 text-gray-500">Belum ada permintaan.</p> : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{req.name}</p>
                      <p className="text-sm text-muted-foreground">{req.email}</p>
                      {req.businessName && <p className="text-sm text-muted-foreground">Bisnis: {req.businessName}</p>}
                      {req.notes && <p className="text-sm text-muted-foreground">Catatan: {req.notes}</p>}
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${
                        req.status === "PENDING" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" :
                        req.status === "APPROVED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}>
                        {req.status === "PENDING" ? "Pending" : req.status === "APPROVED" ? "Disetujui" : "Ditolak"}
                      </span>
                    </div>
                    {req.status === "PENDING" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleApprove(req.id)} className="text-green-500 p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full" title="Setujui">
                          <CheckCircle size={18} />
                        </button>
                        <button onClick={() => handleReject(req.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full" title="Tolak">
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
