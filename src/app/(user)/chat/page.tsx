"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import useSWR from "swr"
import { Send, User as UserIcon, Bot } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function UserChatPage() {
  const { data: session } = useSession()
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [contactingAdmin, setContactingAdmin] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const { data, mutate } = useSWR("/api/chat/user", fetcher, { refreshInterval: 5000 })
  const room = data?.room
  const messages = room?.messages || []

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!session?.user) redirect("/login")

  const handleSend = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    const res = await fetch("/api/chat/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    })
    if (res.ok) {
      setNewMessage("")
      mutate()
    }
    setSending(false)
  }

  const handleContactAdmin = async () => {
    setContactingAdmin(true)
    const res = await fetch("/api/chat/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: null, contactAdmin: true }),
    })
    if (res.ok) mutate()
    setContactingAdmin(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  }

  // Kelompokkan chat berdasarkan tanggal
  const groupedMessages: { date: string; msgs: any[] }[] = []
  let currentDate = ""
  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    if (msgDate !== currentDate) {
      groupedMessages.push({ date: msgDate, msgs: [] })
      currentDate = msgDate
    }
    groupedMessages[groupedMessages.length - 1].msgs.push(msg)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 h-[85vh] flex flex-col">
      <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4 mb-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-lg">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">Exha AI</h1>
            <p className="text-xs text-muted-foreground">Asisten virtual siap membantu 24/7</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 overflow-y-auto mb-4 space-y-4 shadow-inner">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Belum ada pesan. Mulai chat sekarang!</p>
          </div>
        )}
        {groupedMessages.map(group => (
          <div key={group.date}>
            <p className="text-center text-xs text-muted-foreground my-3 bg-background/50 inline-block px-3 py-1 rounded-full mx-auto w-fit">
              {group.date}
            </p>
            {group.msgs.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-3`}>
                <div className={`max-w-[80%] p-3 rounded-2xl shadow-md ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : msg.role === "ai"
                    ? "bg-card/90 backdrop-blur-md border border-border/50 rounded-bl-md"
                    : "bg-green-500/20 border border-green-500/30 rounded-bl-md"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="gambar" className="max-w-full rounded-lg mt-2" onClick={() => window.open(msg.imageUrl, "_blank")} />
                  )}
                  {msg.audioUrl && (
                    <audio controls src={msg.audioUrl} className="mt-2 w-full max-w-[200px] h-8" />
                  )}
                  <p className="text-[10px] mt-1 opacity-70 flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      {msg.role === "user" ? <><UserIcon size={10} /> Anda</> : msg.role === "ai" ? <><Bot size={10} /> Exha AI</> : <><UserIcon size={10} /> Admin</>}
                    </span>
                    <span>{formatTime(msg.createdAt)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 flex items-center gap-2 shadow-lg">
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pesan..."
          className="flex-1 bg-transparent resize-none text-sm px-3 py-2 focus:outline-none max-h-24"
          rows={1}
          disabled={sending}
        />
        <button onClick={handleSend} disabled={sending} className="bg-primary text-white p-2.5 rounded-xl disabled:opacity-50 hover:shadow-lg hover:shadow-primary/30 transition-all">
          <Send size={16} />
        </button>
        <button
          onClick={handleContactAdmin}
          disabled={contactingAdmin}
          className="text-xs font-medium text-yellow-600 bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 rounded-xl whitespace-nowrap hover:bg-yellow-500/20 transition-all disabled:opacity-50"
        >
          {contactingAdmin ? "..." : "Hubungi Admin"}
        </button>
      </div>
    </div>
  )
}