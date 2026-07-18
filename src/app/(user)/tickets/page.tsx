"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"

interface Ticket {
  id: string
  subject: string
  category: string
  status: string
  createdAt: string
  replies: { id: string; message: string; user: { name: string; role: string }; createdAt: string }[]
}

const categoryLabels: Record<string, string> = {
  BUG: "🐛 Bug",
  PERTANYAAN: "❓ Pertanyaan",
  SARAN: "💡 Saran",
}

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-500",
  IN_PROGRESS: "bg-yellow-500",
  CLOSED: "bg-gray-500",
}

export default function UserTicketsPage() {
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTicket, setNewTicket] = useState({ subject: "", category: "PERTANYAAN" })
  const [loading, setLoading] = useState(true)

  const fetchTickets = async () => {
    const res = await fetch("/api/tickets")
    const data = await res.json()
    setTickets(data.tickets || [])
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [])

  if (!session?.user) redirect("/login")

  const handleCreate = async () => {
    if (!newTicket.subject.trim()) return
    await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTicket),
    })
    setShowCreate(false)
    setNewTicket({ subject: "", category: "PERTANYAAN" })
    fetchTickets()
  }

  const handleSelectTicket = async (ticketId: string) => {
    const res = await fetch(`/api/tickets/${ticketId}`)
    const data = await res.json()
    setSelectedTicket(data.ticket || null)
  }

  if (loading) return <p className="text-center py-12">Memuat tiket...</p>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-heading text-3xl font-bold">Tiket Support</h1>
        <button onClick={() => setShowCreate(true)} className="bg-primary text-white px-4 py-2 rounded-full">Buat Tiket</button>
      </div>

      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3">Buat Tiket Baru</h3>
          <input
            placeholder="Judul / Subjek"
            value={newTicket.subject}
            onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
            className="border rounded px-3 py-2 w-full mb-3 bg-transparent"
          />
          <select
            value={newTicket.category}
            onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
            className="border rounded px-3 py-2 w-full mb-3 bg-transparent"
          >
            <option value="BUG">🐛 Bug</option>
            <option value="PERTANYAAN">❓ Pertanyaan</option>
            <option value="SARAN">💡 Saran</option>
          </select>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="bg-primary text-white px-4 py-2 rounded-full">Kirim</button>
            <button onClick={() => setShowCreate(false)} className="border px-4 py-2 rounded-full">Batal</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-4">Tiket Saya ({tickets.length})</h3>
          {tickets.length === 0 && <p className="text-sm text-gray-500">Belum ada tiket.</p>}
          {tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => handleSelectTicket(ticket.id)}
              className={`w-full text-left p-3 rounded-lg mb-2 border ${selectedTicket?.id === ticket.id ? "border-primary bg-primary/10" : "border-border hover:bg-card"}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{ticket.subject}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs text-white ${statusColors[ticket.status]}`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{categoryLabels[ticket.category]}</p>
            </button>
          ))}
        </div>

        <div className="md:col-span-2 bg-card border border-border rounded-xl p-4">
          {selectedTicket ? (
            <>
              <div className="mb-4">
                <h3 className="font-heading text-xl font-semibold">{selectedTicket.subject}</h3>
                <p className="text-sm text-gray-500">{categoryLabels[selectedTicket.category]} · Status: {selectedTicket.status}</p>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedTicket.replies?.map(reply => (
                  <div key={reply.id} className={`p-3 rounded-lg ${reply.user.role === "ADMIN" ? "bg-primary/10 ml-8" : "bg-gray-100 dark:bg-gray-800 mr-8"}`}>
                    <p className="text-xs text-gray-500 mb-1">{reply.user.name} ({reply.user.role}) · {new Date(reply.createdAt).toLocaleString("id-ID")}</p>
                    <p className="text-sm">{reply.message}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center py-12 text-gray-500">Pilih tiket untuk melihat detail.</p>
          )}
        </div>
      </div>
    </div>
  )
}