"use client"
import { useState, useEffect } from "react"

interface Ticket {
  id: string
  subject: string
  category: string
  status: string
  createdAt: string
  user: { name: string; email: string }
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

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replyText, setReplyText] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchTickets = async () => {
    const res = await fetch("/api/admin/tickets")
    const data = await res.json()
    setTickets(data.tickets || [])
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [])

  const handleSelectTicket = async (ticket: Ticket) => {
    // Fetch detail tiket dengan balasan
    const res = await fetch(`/api/admin/tickets/${ticket.id}`)
    const data = await res.json()
    setSelectedTicket(data.ticket || null)
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return
    await fetch(`/api/admin/tickets/${selectedTicket.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: replyText }),
    })
    setReplyText("")
    handleSelectTicket(selectedTicket) // Refresh
    fetchTickets()
  }

  const handleCloseTicket = async (ticketId: string) => {
    await fetch(`/api/admin/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    })
    fetchTickets()
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: "CLOSED" })
    }
  }

  const handleReopenTicket = async (ticketId: string) => {
    await fetch(`/api/admin/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "OPEN" }),
    })
    fetchTickets()
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: "OPEN" })
    }
  }

  if (loading) return <p className="text-center py-12">Memuat tiket...</p>

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Customer Support Tiket</h2>
      <div className="grid grid-cols-3 gap-6">
        {/* List Tiket */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-4">Daftar Tiket ({tickets.length})</h3>
          {tickets.length === 0 && <p className="text-sm text-gray-500">Belum ada tiket.</p>}
          {tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => handleSelectTicket(ticket)}
              className={`w-full text-left p-3 rounded-lg mb-2 border ${selectedTicket?.id === ticket.id ? "border-primary bg-primary/10" : "border-border hover:bg-card"}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{ticket.subject}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs text-white ${statusColors[ticket.status]}`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{ticket.user.name} · {categoryLabels[ticket.category]}</p>
            </button>
          ))}
        </div>

        {/* Detail & Balasan */}
        <div className="col-span-2 bg-card border border-border rounded-xl p-4">
          {selectedTicket ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-heading text-xl font-semibold">{selectedTicket.subject}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedTicket.user.name} ({selectedTicket.user.email}) · {categoryLabels[selectedTicket.category]} · Dibuat {new Date(selectedTicket.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedTicket.status === "CLOSED" ? (
                    <button onClick={() => handleReopenTicket(selectedTicket.id)} className="border px-3 py-1 rounded-full text-sm">Buka Kembali</button>
                  ) : (
                    <button onClick={() => handleCloseTicket(selectedTicket.id)} className="border px-3 py-1 rounded-full text-sm">Tutup Tiket</button>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {selectedTicket.replies?.map(reply => (
                  <div key={reply.id} className={`p-3 rounded-lg ${reply.user.role === "ADMIN" ? "bg-primary/10 ml-8" : "bg-gray-100 dark:bg-gray-800 mr-8"}`}>
                    <p className="text-xs text-gray-500 mb-1">{reply.user.name} ({reply.user.role}) · {new Date(reply.createdAt).toLocaleString("id-ID")}</p>
                    <p className="text-sm">{reply.message}</p>
                  </div>
                ))}
              </div>

              {selectedTicket.status !== "CLOSED" && (
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Tulis balasan..."
                    rows={2}
                    className="border rounded px-3 py-2 flex-1 bg-transparent"
                  />
                  <button onClick={handleSendReply} className="bg-primary text-white px-4 py-2 rounded-full">Kirim</button>
                </div>
              )}
            </>
          ) : (
            <p className="text-center py-12 text-gray-500">Pilih tiket untuk melihat detail.</p>
          )}
        </div>
      </div>
    </div>
  )
}