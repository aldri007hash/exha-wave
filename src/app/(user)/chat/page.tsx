"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Send, Bot, User as UserIcon, Phone } from "lucide-react"

interface Message { id: string; role: string; content?: string; imageUrl?: string; audioUrl?: string; createdAt: string }

export default function ChatPage() {
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (status === "unauthenticated") redirect("/login") }, [status])
  useEffect(() => { if (status === "authenticated") fetchMessages() }, [status])

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat/user")
      const data = await res.json()
      setMessages(data.room?.messages || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return
    setLoading(true)
    const tempMsg: Message = { id: Date.now().toString(), role: "user", content, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, tempMsg])
    setInput("")
    try {
      const res = await fetch("/api/chat/user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) })
      if (res.ok) { fetchMessages() }
    } catch { alert("Gagal mengirim pesan") }
    setLoading(false)
  }

  const handleHubungiAdmin = async () => {
    await fetch("/api/chat/user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: "User ingin menghubungi admin.", contactAdmin: true }) })
    fetchMessages()
  }

  if (status === "loading") return <div className="text-center py-12">Memeriksa sesi...</div>

  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold mb-6">Live Chat</h1>
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl ${msg.role === "user" ? "bg-primary text-white rounded-br-md" : "bg-card/90 border border-border/50 rounded-bl-md"}`}>
                {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                <p className="text-[10px] mt-1 opacity-70 flex justify-between items-center">
                  <span className="flex items-center gap-1">{msg.role === "user" ? <><UserIcon size={10} /> User</> : <><Bot size={10} /> AI</>}</span>
                  <span>{formatTime(msg.createdAt)}</span>
                </p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 flex items-center gap-2 shadow-lg">
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Ketik pesan..." className="flex-1 bg-transparent resize-none text-sm px-3 py-2 focus:outline-none max-h-24" rows={1} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }} />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="bg-primary text-white p-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-1 disabled:opacity-50"><Send size={14} /> Kirim</button>
        </div>
        <button onClick={handleHubungiAdmin} className="mt-3 w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-red-600 transition-colors"><Phone size={16} /> Hubungi Admin</button>
      </div>
    </div>
  )
}
